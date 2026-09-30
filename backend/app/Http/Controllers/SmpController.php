<?php

namespace App\Http\Controllers;

use App\Models\Address;
use App\Models\School;
use App\Models\Student;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SmpController extends Controller
{
    public function index(Request $request): Response
    {
        // Find the SMP school associated with this operator
        $school = School::whereHas('users', function ($q) use ($request) {
            $q->where('id', $request->user()->id);
        })->firstOrFail();

        return Inertia::render('Smp/Dashboard', [
            'school' => $school,
            'students' => Student::where('school_id', $school->id)
                ->orderBy('nama', 'asc')
                ->paginate(20),
        ]);
    }

    public function storeStudent(Request $request): RedirectResponse
    {
        $request->validate([
            'nisn' => ['required', 'string', 'digits:10', 'unique:students,nisn'],
            'nik' => ['required', 'string', 'digits:16', 'unique:students,nik'],
            'nama' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'jenis_kelamin' => ['required', 'string', 'in:L,P'],
            'tanggal_lahir' => ['required', 'date'],
            'alamat' => ['required', 'string'],
        ]);

        // Find the SMP school for this operator
        $school = School::whereHas('users', function ($q) use ($request) {
            $q->where('id', $request->user()->id);
        })->firstOrFail();

        // 1. Create Student record (alamat disimpan terpisah di tabel addresses)
        $student = Student::create([
            'nisn' => $request->nisn,
            'nik' => $request->nik,
            'nama' => $request->nama,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tanggal_lahir' => $request->tanggal_lahir,
            'school_id' => $school->id,
        ]);

        Address::create([
            'student_id' => $student->id,
            'alamat' => $request->alamat,
        ]);

        // 2. Create User account for the student to login.
        //    PENTING: password dibuat ACAK — NISN bukan kredensial. Siswa
        //    masuk lewat alur NISN → OTP (bukti kepemilikan berganda), bukan
        //    dengan NISN sebagai kata sandi (pola itu hanya untuk akun demo).
        $user = User::create([
            'name' => $student->nama,
            'email' => $request->email,
            'password' => Str::random(32),
            'role' => 'pendaftar',
            'demo_login' => false,
            'email_verified_at' => now(),
        ]);

        // 3. Link User to Student so the pendaftar can claim the account via OTP.
        $user->update(['student_id' => $student->id]);

        Audit::log('smp.student.intake', [
            'student_id' => $student->id,
            'nisn' => $student->nisn,
            'by' => $request->user()->email,
        ], $student);

        return back()->with('flash', ['success' => 'Siswa lulusan berhasil didaftarkan. Akun diaktifkan siswa lewat NISN → OTP.']);
    }

    public function destroyStudent(Student $student, Request $request): RedirectResponse
    {
        $school = School::whereHas('users', function ($q) use ($request) {
            $q->where('id', $request->user()->id);
        })->firstOrFail();

        if ($student->school_id !== $school->id) {
            abort(403, 'Anda tidak memiliki akses ke data siswa ini.');
        }

        // Also delete associated user account if exists (FK users.student_id = nullOnDelete,
        // jadi user dihapus eksplisit agar akun pendaftar tidak menjadi yatim)
        User::where('student_id', $student->id)->delete();

        $student->delete();

        return back()->with('flash', ['success' => 'Data siswa berhasil dihapus.']);
    }
}
