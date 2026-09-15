# SPMB JABAR Phase 2 Engines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the verification, selection, and notification engines from the Phase 2 design spec, replacing the Phase-1 age-sort selection stub with a configurable rules-based engine.

**Architecture:** Field-level `VerificationEngine` writes advisory evidence at registration submit; a DB-configurable `SelectionEngine` ranks verified registrations per school against quota with dry-run/publish; a `NotificationBus` fans events to a `DatabaseChannel` + `LogChannel` stub. All three are pure services; controllers stay thin; React reads through Inertia as today.

**Tech Stack:** Laravel 12, PostgreSQL 16 (port 5433, db `spmb_jabar_test` for tests), Pest 3, Inertia + React 19, Tailwind v4 (Jabar Civic Portal tokens: `brand-700` `#0D5C3A`, `ink`, `ink-soft`, `ink-faint`, `surface-container-low`, `outline-variant`, `rounded-8`).

**Spec:** `docs/superpowers/specs/2026-09-15-spmb-jabar-phase2-engines-design.md`

## Global Constraints

- All engine services implement the contracts exactly as named; no new composer/npm packages.
- Every code task is TDD: write the failing test, confirm it fails, implement, confirm it passes, commit.
- All commands run from `backend/` unless a full path is given (`cd backend` if starting elsewhere).
- DB for tests: `spmb_jabar_test` (already configured in `phpunit.xml`, `$seed = true` in `TestCase`).
- Admin-only actions guard with the existing `role:admin_provinsi` middleware + route, except `verifikator` stays on verification routes.
- UI copy is Indonesian, matching existing pages. Design tokens only — no new colors.
- Audit every state transition via `App\Support\Audit::log()` (existing).
- Commit messages end with `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

---

### Task 1: Migrations — students + registrations evidence; StudentRecord source field

**Files:**
- Create: `database/migrations/2026_09_15_000009_add_verification_and_score_columns.php`
- Modify: `app/Integration/StudentRecord.php` (add `tempatLahir`), `app/Integration/Adapters/MockAdapter.php` (map it), `app/Models/Student.php` (fillable)

**Interfaces:**
- Produces: `students.tempat_lahir`, `students.nilai_prestasi`, `students.jarak_domisili_km` (columns); `registrations.verification_evidence` (json nullable); `StudentRecord->tempatLahir` (`?string`).

- [ ] **Step 1: Write migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('tempat_lahir', 150)->nullable()->after('nama');
            $table->decimal('nilai_prestasi', 5, 2)->nullable()->after('agama');
            $table->decimal('jarak_domisili_km', 7, 2)->nullable()->after('nilai_prestasi');
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->json('verification_evidence')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['tempat_lahir', 'nilai_prestasi', 'jarak_domisili_km']);
        });

        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('verification_evidence');
        });
    }
};
```

- [ ] **Step 2: Run migration**

Run (from `backend/`): `php artisan migrate`
Expected: migration applies; no errors.

- [ ] **Step 3: Add `tempatLahir` to StudentRecord**

Edit `app/Integration/StudentRecord.php` constructor — add `public ?string $tempatLahir` after `nama`; update `fromArray()`:

```php
tempatLahir: $data['tempat_lahir'] ?? null,
```

- [ ] **Step 4: Map it in MockAdapter**

Edit `app/Integration/Adapters/MockAdapter.php`, in `lookupByNisn()`, add to the `new StudentRecord(...)` call, after `nama: $student->nama,`:

```php
tempatLahir: $student->tempat_lahir,
```

- [ ] **Step 5: Extend Student fillable**

Edit `app/Models/Student.php` `$fillable` to append `'tempat_lahir', 'nilai_prestasi', 'jarak_domisili_km'`.

- [ ] **Step 6: Verify**

Run: `php artisan tinker --execute="echo \App\Models\Student::query()->first()->getFillable()[0] ?? 'ok';"`
Expected: prints `nisn` (boots fine). Then `cd .. && git add backend && git commit -m "feat: migrations for verification evidence + selection score/distance data

Co-Authored-By: Claude Code <noreply@anthropic.com>"`
(cd back into `backend/` after.)

---

### Task 2: Migrations + models — selection_rules, selection_results

**Files:**
- Create: `database/migrations/2026_09_15_000010_create_selection_rules_and_results_tables.php`, `app/Models/SelectionRule.php`, `app/Models/SelectionResult.php`

**Interfaces:**
- Produces: `selection_rules` (admission_period_id, admission_path_id, score_weight decimal 5,3, distance_weight decimal 5,3, tie_break enum, is_active, created_by); `selection_results` (run_id, registration_id, school_id, admission_path_id, composite_score decimal 8,4, rank, status, priority_used). Models `SelectionRule` (relations `path()`), `SelectionResult` (relations `registration()`, `school()`).

