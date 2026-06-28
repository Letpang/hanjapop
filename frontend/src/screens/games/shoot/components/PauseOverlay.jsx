import { useLang } from '../../../../hooks/useLang.js';

const PauseOverlay = ({ onResume, onExit }) => {
    const { t } = useLang();

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'rgba(10,15,30,0.72)', backdropFilter: 'blur(8px)' }}>
            <div className="bg-[var(--color-bg-surface)]/10 border border-[var(--color-border-subtle)]/20 rounded-3xl px-8 py-10 flex flex-col items-center gap-6 shadow-2xl max-w-xs w-full mx-4">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl mb-1">⏸</span>
                    <h2 className="text-white text-2xl font-bold tracking-normal">{t('ext_1499')}</h2>
                    <p className="text-white/60 text-base text-center break-keep">{t('ext_2355')}</p>
                </div>
                <button
                    onClick={onResume}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #7C83FF, #4F56D9)', boxShadow: '0 4px 20px rgba(124,131,255,0.4)' }}
                >
                    {t('ext_2758')}
                </button>
                <button
                    onClick={onExit}
                    className="text-white/50 text-base hover:text-white/80 transition-colors"
                >
                    {t('ext_2356')}
                </button>
            </div>
        </div>
    );
};

export default PauseOverlay;
