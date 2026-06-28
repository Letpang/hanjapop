import { getRankDetails, getCharacterScale, getCharacterTranslateY } from '../../../utils/rankUtils.js';
import { useLang } from '../../../hooks/useLang.js';

const ExplorerProfileCard = ({ userNickname, userXp, selectedCharacter, isDarkMode, onNavigate, style }) => {
    const { t } = useLang();
    const myXp = userXp || 0;
    const rank = getRankDetails(myXp, selectedCharacter);
    const xpToNext = rank.nextXp != null ? rank.nextXp - myXp : null;

    return (
        <div className="w-full max-w-md relative" style={style}>
            <button
                onClick={() => onNavigate('mypage')}
                className="mm-profile-card relative w-full text-left rounded-[1.5rem] py-3.5 px-5 shadow-xl overflow-hidden flex items-center gap-4 active:scale-[0.98] hover:shadow-2xl transition-all group border"
                style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2ED6C5] rounded-full blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity" />

                <div className="shrink-0 relative">
                    <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center shadow-inner relative z-10 border-4" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-bg-surface)' }}>
                        <img
                            src={rank.avatar}
                            alt="character"
                            className="w-full h-full object-contain p-1"
                            style={{ filter: 'drop-shadow(0 8px 12px rgba(46,214,197,0.25))', transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${getCharacterScale(selectedCharacter, `rank${rank.imageRank}`)})` }}
                            onError={e => { e.target.src = '/assets/images/characters/default_3d.webp'; }}
                        />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF9B73] to-[#FF6B6B] text-white text-base font-normal px-2.5 py-0.5 rounded-full shadow-md z-20 border-2 border-white">
                        Lv.{rank.level}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-start min-w-0 z-10 pr-6">
                    <h1 className="font-medium text-[18px] truncate w-full tracking-normal leading-tight transition-colors" style={{ color: 'var(--color-text-main)' }}>
                        {userNickname || t('ext_980')}{t('ext_3185')}
                    </h1>

                    <div className="flex items-center gap-3 mt-1">
                        <span className="font-normal text-base px-1.5 py-0.5 rounded bg-[#E0F7FA] text-[#0D9488]">{t('ext_2321', { rankName: t(rank.rankName) })}</span>
                        <span className="font-normal text-base text-[#8f99ad]">{myXp.toLocaleString()} XP</span>
                    </div>

                    <div className="w-full mt-2">
                        <div className="flex justify-between items-end mb-1 px-0.5">
                            <span className="text-base font-normal text-[#8f99ad]">
                                {xpToNext != null ? t('ext_2760', { xpToNext: xpToNext.toLocaleString() }) : t('ext_1721')}
                            </span>
                        </div>
                        <div className="w-full h-[10px] rounded-full bg-slate-200 overflow-hidden shadow-inner">
                            <div className="quiz-progress-fill"
                                style={{ width: `${rank.progress}%`, background: 'linear-gradient(90deg, #2ED6C5, #0D9488)' }} />
                        </div>
                    </div>
                </div>

                <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-sm border flex items-center justify-center transition-colors z-20" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-0.5">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </button>
        </div>
    );
};

export default ExplorerProfileCard;
