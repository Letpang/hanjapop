import { useLang } from '../../../../hooks/useLang.js';

export default function MatchPauseOverlay({ onExit, onResume }) {
    const { t } = useLang();

    return (
        <div
            className="game-state-overlay absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: 'rgba(248,250,249,0.90)', backdropFilter: 'blur(12px)' }}
        >
            <div className="bg-[var(--color-bg-surface)] border border-[#E9EDF2] rounded-3xl px-8 py-10 flex flex-col items-center gap-6 shadow-2xl max-w-xs w-full mx-4">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl mb-1">⏸</span>
                    <h2 className="text-[#334155] dark:text-slate-200 text-2xl font-bold tracking-normal">{t('ext_1499')}</h2>
                    <p className="text-[#8F99AD] text-base text-center break-keep">{t('ext_1817')}</p>
                </div>
                <button
                    onClick={onResume}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #7C83FF, #4F56D9)', boxShadow: '0 4px 20px rgba(124,131,255,0.35)' }}
                >
                    {t('ext_2867')}
                </button>
                <button
                    onClick={onExit}
                    className="text-[#AEB7C5] text-base hover:text-[color:var(--color-text-muted)] dark:text-slate-300 transition-colors"
                >
                    {t('ext_2512')}
                </button>
            </div>
        </div>
    );
}