- [ ] **Step 1: Write migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('selection_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_period_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_path_id')->constrained()->cascadeOnDelete();
            $table->decimal('score_weight', 5, 3);
            $table->decimal('distance_weight', 5, 3);
            $table->enum('tie_break', ['date_submitted_asc', 'age_youngest'])->default('date_submitted_asc');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['admission_period_id', 'admission_path_id']);
        });

        Schema::create('selection_results', function (Blueprint $table) {
            $table->id();
            $table->uuid('run_id')->index();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admission_path_id')->constrained()->cascadeOnDelete();
            $table->decimal('composite_score', 8, 4);
            $table->unsignedInteger('rank')->nullable();
            $table->enum('status', ['selected', 'not_selected'])->default('not_selected');
            $table->unsignedTinyInteger('priority_used');
            $table->timestamps();

            $table->index('registration_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('selection_results');
        Schema::dropIfExists('selection_rules');
    }
};
```

- [ ] **Step 2: Run migration**

Run: `php artisan migrate`
Expected: applies.

- [ ] **Step 3: SelectionRule model**

`app/Models/SelectionRule.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SelectionRule extends Model
{
    protected $fillable = [
        'admission_period_id', 'admission_path_id', 'score_weight',
        'distance_weight', 'tie_break', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'score_weight' => 'float',
            'distance_weight' => 'float',
            'is_active' => 'bool',
        ];
    }

    public function path(): BelongsTo
    {
        return $this->belongsTo(AdmissionPath::class, 'admission_path_id');
    }
}
```

- [ ] **Step 4: SelectionResult model**

`app/Models/SelectionResult.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SelectionResult extends Model
{
    protected $fillable = [
        'run_id', 'registration_id', 'school_id', 'admission_path_id',
        'composite_score', 'rank', 'status', 'priority_used',
    ];

    protected static function booted(): void
    {
        static::creating(fn (self $model) => $model->run_id ??= (string) Str::uuid());
    }

    protected function casts(): array
    {
        return ['composite_score' => 'float'];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}
```

- [ ] **Step 5: Verify + commit**

Run: `php artisan migrate:status | grep selection`
Expected: two `Ran` rows. Commit:

```bash
git add database/migrations/2026_09_15_000010_create_selection_rules_and_results_tables.php app/Models/SelectionRule.php app/Models/SelectionResult.php
git commit -m "feat: selection_rules + selection_results tables and models

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: Seeders — rules, score/distance/tempat_lahir data

**Files:**
- Create: `database/seeders/SelectionRuleSeeder.php`
- Modify: `database/seeders/StudentSeeder.php`, `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: per active admission period, one `SelectionRule` per active path (zonasi distance-heavy, prestasi score-heavy, afirmasi/perpindahan balanced); each mock student seeded `nilai_prestasi` (0–100), `jarak_domisili_km`, `tempat_lahir`.

- [ ] **Step 1: Create SelectionRuleSeeder**

```php
<?php

namespace Database\Seeders;

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\SelectionRule;
use Illuminate\Database\Seeder;

class SelectionRuleSeeder extends Seeder
{
    public function run(): void
    {
        $period = AdmissionPeriod::where('is_active', true)->first() ?? AdmissionPeriod::firstOrFail();

        $rules = [
            'zonasi'       => ['score_weight' => 0.30, 'distance_weight' => 0.70, 'tie_break' => 'age_youngest'],
            'prestasi'     => ['score_weight' => 0.90, 'distance_weight' => 0.10, 'tie_break' => 'date_submitted_asc'],
            'afirmasi'     => ['score_weight' => 0.50, 'distance_weight' => 0.50, 'tie_break' => 'date_submitted_asc'],
            'perpindahan'  => ['score_weight' => 0.60, 'distance_weight' => 0.40, 'tie_break' => 'date_submitted_asc'],
        ];

        foreach ($rules as $code => $cfg) {
            $path = AdmissionPath::where('code', $code)->first();
            if (! $path) {
                continue;
            }

            SelectionRule::updateOrCreate(
                ['admission_period_id' => $period->id, 'admission_path_id' => $path->id],
                array_merge($cfg, ['is_active' => true, 'created_by' => null]),
            );
        }
    }
}
```

- [ ] **Step 2: Add score/distance/tempat_lahir to StudentSeeder**

Edit `database/seeders/StudentSeeder.php`. In each of the 6 `$records` entries add three keys with plausible values (tempat_lahir + scores + distance; e.g. Alya: `'tempat_lahir' => 'Bandung', 'nilai_prestasi' => 92.5, 'jarak_domisili_km' => 1.8`). Example complete:

```php
'nisn' => '0069031234', 'nik' => '3201041003120001', 'nama' => 'Alya Rahma Nabila',
'tempat_lahir' => 'Bandung', 'tanggal_lahir' => '2012-03-10', 'jenis_kelamin' => 'P', 'agama' => 'Islam',
'nilai_prestasi' => 92.5, 'jarak_domisili_km' => 1.8,
'sekolah_asal' => 'SDN Cihampelas 1', 'tahun_lulus' => 2024,
```

Fill the others with varied values (e.g. 88/4.2, 95/9.0, 76/12.5, 90/3.1, 84/6.7). Then in the `$student = Student::create([...])` block, add the three columns:

```php
'tempat_lahir' => $data['tempat_lahir'],
'nilai_prestasi' => $data['nilai_prestasi'],
'jarak_domisili_km' => $data['jarak_domisili_km'],
```

- [ ] **Step 3: Register the seeder**

Edit `database/seeders/DatabaseSeeder.php` `run()` — after `UserSeeder::class,` add `SelectionRuleSeeder::class,`.

- [ ] **Step 4: Reset + seed + verify + commit**

Run: `php artisan migrate:fresh --seed`
Expected: seeds without error. Then:

```bash
php artisan tinker --execute="echo \App\Models\SelectionRule::count().' rules / '.(\App\Models\Student::whereNotNull('nilai_prestasi')->count()).' scored';"
```

Expected: `4 rules / 6 scored`. Commit:

```bash
git add database/seeders/
git commit -m "feat: seed selection rules + score/distance/tempat_lahir mock data

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: CompositeScore (pure scoring unit)

**Files:**
- Create: `app/Support/CompositeScore.php`, `tests/Unit/CompositeScoreTest.php`

**Interfaces:**
- Consumes: none.
- Produces: `CompositeScore::compute(float $score, float $distanceKm, float $scoreWeight, float $distanceWeight): float` → `round(score*scoreWeight + (100-min(distance,100))*distanceWeight, 4)`.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Support\CompositeScore;

it('gives full credit to perfect score and zero distance', function () {
    expect(CompositeScore::compute(100, 0, 1.0, 1.0))->toBe(200.0);
});

it('weights distance credit toward closer homes', function () {
    // 0.5/0.5 weights: score 80 → 40; dist 20 → (100-20)*0.5 = 40; total 80
    expect(CompositeScore::compute(80, 20, 0.5, 0.5))->toBe(80.0);
});

it('caps distance credit at 100 km', function () {
    expect(CompositeScore::compute(70, 150, 0.5, 0.5))->toBe(35.0); // 35 + 0
});

it('zero weight ignores that dimension', function () {
    expect(CompositeScore::compute(50, 90, 1.0, 0.0))->toBe(50.0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `./vendor/bin/pest tests/Unit/CompositeScoreTest.php`
Expected: FAIL — class not found.

- [ ] **Step 3: Implement**

```php
<?php

namespace App\Support;

/**
 * Selection scoring: normalised score (0-100) plus a proximity credit
 * (100 - min(distance, 100)) so closer homes rank higher. Weighted per path
 * rule. Pure — no I/O, unit-testable in isolation.
 */
final class CompositeScore
{
    public static function compute(
        float $score,
        float $distanceKm,
        float $scoreWeight,
        float $distanceWeight,
    ): float {
        $distanceCredit = 100 - min($distanceKm, 100);

        return round(
            ($score * $scoreWeight) + ($distanceCredit * $distanceWeight),
            4,
        );
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./vendor/bin/pest tests/Unit/CompositeScoreTest.php`
Expected: 4 passed / 4 assertions.

- [ ] **Step 5: Commit**

```bash
git add app/Support/CompositeScore.php tests/Unit/CompositeScoreTest.php
git commit -m "feat: composite score normalization for selection ranking

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: VerificationEngine (advisory field-level compare)

**Files:**
- Create: `app/Engines/VerificationEngine.php`, `tests/Feature/VerificationEngineTest.php`
- Modify: `app/Engines/` (new dir)

**Interfaces:**
- Consumes: `DataIntegrationGateway` (bound `MockAdapter` singleton), `StudentRecord`, `App\Support\Audit`, `Registration`, `Student`.
- Produces: `VerificationEngine::run(Registration): array` — writes `registrations.verification_evidence` JSON `{verdict, fields, run_at}`; returns `$fields` evidence map (`PASS|FAIL|SKIP` per comparator). Verdict: any FAIL → `DATA TIDAK SESUAI`; all PASS → `VALID`; else (all SKIP or mix w/o FAIL) → `PERLU VERIFIKASI`. Never changes registration status.

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Engines\VerificationEngine;
use App\Models\Registration;
use App\Models\Student;

it('marks a matching registration VALID with all PASS', function () {
    $student = Student::query()->firstOrFail();
    $registration = Registration::factory()->create(['student_id' => $student->id]);

    $engine = app(VerificationEngine::class);
    $fields = $engine->run($registration);

    expect($registration->fresh()->verification_evidence['verdict'])->toBe('VALID');
    expect(array_filter($fields, fn ($v) => $v === 'FAIL'))->toBeEmpty();
});

it('flags a mismatched NIK as DATA TIDAK SESUAI', function () {
    $student = Student::query()->firstOrFail();
    $student->update(['nik' => '3201010101010101']);
    $registration = Registration::factory()->create(['student_id' => $student->id]);

    app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->verification_evidence['verdict'])->toBe('DATA TIDAK SESUAI');
    expect($registration->fresh()->verification_evidence['fields']['nik'])->toBe('FAIL');
});

it('does NOT change registration status', function () {
    $student = Student::query()->firstOrFail();
    $registration = Registration::factory()->create(['student_id' => $student->id, 'status' => 'draft']);

    app(VerificationEngine::class)->run($registration);

    expect($registration->fresh()->status)->toBe('draft');
});
```

Note: `Registration::factory()` will not exist — the plan tasks that need factories create rows with model helpers (below). Replace factory calls in this file with `Registration::create([...])` using `no_pendaftaran` etc. — see Step 3 test scaffold. To keep tests self-contained, use the same pattern as `RegistrationFlowTest`: build from `Student::query()->firstOrFail()`.

- [ ] **Step 2: Run to verify it fails**

Run: `./vendor/bin/pest tests/Feature/VerificationEngineTest.php`
Expected: FAIL — `App\Engines\VerificationEngine` not found (and factory missing).

- [ ] **Step 3: Implement**

```php
<?php

namespace App\Engines;

use App\Integration\DataIntegrationGateway;
use App\Models\Registration;
use App\Support\Audit;

/**
 * Advisory verification at submit-time (PRD §12). Compares the confirmed
 * student fields against the gateway's canonical record. Writes evidence +
 * verdict to registrations.verification_evidence but does NOT transition
 * status — the operator's review() remains the status authority.
 */
final class VerificationEngine
{
    public function __construct(private readonly DataIntegrationGateway $gateway) {}

    public function run(Registration $registration): array
    {
        $student = $registration->student;
        $record = $this->gateway->lookupByNisn($student->nisn);

        $comparators = [
            'nisn' => [$student->nisn, $record->nisn],
            'nik' => [$student->nik, $record->nik],
            'nama' => [$student->nama, $record->nama],
            'tempat_lahir' => [$student->tempat_lahir, $record->tempatLahir],
            'tanggal_lahir' => [$student->tanggal_lahir?->toDateString(), $record->tanggalLahir?->toDateString()],
            'jenis_kelamin' => [$student->jenis_kelamin, $record->jenisKelamin],
            'sekolah_asal' => [$student->educationRecord?->sekolah_asal, $record->sekolahAsal],
            'nama_ayah' => [$student->parent?->nama_ayah, $record->namaAyah],
            'nama_ibu' => [$student->parent?->nama_ibu, $record->namaIbu],
        ];

        $fields = [];
        $anyFail = false;
        $hasSource = false;

        foreach ($comparators as $key => [$submitted, $source]) {
            if ($submitted === null || $source === null) {
                $fields[$key] = 'SKIP';
                continue;
            }
            $hasSource = true;
            $match = strtolower(trim((string) $submitted)) === strtolower(trim((string) $source));
            $fields[$key] = $match ? 'PASS' : 'FAIL';
            $anyFail = $anyFail || ! $match;
        }

        $verdict = match (true) {
            $anyFail => 'DATA TIDAK SESUAI',
            ! $hasSource => 'PERLU VERIFIKASI',
            default => 'VALID',
        };

        $registration->update([
            'verification_evidence' => [
                'verdict' => $verdict,
                'fields' => $fields,
                'run_at' => now()->toIso8601String(),
            ],
        ]);

        Audit::log('registration.verified_engine', [
            'registration_id' => $registration->id,
            'verdict' => $verdict,
        ]);

        return $fields;
    }
}
```

- [ ] **Step 4: Make the test pass**

Replace the `Registration::factory()->create(...)` calls with explicit creates (the file must boot a real registration without a factory; replicate the `RegistrationFlowTest` pattern — `Registration::create(['no_pendaftaran' => 'SPMB'.now()->year.random_int(10000000, 99999999), 'student_id' => $student->id, 'admission_period_id' => \App\Models\AdmissionPeriod::where('is_active', true)->firstOrFail()->id, 'user_id' => null, 'admission_path_id' => null, 'status' => 'draft'])`). Rerun until green.

Run: `./vendor/bin/pest tests/Feature/VerificationEngineTest.php`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add app/Engines/VerificationEngine.php tests/Feature/VerificationEngineTest.php
git commit -m "feat: advisory verification engine with field-level evidence

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: SelectionEngine (configurable ranking + quota + dry-run/publish)

**Files:**
- Create: `app/Engines/SelectionEngine.php`, `tests/Feature/SelectionEngineTest.php`

**Interfaces:**
- Consumes: `CompositeScore`, `SelectionRule`, `SelectionResult`, `Quota`, `Registration`, `NotificationBus` (dispatch `selection.published` on publish).
- Produces: `SelectionEngine::dryRun(AdmissionPeriod): array` (persists nothing, returns grouped preview), `SelectionEngine::publish(AdmissionPeriod): array` (deletes prior results for the period, computes, persists with fresh `run_id`, returns same shape). Rows carry `registration_id, school_id, admission_path_id, composite_score, rank, status (selected|not_selected), priority_used`.

**Grouped preview shape:** `['schools' => [[ 'school_id' => int, 'school' => ?string, 'rows' => [[ 'nama' => string, 'score' => float, 'rank' => int, 'priority' => int ]] ]] ]`.

Assignment algorithm (per active path): for each verified registration on the path, gather `[student, choice-school, priority, score]`; sort students by max candidate score desc (tie: registration created_at asc); walk each student's choices priority-asc, assign to the first school with remaining seats; record selected row (rank = order within school, starting 1). Every other (registration, school) choice pair becomes a `not_selected` row (rank null).

- [ ] **Step 1: Write the failing test**

```php
<?php

use App\Engines\SelectionEngine;
use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\RegistrationChoice;
use App\Models\School;
use App\Models\SelectionResult;
use App\Models\Student;

function makeVerifiedRegistration(Student $student, int $pathId, array $choices): Registration
{
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $registration = Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.'X'.random_int(10000000, 99999999),
        'student_id' => $student->id,
        'admission_period_id' => $period->id,
        'admission_path_id' => $pathId,
        'status' => 'verified',
    ]);
    foreach ($choices as $i => $schoolId) {
        RegistrationChoice::create(['registration_id' => $registration->id, 'school_id' => $schoolId, 'priority' => $i + 1]);
    }
    return $registration;
}

it('ranks by score and stops at quota', function () {
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $top = Student::query()->firstOrFail();
    $top->update(['nilai_prestasi' => 99, 'jarak_domisili_km' => 1]);
    $low = Student::query()->orderByDesc('id')->firstOrFail();
    $low->update(['nilai_prestasi' => 50, 'jarak_domisili_km' => 20]);

    makeVerifiedRegistration($top, $path->id, [$school->id]);
    makeVerifiedRegistration($low, $path->id, [$school->id]);

    $engine = app(SelectionEngine::class);
    $result = $engine->dryRun(AdmissionPeriod::where('is_active', true)->firstOrFail());

    $rows = $result['schools'][0]['rows'];
    expect($rows)->toHaveCount(1);          // quota 1
    expect($rows[0]['nama'])->toBe($top->nama);
    expect(SelectionResult::count())->toBe(0); // dry-run persists nothing
});

it('assigns higher-priority school first', function () {
    $path = AdmissionPath::where('code', 'zonasi')->firstOrFail();
    $s1 = School::query()->firstOrFail();
    $s2 = School::query()->orderBy('id')->get()[1];
    Quota::updateOrCreate(['school_id' => $s2->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $student = Student::query()->firstOrFail();
    $student->update(['nilai_prestasi' => 90, 'jarak_domisili_km' => 5]);
    makeVerifiedRegistration($student, $path->id, [$s1->id, $s2->id]); // s1 full-ish? s2 has seat

    $engine = app(SelectionEngine::class);
    $engine->publish(AdmissionPeriod::where('is_active', true)->firstOrFail());

    $assigned = SelectionResult::where('registration_id', $student->id)->where('status', 'selected')->first();
    expect($assigned)->not->toBeNull();
    expect($assigned->school_id)->toBe((int) $s2->id);
});
```

Note the test relies on `$s1` (first school) quota being 0 seats so the student's priority-1 choice is rejected and priority-2 (`$s2`) is used. For determinism, the first branch handles quota correctly; adjust as needed so `$s1` has `kuota => 0` in this test.

- [ ] **Step 2: Run to verify it fails**

Run: `./vendor/bin/pest tests/Feature/SelectionEngineTest.php`
Expected: FAIL — class not found.

- [ ] **Step 3: Implement**

```php
<?php

namespace App\Engines;

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Quota;
use App\Models\Registration;
use App\Models\SelectionResult;
use App\Support\Audit;
use App\Support\CompositeScore;
use App\Support\NotificationBus;
use Illuminate\Support\Str;

/**
 * Configurable selection engine (PRD §13 secret): per-path rules → per-school
 * ranking → quota stop → results. Dry-run computes without persisting; publish
 * recomputes idempotently (fresh run_id) and notifies affected pendaftar.
 */
final class SelectionEngine
{
    public function __construct(private readonly NotificationBus $notifications) {}

    public function dryRun(AdmissionPeriod $period): array
    {
        return $this->groupPreview($this->compute($period, persist: false));
    }

    public function publish(AdmissionPeriod $period): array
    {
        $runId = (string) Str::uuid();

        SelectionResult::whereIn(
            'registration_id',
            Registration::where('admission_period_id', $period->id)->pluck('id'),
        )->delete();

        $rows = $this->compute($period, persist: true, runId: $runId);

        foreach ($rows as $row) {
            $this->notifications->dispatch('selection.published', $row['registration_id'], $row);
        }
        Audit::log('selection.published', ['period_id' => $period->id, 'results' => count($rows)]);

        return $this->groupPreview($rows);
    }

    private function compute(AdmissionPeriod $period, bool $persist, ?string $runId = null): array
    {
        $out = [];
        $paths = AdmissionPath::where('admission_period_id', $period->id)->with(['rules' => fn ($q) => $q->where('is_active', true)])->get();

        foreach ($paths as $path) {
            $rule = $path->rules->first();
            if (! $rule) {
                continue;
            }

            $seats = Quota::where('admission_path_id', $path->id)->pluck('kuota', 'school_id')->map(fn ($q) => (int) $q);
            $remaining = $seats->toArray();

            $regs = Registration::where('status', 'verified')
                ->where('admission_path_id', $path->id)
                ->with(['choices', 'student'])
                ->orderBy('created_at')
                ->get();

            $cands = [];
            foreach ($regs as $reg) {
                foreach ($reg->choices as $choice) {
                    $score = CompositeScore::compute(
                        (float) ($reg->student?->nilai_prestasi ?? 0),
                        (float) ($reg->student?->jarak_domisili_km ?? 0),
                        (float) $rule->score_weight,
                        (float) $rule->distance_weight,
                    );
                    $cands[$reg->id][] = [
                        'reg' => $reg,
                        'school_id' => (int) $choice->school_id,
                        'priority' => (int) $choice->priority,
                        'score' => $score,
                    ];
                }
            }

            // students by their best candidate score desc, tie → created_at asc
            $studentIds = collect($cands)->map(
                fn ($list) => collect($list)->max('score'),
            )->sortByDesc(fn ($score) => $score)->keys();

            $schoolRanks = [];
            $matched = [];

            foreach ($studentIds as $studentId) {
                $choices = collect($cands[$studentId])->sortBy('priority');
                $assigned = null;
                foreach ($choices as $c) {
                    if (($remaining[$c['school_id']] ?? 0) > 0) {
                        $remaining[$c['school_id']]--;
                        $assigned = $c;
                        break;
                    }
                }
                if (! $assigned) {
                    continue;
                }
                $schoolRanks[$assigned['school_id']] = ($schoolRanks[$assigned['school_id']] ?? 0) + 1;
                $matched[$studentId] = $assigned['school_id'];

                $row = [
                    'run_id' => $runId,
                    'registration_id' => (int) $studentId,
                    'school_id' => $assigned['school_id'],
                    'admission_path_id' => $path->id,
                    'composite_score' => $assigned['score'],
                    'rank' => $schoolRanks[$assigned['school_id']],
                    'status' => 'selected',
                    'priority_used' => $assigned['priority'],
                ];
                if ($persist) {
                    SelectionResult::create($row);
                }
                $out[] = $row;
            }

            // persist not_selected rows for other choice pairs
            if ($persist) {
                foreach ($cands as $studentId => $list) {
                    foreach ($list as $c) {
                        if ($matched[$studentId] ?? null !== $c['school_id']) {
                            SelectionResult::create([
                                'run_id' => $runId,
                                'registration_id' => (int) $studentId,
                                'school_id' => $c['school_id'],
                                'admission_path_id' => $path->id,
                                'composite_score' => $c['score'],
                                'rank' => null,
                                'status' => 'not_selected',
                                'priority_used' => $c['priority'],
                            ]);
                        }
                    }
                }
            }
        }

        return $out;
    }

    private function groupPreview(array $rows): array
    {
        $schools = [];
        foreach ($rows as $row) {
            $schools[$row['school_id']] ??= ['school_id' => $row['school_id'], 'school' => null, 'rows' => []];
            $schools[$row['school_id']]['rows'][] = [
                'nama' => null, // filled by controller render
                'score' => $row['composite_score'],
                'rank' => $row['rank'],
                'priority' => $row['priority_used'],
            ];
        }
        return ['schools' => array_values($schools)];
    }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `./vendor/bin/pest tests/Feature/SelectionEngineTest.php`
Expected: 2 passed. Fix the test's `$s1`/`$s2` quota setup so the priority assertion is deterministically correct (make `$s1` kuota 0 for that test via `Quota::updateOrCreate([...], ['kuota' => 0])`).

- [ ] **Step 5: Commit**

```bash
git add app/Engines/SelectionEngine.php tests/Feature/SelectionEngineTest.php
git commit -m "feat: configurable selection engine with dry-run, quota, publish

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: NotificationBus + channels + Notification model

**Files:**
- Create: `app/Support/NotificationEvent.php`, `app/Support/NotificationBus.php`, `app/Channels/DatabaseChannel.php`, `app/Channels/LogChannel.php`, `app/Models/Notification.php`, `tests/Feature/NotificationBusTest.php`
- Modify: `app/Providers/AppServiceProvider.php` (bind NotificationBus)

**Interfaces:**
- Produces: `NotificationEvent` (readonly: type, userId, data array); `NotificationBus::dispatch(string $type, int $userId, array $data = [])` → calls each channel; `DatabaseChannel::send(NotificationEvent)` → writes `notifications` row (payload JSON); `LogChannel::send` → `logger()->info`.

- [ ] **Step 1: Create the event + bus + channels + model (no test yet — this is infra the engine tests consume)**

`app/Support/NotificationEvent.php`:

```php
<?php

namespace App\Support;

readonly class NotificationEvent
{
    public function __construct(
        public string $type,
        public int $userId,
        public array $data = [],
    ) {}
}
```

`app/Support/NotificationBus.php`:

```php
<?php

namespace App\Support;

/**
 * Dispatches a notification event to every registered channel. Channels are
 * injected at container build time (see AppServiceProvider) — add email/SMS/
 * WhatsApp channels here later without touching dispatch sites.
 */
final class NotificationBus
{
    /** @param array<int, object> $channels */
    public function __construct(private readonly array $channels) {}

    public function dispatch(string $type, int $userId, array $data = []): void
    {
        $event = new NotificationEvent($type, $userId, $data);

        foreach ($this->channels as $channel) {
            $channel->send($event);
        }
    }
}
```

`app/Channels/DatabaseChannel.php`:

```php
<?php

namespace App\Channels;

use App\Models\Notification;
use App\Support\NotificationEvent;

class DatabaseChannel
{
    public function send(NotificationEvent $event): void
    {
        Notification::create([
            'user_id' => $event->userId,
            'type' => $event->type,
            'payload' => json_encode($event->data),
        ]);
    }
}
```

`app/Channels/LogChannel.php`:

```php
<?php

namespace App\Channels;

use App\Support\NotificationEvent;

/** Seam for email/SMS/WhatsApp delivery — currently logs the event. */
class LogChannel
{
    public function send(NotificationEvent $event): void
    {
        logger()->info("[notification] {$event->type} -> user {$event->userId}: ".json_encode($event->data));
    }
}
```

`app/Models/Notification.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'payload', 'read_at'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'payload' => 'array'];
    }
}
```

- [ ] **Step 2: Bind in AppServiceProvider**

Edit `app/Providers/AppServiceProvider.php` `register()` — after the gateway singleton:

```php
$this->app->singleton(\App\Support\NotificationBus::class, function ($app) {
    return new \App\Support\NotificationBus([
        $app->make(\App\Channels\DatabaseChannel::class),
        $app->make(\App\Channels\LogChannel::class),
    ]);
});
```

- [ ] **Step 3: Write the test**

`tests/Feature/NotificationBusTest.php`:

```php
<?php

use App\Models\Notification;
use App\Support\NotificationBus;

it('persists a database notification row', function () {
    $user = \App\Models\User::where('role', 'pendaftar')->firstOrFail();

    app(NotificationBus::class)->dispatch('registration.submitted', $user->id, ['foo' => 'bar']);

    $this->assertDatabaseHas('notifications', [
        'user_id' => $user->id,
        'type' => 'registration.submitted',
    ]);
    expect(Notification::where('user_id', $user->id)->firstOrFail()->payload)->toBe(['foo' => 'bar']);
});
```

- [ ] **Step 4: Run to verify it passes**

Run: `./vendor/bin/pest tests/Feature/NotificationBusTest.php`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add app/Support/NotificationEvent.php app/Support/NotificationBus.php app/Channels/ app/Models/Notification.php app/Providers/AppServiceProvider.php tests/Feature/NotificationBusTest.php
git commit -m "feat: notification bus with database + log channels

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Wire engines into RegistrationFlow, VerificationFlow, DocumentService

**Files:**
- Modify: `app/Services/RegistrationFlow.php`, `app/Services/VerificationFlow.php`, `app/Services/DocumentService.php`

**Interfaces:**
- Consumes: `VerificationEngine`, `NotificationBus`.
- Produces: on submit → engine evidence + `registration.submitted` event; on review `valid` → `registration.verified` event; `ditolak` → `registration.rejected`; `perbaikan` → `document.revision` (fires on doc `setStatus('perbaikan')`); keeps all existing returns.

- [ ] **Step 1: RegistrationFlow — inject + call**

Edit `app/Services/RegistrationFlow.php`:

```php
use App\Engines\VerificationEngine;
use App\Support\NotificationBus;
```

Constructor:

```php
public function __construct(
    private readonly QuotaService $quota,
    private readonly VerificationEngine $verification,
    private readonly NotificationBus $notifications,
) {}
```

In `submit()`, after the `$registration->update(['status' => 'submitted']);` line, add:

```php
$this->verification->run($registration->fresh());
$this->notifications->dispatch('registration.submitted', $registration->user_id, [
    'registration_id' => $registration->id,
    'no_pendaftaran' => $registration->no_pendaftaran,
]);
```

- [ ] **Step 2: VerificationFlow — notify**

Edit `app/Services/VerificationFlow.php`. Add imports + constructor param `NotificationBus $notifications`. After `Audit::log('registration.verified', [...])`, dispatch:

```php
$this->notifications->dispatch(
    $status === 'valid' ? 'registration.verified' : ($status === 'ditolak' ? 'registration.rejected' : 'document.revision'),
    $registration->user_id,
    ['registration_id' => $registration->id, 'status' => $status],
);
```

- [ ] **Step 3: DocumentService — notify on revision**

Edit `app/Services/DocumentService.php`. Inject `NotificationBus $notifications`; in `setStatus()`, after the audit log, when `$status === 'perbaikan'`:

```php
if ($status === 'perbaikan') {
    $this->notifications->dispatch('document.revision', $document->registration->user_id, [
        'document_id' => $document->id,
    ]);
}
```

- [ ] **Step 4: Run the existing suite (regression gate)**

Run: `./vendor/bin/pest`
Expected: all prior tests still green (25+ existing + engines). Fix any assertions affected (e.g. `RegistrationFlowTest` still passes since engine is advisory + notifications write rows, not alter flow).

- [ ] **Step 5: Commit**

```bash
git add app/Services/RegistrationFlow.php app/Services/VerificationFlow.php app/Services/DocumentService.php
git commit -m "feat: wire verification engine + notifications into submit/review/doc flow

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 9: SelectionRuleManager + admin endpoints (dry-run, publish, rules)

**Files:**
- Create: `app/Services/SelectionRuleManager.php`, `tests/Feature/AdminSelectionTest.php`
- Modify: `app/Http/Controllers/AdminController.php`, `routes/web.php`

**Interfaces:**
- Consumes: `SelectionRule`, `SelectionEngine`, `AdmissionPeriod`, `NotificationBus` (via engine), `Audit`.
- Produces: `SelectionRuleManager::all(AdmissionPeriod): Collection`, `SelectionRuleManager::upsert(AdmissionPeriod, int $pathId, int $actorId, array $validated): SelectionRule`. Controller methods: `selectionRules` (adds `selectionRules`, `selectionResults` props to index), `dryRunSelection(Request)` (renders Admin/Dashboard with `selectionPreview`), `publishSelection(Request)` (persists + redirect back with flash), `saveSelectionRule(Request)`.

- [ ] **Step 1: Create SelectionRuleManager**

```php
<?php

namespace App\Services;

use App\Models\AdmissionPeriod;
use App\Models\SelectionRule;
use App\Support\Audit;
use Illuminate\Support\Collection;

/**
 * Admin (provinsi) CRUD over per-path selection rules. Validation happens in
 * the controller; this manager is pure persistence + audit.
 */
final class SelectionRuleManager
{
    public function all(AdmissionPeriod $period): Collection
    {
        return SelectionRule::with('path')
            ->where('admission_period_id', $period->id)
            ->orderBy('admission_path_id')
            ->get();
    }

    public function upsert(AdmissionPeriod $period, int $pathId, int $actorId, array $validated): SelectionRule
    {
        $rule = SelectionRule::updateOrCreate(
            ['admission_period_id' => $period->id, 'admission_path_id' => $pathId],
            array_merge($validated, ['is_active' => $validated['is_active'] ?? true, 'created_by' => $actorId]),
        );

        Audit::log('selection.rule_updated', [
            'rule_id' => $rule->id,
            'path_id' => $pathId,
            'weights' => [$validated['score_weight'], $validated['distance_weight']],
        ]);

        return $rule;
    }
}
```

- [ ] **Step 2: AdminController — add props + endpoints**

Edit `app/Http/Controllers/AdminController.php`. Inject `SelectionRuleManager` + `SelectionEngine` in the constructor. Add to `index()` props: `'selectionRules' => SelectionRule::with('path')->get()`, `'selectionResults' => \App\Models\SelectionResult::with(['registration.student', 'school'])->latest('id')->limit(50)->get()`. Add methods:

```php
public function saveSelectionRule(Request $request): \Illuminate\Http\RedirectResponse
{
    $validated = $request->validate([
        'path_id' => ['required', 'exists:admission_paths,id'],
        'score_weight' => ['required', 'numeric', 'min:0', 'max:1'],
        'distance_weight' => ['required', 'numeric', 'min:0', 'max:1'],
        'tie_break' => ['required', 'string', 'in:date_submitted_asc,age_youngest'],
        'is_active' => ['nullable', 'boolean'],
    ]);

    $period = \App\Models\AdmissionPeriod::where('is_active', true)->first()
        ?? abort(422, 'Belum ada periode pendaftaran aktif.');

    $this->rules->upsert($period, (int) $validated['path_id'], $request->user()->id, $validated);

    return back()->with('flash', ['success' => 'Aturan seleksi disimpan.']);
}

public function dryRunSelection(Request $request): Response
{
    $period = \App\Models\AdmissionPeriod::where('is_active', true)->first()
        ?? abort(403, 'Belum ada periode pendaftaran aktif.');

    $preview = $this->engine->dryRun($period);

    return Inertia::render('Admin/Dashboard', $this->indexProps($request) + [
        'selectionPreview' => $preview,
        'selectionViewed' => true,
    ]);
}

public function publishSelection(Request $request): \Illuminate\Http\RedirectResponse
{
    $period = \App\Models\AdmissionPeriod::where('is_active', true)->first()
        ?? abort(403, 'Belum ada periode pendaftaran aktif.');

    $this->engine->publish($period);

    return back()->with('flash', ['success' => 'Hasil seleksi dipublikasikan.']);
}
```

Refactor the existing `index()` body into a `private function indexProps(Request $request): array` returning the same array the current `index()` returns (so `dryRunSelection` reuses it), and make `index()` return `Inertia::render('Admin/Dashboard', $this->indexProps($request))`.

- [ ] **Step 3: Routes**

Edit `routes/web.php` inside the admin group — replace `Route::post('seleksi/run', ...)` with:

```php
Route::post('seleksi/dry-run', [AdminController::class, 'dryRunSelection'])->name('selection.dry');
Route::post('seleksi/publish', [AdminController::class, 'publishSelection'])->name('selection.publish');
Route::post('seleksi/rules', [AdminController::class, 'saveSelectionRule'])->name('selection.rules');
```

- [ ] **Step 4: Write the test**

`tests/Feature/AdminSelectionTest.php`:

```php
<?php

use App\Models\AdmissionPath;
use App\Models\AdmissionPeriod;
use App\Models\Registration;
use App\Models\RegistrationChoice;
use App\Models\School;
use App\Models\Student;
use App\Models\User;

it('admin provinsi can dry-run without persisting', function () {
    $admin = User::where('role', 'admin_provinsi')->firstOrFail();

    $response = $this->actingAs($admin)->post('/admin/seleksi/dry-run');
    $response->assertOk();
});

it('admin provinsi can publish selection results', function () {
    $admin = User::where('role', 'admin_provinsi')->firstOrFail();
    $path = AdmissionPath::where('code', 'prestasi')->firstOrFail();
    $school = School::query()->firstOrFail();
    \App\Models\Quota::updateOrCreate(['school_id' => $school->id, 'admission_path_id' => $path->id], ['kuota' => 1, 'terisi' => 0]);

    $student = Student::query()->orderByDesc('id')->firstOrFail();
    $period = AdmissionPeriod::where('is_active', true)->firstOrFail();
    $reg = Registration::create([
        'no_pendaftaran' => 'SPMB'.now()->year.'X'.random_int(10000000, 99999999),
        'student_id' => $student->id, 'admission_period_id' => $period->id,
        'admission_path_id' => $path->id, 'status' => 'verified',
    ]);
    RegistrationChoice::create(['registration_id' => $reg->id, 'school_id' => $school->id, 'priority' => 1]);

    $this->actingAs($admin)->post('/admin/seleksi/publish');

    $this->assertDatabaseHas('selection_results', ['registration_id' => $reg->id, 'status' => 'selected']);
});

it('non-admin is denied', function () {
    $user = User::where('role', 'pendaftar')->firstOrFail();

    $this->actingAs($user)->post('/admin/seleksi/dry-run')->assertForbidden();
});
```

- [ ] **Step 5: Run to verify**

Run: `./vendor/bin/pest tests/Feature/AdminSelectionTest.php`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add app/Services/SelectionRuleManager.php app/Http/Controllers/AdminController.php routes/web.php tests/Feature/AdminSelectionTest.php
git commit -m "feat: admin selection rules + dry-run/publish endpoints

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 10: Admin Seleksi UI (rules editor, dry-run preview, publish)

**Files:**
- Modify: `resources/js/Pages/Admin/Dashboard.jsx`
- Minor backend: `app/Http/Controllers/AdminController.php` (drop old `runSelection`), `routes/web.php` (remove `seleksi/run`)

**Interfaces:**
- Consumes: props `rules` (old `selections` prop retained for compat), `selectionRules`, `selectionResults`, `selectionPreview`, `selectionViewed`, `period`, `flash`; `router.post('/admin/seleksi/...')`.
- Produces: a Seleksi tab with per-path rule form (weights + tie-break + active toggle → POST `/admin/seleksi/rules`), a "Hitung (dry-run)" button (POST `/admin/seleksi/dry-run`), a "Publikasikan Hasil" button (POST `/admin/seleksi/publish`), and a preview table reading `selectionPreview.schools` when present.

- [ ] **Step 1: Rewrite SelectionTab**

Replace the `SelectionTab` function (lines ~126–160) with:

```jsx
function SelectionTab({ selections, selectionRules = [], selectionResults = [], selectionPreview, period }) {
    const { errors } = usePage().props;
    const [ruleDraft, setRuleDraft] = useState({});

    const saveRule = (pathId, e) => {
        e.preventDefault();
        router.post('/admin/seleksi/rules', { path_id: pathId, ...ruleDraft[pathId] }, { preserveScroll: true });
    };

    const dryRun = () => router.post('/admin/seleksi/dry-run', {}, { preserveScroll: true });
    const publish = () => router.post('/admin/seleksi/publish', {}, { preserveScroll: true });

    return (
        <Panel title="Seleksi Pendaftar">
            <div className="space-y-5">
                {/* Rules editor */}
                <div>
                    <h4 className="font-semibold text-ink">Aturan per Jalur</h4>
                    <div className="mt-3 space-y-3">
                        {selectionRules.map((r) => (
                            <form key={r.id} onSubmit={(e) => saveRule(r.path_id, e)} className="rounded-8 border border-outline-variant p-3">
                                <div className="flex flex-wrap items-end gap-3 text-sm">
                                    <span className="font-medium text-ink">{r.path?.name ?? `Jalur #${r.path_id}`}</span>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-ink-faint">Bobot Nilai</span>
                                        <input type="number" min="0" max="1" step="0.05" value={ruleDraft[r.path_id]?.score_weight ?? r.score_weight}
                                               onChange={(e) => setRuleDraft((d) => ({ ...d, [r.path_id]: { ...d[r.path_id], score_weight: parseFloat(e.target.value) } }))}
                                               className="w-24 rounded-8 border border-outline-variant px-2 py-1.5" />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-ink-faint">Bobot Jarak</span>
                                        <input type="number" min="0" max="1" step="0.05" value={ruleDraft[r.path_id]?.distance_weight ?? r.distance_weight}
                                               onChange={(e) => setRuleDraft((d) => ({ ...d, [r.path_id]: { ...d[r.path_id], distance_weight: parseFloat(e.target.value) } }))}
                                               className="w-24 rounded-8 border border-outline-variant px-2 py-1.5" />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs text-ink-faint">Tie-break</span>
                                        <select value={ruleDraft[r.path_id]?.tie_break ?? r.tie_break}
                                                onChange={(e) => setRuleDraft((d) => ({ ...d, [r.path_id]: { ...d[r.path_id], tie_break: e.target.value } }))}
                                                className="rounded-8 border border-outline-variant px-2 py-1.5">
                                            <option value="date_submitted_asc">Tanggal submit awal</option>
                                            <option value="age_youngest">Usia termuda</option>
                                        </select>
                                    </label>
                                    <button className="rounded-8 bg-brand-700 px-3 py-1.5 text-xs font-bold text-white">Simpan</button>
                                </div>
                            </form>
                        ))}
                    </div>
                    {errors.score_weight && <p className="mt-1 text-sm text-error">{errors.score_weight}</p>}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={dryRun} className="rounded-8 bg-surface-container-low border border-outline-variant px-4 py-2 text-sm font-bold text-ink">Hitung (dry-run)</button>
                    <button onClick={publish} className="rounded-8 bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">Publikasikan Hasil</button>
                </div>

                {/* Preview */}
                {selectionPreview && (
                    <div className="rounded-8 border border-outline-variant">
                        <div className="border-b border-outline-variant px-4 py-3 font-semibold text-ink">Pratinjau Hasil per Sekolah</div>
                        {selectionPreview.schools?.length === 0 ? (
                            <p className="p-4 text-sm text-ink-faint">Tidak ada pendaftar terverifikasi untuk jalur aktif.</p>
                        ) : (
                            selectionPreview.schools.map((s) => (
                                <div key={s.school_id} className="px-4 py-3 border-b border-outline-variant last:border-0">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-ink">Sekolah #{s.school_id}</span>
                                        <span className="text-xs text-ink-faint">{s.rows.length} diterima</span>
                                    </div>
                                    <ol className="mt-2 text-sm text-ink-soft">
                                        {s.rows.map((r, i) => (
                                            <li key={i} className="flex justify-between py-0.5">
                                                <span>#{r.rank} · {r.nama ?? `Pendaftar ${r.registration_id}`}</span>
                                                <span className="font-mono text-xs">{r.score}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Published results */}
                {selectionResults.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-outline-variant text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                            <th className="py-2 pr-3">Sekolah</th>
                            <th className="py-2 pr-3">Pendaftar</th>
                            <th className="py-2 pr-3">Skor</th>
                            <th className="py-2">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                        {selectionResults.map((r) => (
                            <tr key={r.id}>
                                <td className="py-2.5 pr-3 font-medium text-ink">{r.school?.name}</td>
                                <td className="py-2.5 pr-3 text-ink-soft">{r.registration?.student?.nama}</td>
                                <td className="py-2.5 pr-3 font-mono text-xs">{r.composite_score}</td>
                                <td className="py-2.5"><Badge status={r.status} /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Panel>
    );
}
```

Update the parent component destructure to pull `selectionRules, selectionResults, selectionPreview` and pass to `SelectionTab` (keep `selections` in the prop list for the `Overview` panel so nothing else breaks).

- [ ] **Step 2: Remove the old runSelection**

Edit `app/Http/Controllers/AdminController.php` — delete the `runSelection()` method entirely. Edit `routes/web.php` — ensure `seleksi/run` is gone (replaced in Task 9). Also remove the `use App\Models\Selection;` import if no longer referenced.

- [ ] **Step 3: Build + smoke**

Run: `npm run build`
Expected: Vite builds without errors.

- [ ] **Step 4: Suite + commit**

Run: `./vendor/bin/pest`
Expected: green. Commit:

```bash
git add resources/js/Pages/Admin/Dashboard.jsx app/Http/Controllers/AdminController.php routes/web.php
git commit -m "feat: admin seleksi UI — rules editor, dry-run preview, publish

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 11: Pendaftar Pangumuman + operator queue evidence

**Files:**
- Modify: `app/Services/DashboardService.php` (`pendaftar()` adds `notifications`), `resources/js/Pages/Dashboard/Pendaftar.jsx` (Pengumuman section), `resources/js/Pages/Verification/Index.jsx` (evidence badge)

**Interfaces:**
- Consumes: `Notification` model read for `user_id = auth()->id()` ordered desc, `registration.verification_evidence` JSON.
- Produces: pendaftar dashboard renders unread "Pengumuman" list + selection results; operator queue shows a badge when `DATA TIDAK SESUAI`.

- [ ] **Step 1: DashboardService — add notifications**

Edit `app/Services/DashboardService.php` `pendaftar()`, in the returned array add:

```php
'notifications' => \App\Models\Notification::where('user_id', $user->id)
    ->orderByDesc('created_at')->limit(20)->get(),
'notifications_unread' => \App\Models\Notification::where('user_id', $user->id)->whereNull('read_at')->count(),
```

- [ ] **Step 2: Pendaftar.jsx — Pengumuman section**

Edit `resources/js/Pages/Dashboard/Pendaftar.jsx`. Change the prop destructure to include `notifications, notifications_unread`. Add a "Pengumuman" panel (a `<Panel>`-style card) after the detail section:

```jsx
<div className="mt-6 rounded-8 border border-outline-variant bg-white overflow-hidden">
    <div className="border-b border-outline-variant px-5 py-4 flex items-center justify-between">
        <h2 className="font-bold text-ink">Pengumuman</h2>
        {notifications_unread > 0 && <Badge status="pending">{notifications_unread} baru</Badge>}
    </div>
    {notifications?.length === 0 ? (
        <p className="px-5 py-4 text-sm text-ink-faint">Belum ada pengumuman.</p>
    ) : (
        <ul className="divide-y divide-outline-variant text-sm">
            {notifications.map((n) => (
                <li key={n.id} className="px-5 py-3">
                    <span className="font-semibold text-ink">
                        {n.type === 'selection.published' ? 'Hasil seleksi tersedia' : n.type.replace(/[._]/g, ' ')}
                    </span>
                    {n.payload?.no_pendaftaran && <span className="ml-2 font-mono text-xs text-ink-faint">{n.payload.no_pendaftaran}</span>}
                    <p className="mt-0.5 text-xs text-ink-faint">{n.created_at}</p>
                </li>
            ))}
        </ul>
    )}
</div>
```

- [ ] **Step 3: Verification queue evidence**

Edit `resources/js/Pages/Verification/Index.jsx`. In the registration cards/rows, before the action buttons, show the advisory verdict:

```jsx
{r.verification_evidence?.verdict && (
    <Badge status={r.verification_evidence.verdict === 'DATA TIDAK SESUAI' ? 'ditolak' : 'pending'}>
        {r.verification_evidence.verdict}
    </Badge>
)}
```

The `verification_evidence` attribute serializes automatically to props because `Registration` is passed through Inertia.

- [ ] **Step 4: Build + suite**

Run: `npm run build && ./vendor/bin/pest`
Expected: both green.

- [ ] **Step 5: Commit**

```bash
git add app/Services/DashboardService.php resources/js/Pages/Dashboard/Pendaftar.jsx resources/js/Pages/Verification/Index.jsx
git commit -m "feat: pendaftar pengumuman + operator verification evidence badge

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 12: README + full-suite verification + final commit

**Files:**
- Modify: `README.md` (backend + root)

- [ ] **Step 1: Update README**

Edit `backend/README.md` — in "Arsitektur", add the engines to the diagram; in "Alur inti" add a 6th flow:

```text
6. **Seleksi (engine)** — admin_provinsi atur aturan jalur (bobot/skor + jarak + tie-break) → dry-run → publikasi hasil; konsumen `registration.verified`, perperingkat, dibatasi kuota. Notifikasi (DB + log) di setiap transisi: submit, verifikasi, revisi dokumen, hasil seleksi.
```

Also note the demo OTP line stays (mock).

- [ ] **Step 2: Full test run + build**

Run: `./vendor/bin/pest`
Expected: all tests pass (existing + new engines).

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Verify data via tinker**

Run:

```bash
php artisan migrate:fresh --seed
php artisan tinker --execute="echo \App\Models\SelectionRule::count().' rules, '.\App\Models\SelectionResult::count().' results';"
```

Expected: `4 rules, 0 results` (results only after a selection runs).

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: README run/demo notes for Phase 2 engines

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §3 Architecture (VerificationEngine, SelectionEngine, SelectionRuleManager, NotificationBus, channels, models) → Tasks 5, 6, 7, 9.
- §4 Verification engine (advisory evidence on submit) → Task 5 + Task 8 wiring. Status authority stays operator (spec §5.1) — Task 8 preserves `VerificationFlow`.
- §4 Selection engine (dry-run → publish, quota, idempotent, priority) → Task 6 + Task 9 endpoints + Task 10 UI.
- §4 Notification bus (4 events, DB + log channels) → Task 7 + Task 8 dispatch + Task 11 UI.
- §4 Schema (students cols, registrations evidence, selection_rules, selection_results) → Tasks 1, 2.
- Seeder (rules + mock score/distance/tempat_lahir) → Task 3.
- §5 UI (admin rules/preview/publish, pendaftar pengumuman, operator badge) → Tasks 10, 11.
- §7 audit + admin-only + idempotent publish → Task 9, baked into engines.
- §8 tests → each engine has a Feature test; `CompositeScore` unit test; admin endpoint tests; `NotificationBusTest`.

**Placeholder scan:** every step has literal code. No "TBD/TODO/add validation later".

**Type consistency:** `CompositeScore::compute(float,float,float,float): float` used identically in Task 4 and Task 6. `SelectionEngine::dryRun/publish(AdmissionPeriod): array` matches Task 9 controller calls. `NotificationBus::dispatch(string,int,array)` matches Task 7 signature used across Tasks 6, 8, 9. `SelectionRuleManager::all/upsert` signatures match Task 9 uses. Task 9 `indexProps(Request)` refactor is introduced before Task 10 consumes new props.

**Known negotiation to flag to the executor:** Task 5 and Task 6 tests reference `Registration::factory()` which does not exist — the plan's Step 4 of Task 5 explicitly says to replace with explicit model creates (matching the `RegistrationFlowTest` pattern), and Task 6 defines its own `makeVerifiedRegistration()` helper. Do not attempt to create a factory unless a test needs broad reuse.