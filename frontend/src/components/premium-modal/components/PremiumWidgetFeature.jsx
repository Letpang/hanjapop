import { useLang } from '../../../hooks/useLang.js';

const PremiumWidgetFeature = () => {
    const { t } = useLang();

    return (
        <div className="px-5 mb-5 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2ED6C5] via-[#7C83FF] to-[#FF9B73] opacity-25 blur-xl rounded-full scale-y-[0.8]" />
            <div
                className="rounded-2xl p-[2px] relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2ED6C5 0%, #7C83FF 50%, #FF9B73 100%)' }}
            >
                <div className="absolute inset-0 bg-white/20" />

                <div
                    className="premium-widget-card relative rounded-[14px] px-4 py-3.5 flex items-center gap-3.5 h-full"
                    style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}
                >
                    <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-[#F5F7FA] to-[#E9EEF5] flex flex-col items-center justify-center shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_2px_8px_rgba(124,131,255,0.15)] border border-white/60 relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-white/50" />
                        <div className="text-[20px] leading-none font-medium text-[#7C83FF] z-10 drop-shadow-sm">學</div>
                        <div className="mt-1.5 flex gap-[3px] z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2ED6C5] shadow-sm" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7C83FF] shadow-sm" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9B73] shadow-sm" />
                        </div>
                    </div>

                    <div className="min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-base font-medium bg-gradient-to-r from-[#7C83FF] to-[#FF9B73] text-white tracking-widest shadow-[0_2px_4px_rgba(124,131,255,0.3)]">
                                NEW
                            </span>
                            <div className="text-base font-medium text-slate-800 dark:text-slate-100 leading-tight">
                                {t('ext_2789')}
                            </div>
                        </div>
                        <div className="text-base font-normal text-slate-500 dark:text-slate-300 leading-snug break-keep mt-0.5">
                            {t('ext_3010')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumWidgetFeature;