import { useLang } from '../../../../../hooks/useLang.js';

const GradeBadgeGrid = ({ badges, unlockedIdx }) => {
  const { t } = useLang();
  return (
  <div className="grid grid-cols-5 gap-2">
    {badges.map((badge, index) => {
      const unlocked = index <= unlockedIdx;
      const isCurrent = index === unlockedIdx + 1 && unlockedIdx < badges.length - 1;
      return (
        <div key={badge.grade} className="flex flex-col items-center gap-1.5">
          <div className="relative w-12 h-12">
            <img
              src={badge.imgSrc}
              alt={t(badge.label)}
              className={`w-full h-full object-contain transition-all ${!unlocked ? 'grayscale opacity-35' : ''}`}
            />
            {unlocked && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FF9B73] rounded-full flex items-center justify-center text-white text-base font-normal border border-white shadow-sm">
                ✓
              </div>
            )}
          </div>
          <span className={`text-base font-normal px-1.5 py-0.5 rounded-full transition-all ${
            unlocked
              ? 'bg-[#7C83FF] text-white shadow-sm'
              : isCurrent
                ? 'font-normal text-[color:var(--color-text-muted)] dark:text-slate-300'
                : 'text-[#AEB7C5]'
          }`}>
            {t(badge.label)}
          </span>
        </div>
      );
    })}
  </div>
  );
};

export default GradeBadgeGrid;
