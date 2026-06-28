import { useLang } from '../../../../hooks/useLang.js';

const WordQuizEmptyState = ({ onBack }) => {
    const { t } = useLang();
    
    return (
        <div className="flex flex-1 w-full max-w-sm flex-col items-center justify-center text-center px-5 py-10">
            <div className="w-20 h-20 rounded-[1.75rem] bg-[var(--color-bg-surface)] border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shadow-sm">
                <span className="hanja-char text-4xl text-[#7C83FF]">字</span>
            </div>
            <h3 className="mt-5 text-xl font-medium text-slate-700 dark:text-slate-100">{t('ext_2251')}</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-400 break-keep">{t('ext_2696')}</p>
            <button onClick={onBack} className="mt-6 w-full rounded-2xl bg-[#7C83FF] py-3.5 text-base text-white shadow-sm active:scale-95 transition-transform">
                {t('ext_2461')}
            </button>
        </div>
    );
};

export default WordQuizEmptyState;
