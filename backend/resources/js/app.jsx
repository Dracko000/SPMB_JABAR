import './bootstrap';
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { installConsoleGuard } from './support/consoleGuard';

const appName = import.meta.env.VITE_APP_NAME || 'SPMB JABAR';

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) => resolvePageComponent(
        `./Pages/${name}.jsx`,
        import.meta.glob('./Pages/**/*.jsx'),
    ),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);

        // Deterrence only — see support/consoleGuard.js for honest limits.
        const security = props.initialPage?.props?.security || {};
        installConsoleGuard({
            enabled: Boolean(security.consoleGuard),
            auditUrl: security.consoleReportUrl || null,
            token: props.initialPage?.props?.csrfToken || document.querySelector('meta[name="csrf-token"]')?.content || null,
        });
    },
    progress: {
        color: '#0D6EB3',
    },
});