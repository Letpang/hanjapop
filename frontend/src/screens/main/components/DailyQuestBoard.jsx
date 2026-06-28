import { MISSION_META } from '../constants.js';
import { useLang } from '../../../hooks/useLang.js';

const DailyQuestBoard = ({ missions, missionDone, missionTotal, allDone, onNavigate, style }) => {
    const { lang, t } = useLang();
    const showQuestHints = lang === 'ko';
    const firstUndoneIdx = (missions || []).findIndex(x => !x.done);
    const otherUndoneMissions = (missions || []).filter((x, missionIdx) => !x.done && missionIdx !== firstUndoneIdx);
    const maxUndoneXp = otherUndoneMissions.length > 0
        ? Math.max(...otherUndoneMissions.map(x => x.xp))
        : 0;

    return (
        <div className={`w-full max-w-md relative${allDone ? ' quest-section-done' : ''}`} style={style}>
            <div className="flex flex-wrap items-end justify-between gap-2 mb-3 px-2">
                <div className="flex flex-col">
                    <span className={`font-semibold text-lg tracking-normal${allDone ? ' quest-title-done' : ''}`} style={{ color: allDone ? undefined : 'var(--color-text-main)' }}>
                        {t('ext_2710')}
                    </span>
                    {allDone ? (
                        <span className="font-normal text-xs mt-0.5 text-[#2ED6C5]">
                            {t('ext_2868')}
                        </span>
                    ) : (
                        <span className="font-normal text-xs mt-0.5 text-[#2ED6C5]">
                            {t('ext_2726')} <span className="text-[#FF9B73]">+200XP {t('ext_1892')}</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 relative">
                    {allDone && (
                        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                            <span className="quest-star" style={{ left: '-18px', top: '-8px', animationDelay: '0s' }}>✦</span>
                            <span className="quest-star quest-star--sm" style={{ left: '4px', top: '-14px', animationDelay: '0.7s' }}>★</span>
                            <span className="quest-star quest-star--sm" style={{ left: '-8px', top: '6px', animationDelay: '1.4s' }}>✦</span>
                            <span className="quest-star quest-star--sm" style={{ left: '18px', top: '-6px', animationDelay: '2s' }}>★</span>
                        </div>
                    )}
                    <div className={`px-3 py-1 rounded-full font-normal text-xs ${allDone ? 'bg-[#2ED6C5] text-white shadow-md quest-badge-done' : 'bg-white text-slate-400 border-2 border-slate-100'}`}>
                        {missionDone} / {missionTotal}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {(missions || []).map((m, idx) => {
                    const meta = MISSION_META[m.type] || {};
                    const isRecommended = !m.done && idx === firstUndoneIdx;
                    const isHighXp = !m.done && !isRecommended && m.xp === maxUndoneXp;
                    const isChallenge = !m.done && !isRecommended && !isHighXp;

                    return (
                        <button
                            key={m.id}
                            onClick={() => meta.nav && onNavigate(meta.nav)}
                            className="w-full flex items-center gap-2.5 py-2.5 px-4 rounded-[1.5rem] active:scale-[0.97] transition-all relative overflow-hidden shadow-sm"
                            style={{ background: 'var(--color-bg-surface)' }}
                        >
                            <div
                                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[1.5rem]"
                                style={{ background: meta.color || '#2ED6C5', opacity: m.done ? 0.35 : 1 }}
                            />
                            <div className="flex-1 flex items-center justify-between min-w-0 relative z-10 pl-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`font-normal text-[16px] min-[370px]:text-[17px] min-[410px]:text-[18px] sm:text-[19px] leading-tight py-0.5 text-left ${showQuestHints ? 'break-keep' : ''}`} style={{ color: 'var(--color-text-main)' }}>
                                        {t(meta.label || m.label)}
                                    </span>
                                    {m.done && (
                                        <span
                                            className="text-xs font-normal h-5 w-5 rounded-full shrink-0 inline-flex items-center justify-center"
                                            style={{ background: 'rgba(46, 214, 197, 0.12)', color: '#0D9488' }}
                                            aria-label={t('ext_1640')}
                                        >
                                            ✓
                                        </span>
                                    )}
                                    {showQuestHints && !m.done && isRecommended && <span className="text-xs font-normal px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706' }}>{t('ext_1531')}</span>}
                                    {showQuestHints && isHighXp && <span className="text-xs font-normal px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(255, 107, 107, 0.12)', color: '#FF6B6B' }}>{t('ext_1593')}</span>}
                                    {showQuestHints && isChallenge && <span className="text-xs font-normal px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(91, 103, 122, 0.10)', color: 'var(--color-text-muted)' }}>{t('ext_1532')}</span>}
                                </div>
                                <span className={`font-normal text-xs shrink-0 ml-1 ${m.done ? 'text-slate-300' : 'text-[#FF9B73]'}`}>
                                    {showQuestHints ? t('ext_2919', { xp: m.xp }) : `+${m.xp}XP`}
                                </span>
                            </div>

                            <div
                                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center relative z-10 shadow-sm border-2 text-white"
                                style={{ background: '#FF9B73', borderColor: '#FF9B73', opacity: m.done ? 0.5 : 1 }}
                            >
                                <span className="quest-star--sm font-normal">▶</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyQuestBoard;
