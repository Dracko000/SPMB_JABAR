/**
 * Console guard — deterrence + audit trail, NOT a security boundary.
 *
 * Batasnya harus jujur: F12 adalah fitur peramban, bukan konten halaman.
 * Tidak ada JavaScript yang bisa menutup devtools secara permanen; pengguna
 * bisa selalu membukanya lewat menu, kombinasi tombol lain, atau alat pihak
 * ketiga. Jadi modul ini tidak berpura-pura menjadi benteng. Yang ia lakukan
 * adalah tiga hal yang jujur dan berguna:
 *
 *   1. Mencegah jalan pintas yang paling umum (F12, Ctrl+Shift+I/J/C, Ctrl+U,
 *      Cmd+Alt+I/J/C) dan menu klik kanan, memakai preventDefault.
 *   2. Mendeteksi devtools yang benar-benar terbuka lewat selisih dimensi
 *      jendela, lalu menampilkan peringatan.
 *   3. Mengirim percobaan ke server untuk dicatat di log audit, sehingga
 *      accountable. Inilah bagian yang benar-benar menimbulkandeterrence.
 *
 * Yang melindungi data sebenarnya ada di server: otorisasi, masking, CSP,
 * dan integritas dokumen. Lihat SecurityHeaders middleware,
 * App\Support\Masking, dan App\Services\DocumentService.
 */
export function installConsoleGuard({ enabled = false, auditUrl = null, token = null } = {}) {
    if (!enabled) return () => {};

    // Hindari listener ganda saat Inertia melakukan navigasi.
    if (window.__consoleGuardInstalled) return () => {};
    window.__consoleGuardInstalled = true;

    const notify = (reason) => {
        // Cegah spam: satu laporan per 5 detik per alasan.
        const now = Date.now();
        window.__consoleGuardSeen = window.__consoleGuardSeen || {};
        if (now - (window.__consoleGuardSeen[reason] || 0) < 5000) return;
        window.__consoleGuardSeen[reason] = now;

        if (!auditUrl) return;

        try {
            const body = JSON.stringify({ reason, path: window.location.pathname });

            if (navigator.sendBeacon) {
                navigator.sendBeacon(auditUrl, new Blob([body], { type: 'application/json' }));
            } else {
                fetch(auditUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token || '' },
                    body,
                    keepalive: true,
                }).catch(() => {});
            }
        } catch {
            // Kegagalan audit tidak boleh merusak halaman.
        }
    };

    // 1) Cegah jalan pintas yang paling umum.
    const blockKeys = (event) => {
        const key = (event.key || '').toLowerCase();
        const isF12 = key === 'f12';
        const isInspectCombo =
            (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
            (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) ||
            (event.ctrlKey && key === 'u');

        if (isF12 || isInspectCombo) {
            event.preventDefault();
            notify(isF12 ? 'shortcut:f12' : 'shortcut:inspect');
        }
    };

    // 2) Blokir menu klik kanan (menghilangkan "Inspect" dari menu konteks).
    const blockContextMenu = (event) => {
        event.preventDefault();
        notify('context-menu');
    };

    // 3) Deteksi devtools yang terbuka lewat selisih dimensi. Heuristik
    //    ringan, tanpa loop agresif yang membebani CPU.
    let devtoolsOpen = false;

    const showWarning = () => {
        if (banner) return;

        banner = document.createElement('div');
        banner.setAttribute('role', 'status');
        banner.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'display:flex', 'align-items:center', 'justify-content:center',
            'background:rgba(15,32,54,0.94)', 'color:#fff',
            'font:600 16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
            'text-align:center', 'padding:32px',
        ].join(';');
        banner.innerHTML = [
            '<div style="max-width:520px">',
            '<div style="font-size:34px;line-height:1;margin-bottom:14px">&#128274;</div>',
            '<h2 style="margin:0 0 8px;font-size:20px">Developer Tools terdeteksi</h2>',
            '<p style="margin:0;color:#c7d7e6;font-weight:400">',
            'Penggunaan console browser dicatat pada log audit sistem. ',
            'Mengubah tampilan di browser tidak mengubah data yang tersimpan.',
            '</p></div>',
        ].join('');

        document.body.appendChild(banner);
    };

    const hideWarning = () => {
        if (banner) {
            banner.remove();
            banner = null;
        }
    };

    const detect = () => {
        const threshold = 160;
        const open =
            window.outerWidth - window.innerWidth > threshold ||
            window.outerHeight - window.innerHeight > threshold;

        if (open && !devtoolsOpen) {
            devtoolsOpen = true;
            notify('devtools:open');
            showWarning();
        } else if (!open && devtoolsOpen) {
            devtoolsOpen = false;
            hideWarning();
        }
    };

    const interval = window.setInterval(detect, 1200);

    let banner = null;

    document.addEventListener('keydown', blockKeys, true);
    document.addEventListener('contextmenu', blockContextMenu, true);

    return () => {
        document.removeEventListener('keydown', blockKeys, true);
        document.removeEventListener('contextmenu', blockContextMenu, true);
        window.clearInterval(interval);
        hideWarning();
        window.__consoleGuardInstalled = false;
    };
}
