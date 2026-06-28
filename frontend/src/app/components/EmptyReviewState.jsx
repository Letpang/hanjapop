import { useLang } from '../../hooks/useLang.js';

export default function EmptyReviewState({ onBack }) {
    const { t } = useLang();
    return (
        <div className="min-h-screen bg-[#F7FAF9] dark:bg-slate-900 flex flex-col items-center justify-center gap-6 px-8">
            <div className="text-6xl">🎉</div>
            <h2 className="font-medium text-2xl text-slate-800 dark:text-slate-100 tracking-normaler text-center">{t('ext_3178')}</h2>
            <p className="text-[#AEB7C5] dark:text-slate-400 font-normal text-center text-sm break-keep">
                {t('ext_3179')}<br />{t('ext_1962')}
            </p>
            <button
                onClick={onBack}
                className="px-8 py-3 bg-emerald-500 text-white font-normal rounded-2xl border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0 transition-all"
            >
                {t('ext_3180')}
            </button>
        </div>
    );
}
