import { useLang } from '../../../hooks/useLang.js';

const DailyIntroPanel = ({ dayNumber, theme, todayHanja }) => {
    const { t } = useLang();

    return (
        <div className="daily-intro-content w-full flex-1 min-h-0 flex flex-col items-center justify-center pt-24 pb-5">
            <div
                className="daily-stage-panel w-full max-w-sm rounded-[2rem] px-4 pt-5 pb-5 border border-[var(--color-border-subtle)]/60"
                style={{
                    background: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    boxShadow: '0 8px 32px rgba(46,214,197,0.10), 0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="rounded-full px-5 py-1.5 mt-[-2.5rem] bg-[var(--color-bg-surface)] border-2 border-[#F1F5F9] shadow-sm z-10 flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#9FA5FF]" />
                        <h1 className="daily-stage-number font-medium text-[#6168EB] tracking-normal leading-none pt-0.5">
                            {t('ext_479')} {dayNumber}{t('ext_478')}
                        </h1>
                        <span className="w-2 h-2 rounded-full bg-[#9FA5FF]" />
                    </div>
                    {theme && <p className="gradient-text-coral">{theme}</p>}
                </div>

                {todayHanja.length > 0 && (
                    <div className="flex flex-col gap-3 w-full">
                        <p className="daily-stage-caption text-center font-normal">{t('ext_2051')}</p>
                        <div className="flex gap-3 w-full">
                            {todayHanja.map((hanja, index) => (
                                <div
                                    key={index}
                                    className="daily-stage-hanja flex-1 flex flex-col items-center rounded-[1.3rem] px-2 py-4 bg-white"
                                >
                                    <img
                                        src={`/assets/images/hanja_all/${hanja.id}_${encodeURIComponent(hanja.hanja)}.webp`}
                                        onError={(event) => { event.target.src = '/assets/images/hanja_placeholder.webp'; }}
                                        className="w-20 h-20 object-contain mix-blend-multiply dark:mix-blend-normal"
                                        alt={hanja.hanja}
                                    />
                                    <span className="text-[42px] font-normal text-[#334155] dark:text-slate-200 leading-none mt-2">{hanja.hanja}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyIntroPanel;
