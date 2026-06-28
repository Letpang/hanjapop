import { useLang } from '../../../hooks/useLang.js';

const ExamPrepShortcuts = ({ onNavigate, style }) => {
    const { t } = useLang();

    return (
        <section className="w-full max-w-md" style={style}>
            <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex flex-col">
                    <span className="font-semibold text-lg tracking-normal" style={{ color: 'var(--color-text-main)' }}>{t('ext_1893')}</span>
                    <span className="font-normal text-xs mt-0.5" style={{ color: '#7C83FF' }}>{t('ext_2551')}</span>
                </div>
            </div>
            <div className="mm-cert-shortcut-grid">
                <button
                    onClick={() => onNavigate('gradeExamSelect')}
                    className="mm-cert-shortcut mm-cert-shortcut--exam"
                >
                    <span className="mm-cert-shortcut-mark" aria-hidden="true">級</span>
                    <span className="mm-cert-shortcut-copy">
                        <span className="mm-cert-shortcut-title">{t('ext_1677')}</span>
                        <span className="mm-cert-shortcut-desc">{t('ext_2362')}</span>
                    </span>
                    <span className="mm-cert-shortcut-action">
                        <span>{t('ext_1468')}</span>
                        <span className="mm-cert-shortcut-chevron" aria-hidden="true" />
                    </span>
                </button>

                <button
                    onClick={() => onNavigate('wrongVocabulary')}
                    className="mm-cert-shortcut mm-cert-shortcut--wrong"
                >
                    <span className="mm-cert-shortcut-mark" aria-hidden="true">誤</span>
                    <span className="mm-cert-shortcut-copy">
                        <span className="mm-cert-shortcut-title">{t('ext_1545')}</span>
                        <span className="mm-cert-shortcut-desc">{t('ext_1955')}</span>
                    </span>
                    <span className="mm-cert-shortcut-action">
                        <span>{t('ext_1468')}</span>
                        <span className="mm-cert-shortcut-chevron" aria-hidden="true" />
                    </span>
                </button>
            </div>
        </section>
    );
};

export default ExamPrepShortcuts;