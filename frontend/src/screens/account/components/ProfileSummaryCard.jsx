import { getLevel, getRankDetails, getCharacterScale, getCharacterTranslateY, LEVEL_THRESHOLDS } from '../../../utils/rankUtils.js';
import { useLang } from '../../../hooks/useLang.js';

const ProfileSummaryCard = ({
  userNickname,
  userXp,
  selectedCharacter,
  currentGradeBadge,
  studyBadge,
  streakCount,
  finalJourney,
  onOpenGradeModal,
}) => {
  const { t } = useLang();
  const xp = userXp || 0;
  const level = getLevel(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpProgress = level >= 10 ? 100 : Math.min(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100);
  const rankDetails = getRankDetails(xp, selectedCharacter);
  const characterImage = selectedCharacter ? rankDetails.avatar : '/assets/images/characters/default_3d.webp';

  return (
    <div className="w-full rounded-[2rem] border-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-5 flex items-center gap-5 bg-white border-white dark:bg-slate-800 dark:border-slate-700">
      <div className="relative shrink-0 w-24 h-24 rounded-full flex items-center justify-center overflow-visible bg-[#FDFBF7] shadow-inner border-4 border-slate-100 dark:bg-slate-700 dark:border-slate-600">
        <img
          src={characterImage}
          alt="character"
          className="w-full h-full object-contain p-1 filter drop-shadow-[0_8px_12px_rgba(46,214,197,0.25)] z-10"
          style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${1.1 * getCharacterScale(selectedCharacter, `rank${rankDetails.imageRank}`)})` }}
          onError={e => { e.target.src = '/assets/images/characters/default_3d.webp'; }}
        />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF9B73] to-[#FF6B6B] text-white font-normal text-xs px-2.5 py-0.5 rounded-full border-2 border-white shadow-md whitespace-nowrap z-20">
          Lv.{level}
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 flex-nowrap">
          <span className="font-normal text-xl tracking-normal leading-none truncate max-w-[150px] text-[#3C3C3C] dark:text-slate-100">
            {userNickname || 'Explorer'}
          </span>
          {currentGradeBadge ? (
            <div
              onClick={onOpenGradeModal}
              className="relative flex items-center justify-center shrink-0 rounded-full bg-[var(--color-bg-surface)] shadow-sm border border-slate-100/40 dark:border-slate-600 active:scale-95 transition-transform cursor-pointer"
              style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 2px 5px rgba(109,111,242,0.25))' }}
              title={t('ext_2674', { label: currentGradeBadge.label })}
            >
              <img src={currentGradeBadge.imgSrc} alt={currentGradeBadge.label} className="object-contain" style={{ width: '22px', height: '22px' }} />
            </div>
          ) : (
            <div
              onClick={onOpenGradeModal}
              className="relative flex items-center justify-center shrink-0 rounded-full bg-white/70 dark:bg-slate-700 shadow-sm border border-slate-100/30 dark:border-slate-600 active:scale-95 transition-transform cursor-pointer"
              style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.06))' }}
              title={t('ext_2509', { label: t(studyBadge.label) })}
            >
              <img src={studyBadge.imgSrc} alt={t(studyBadge.label)} className="object-contain grayscale opacity-40" style={{ width: '20px', height: '20px' }} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#7C83FF] font-normal text-sm">{(finalJourney?.title ? t(finalJourney.title) : null) || t(rankDetails.rankName) || 'Junior Master'}</span>
          <span className="text-xs font-normal text-[#FF9B73] whitespace-nowrap px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: 'rgba(255,155,115,0.12)' }}>
            <img src="/assets/images/icons/icon_streak_mini.webp" alt="streak" className="w-4 h-4 object-contain" /> {t('ext_2312', { streakCount })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 relative rounded-full h-5 overflow-hidden bg-slate-200/80 dark:bg-slate-600" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${xpProgress}%`, background: 'linear-gradient(to right, #FFB38A, #FF7E8A)', boxShadow: '0 0 18px rgba(255,126,138,0.35)' }}
            >
              <div className="absolute top-0.5 left-1 right-1 h-2 bg-white/25 rounded-full" />
            </div>
          </div>
          <span className="font-normal text-xs whitespace-nowrap text-[#3E4A5C] dark:text-[#AEB7C5]">{xp.toLocaleString()} XP</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummaryCard;
