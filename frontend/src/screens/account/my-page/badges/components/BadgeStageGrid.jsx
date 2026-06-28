import { getBadgeAssetPath } from '../badgeProgress.js';

const BadgeStageGrid = ({ badge, current }) => (
  <div className="grid grid-cols-5 gap-2">
    {[1, 2, 3, 4, 5].map(stage => {
      const done = stage <= current;
      return (
        <div key={stage} className="flex flex-col items-center gap-1.5">
          <div className="relative w-12 h-12">
            <img
              src={getBadgeAssetPath(badge, stage)}
              alt={`Lv.${stage}`}
              className={`w-full h-full object-contain transition-all ${!done ? 'grayscale opacity-35' : ''}`}
            />
            {done && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FF9B73] rounded-full flex items-center justify-center text-white text-base font-normal border border-white shadow-sm">
                ✓
              </div>
            )}
          </div>
          <span className={`text-base font-normal uppercase tracking-wider px-2 py-0.5 rounded-full transition-all ${
            stage === current
              ? 'bg-[#7C83FF] text-white shadow-sm'
              : done
                ? 'text-[#7C83FF] bg-[#7C83FF]/8'
                : 'text-[#AEB7C5]'
          }`}>
            Lv.{stage}
          </span>
        </div>
      );
    })}
  </div>
);

export default BadgeStageGrid;
