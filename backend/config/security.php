<?php

return [

    /*
    |---------------------------------------------------------------------------
    | Console guard (deterrence)
    |---------------------------------------------------------------------------
    |
    | Ketidakjujuran/jsurnya: F12 adalah fitur peramban, bukan konten halaman,
    | sehingga tidak bisa "diblokir" secara mutlak. Yang bisa dilakukan adalah
    | (1) mencegah jalan pintas yang paling umum, (2) memberi peringatan, dan
    | (3) mencatat percobaannya ke log audit sehingga accountable.
    |
    | Yang benar-benar melindungi data bukan kode ini, melainkan:
    |   - tidak mengirim data sensitif mentah ke klien (lihat App\Support\Masking)
    |   - otoritasi & validasi di sisi server pada setiap aksi
    |   - header keamanan yang ditegakkan peramban (lihat SecurityHeaders)
    |
    | Nonaktifkan di produksi bila Anda memerlukan dukungan teknis jarak jauh.
    |
    */

    'console_guard' => (bool) env('CONSOLE_GUARD', env('APP_ENV') === 'production'),

    'console_guard_audit' => (bool) env('CONSOLE_GUARD_AUDIT', true),

    /*
    |---------------------------------------------------------------------------
    | Content Security Policy
    |---------------------------------------------------------------------------
    |
    | CSP adalah kontrol yang benar-benar ditegakkan peramban: skrip sebaris
    | yang disisipkan (XSS) tidak akan berjalan, dan halaman tidak bisa
    | dibingkai oleh situs lain (clickjacking).
    |
    */

    'csp' => [
        // Non-production memakai dev-server Vite (HMR) sehingga butuh ws:/wss:
        'relaxed' => ! env('APP_ENV', 'production'),
    ],

];
