import { useEffect } from 'react';

export default function FlashMessage({ flash }) {
    if (!flash?.success) return null;

    return (
        <div className="mb-5 rounded-8 border border-brand-300 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
            {flash.success}
        </div>
    );
}