import { useLang } from '../../hooks/useLang.js';

export default function UpdateRequiredModal({ latestVersion, storeUrl }) {
    const { t } = useLang();
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="update-modal-card w-full max-w-sm rounded-3xl p-8 text-center" style={{ background: '#fff' }}>
                <div className="text-4xl mb-4">🆕</div>
                <h2 className="text-xl font-medium text-gray-800 mb-2">{t('ext_3194')}</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    {t('ext_3195', { version: latestVersion })}<br />
                    {t('ext_2258')}
                </p>
                <a
                    href={storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-4 rounded-full font-normal text-white text-[17px]"
                    style={{ background: 'linear-gradient(135deg, #2ED6C5, #0D9488)' }}
                >
                    {t('ext_3196')}
                </a>
            </div>
        </div>
    );
}
