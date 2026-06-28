import { getBadgeAssetPath } from '../badgeProgress.js';
import BadgeTooltip from './BadgeTooltip.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const BadgeVaultTile = ({ badge, isHovered, onHoverBadge, onSelectBadge, pedestal, stage }) => {
  const { t } = useLang();
  const label = t(badge.label);
  return (
  <button
    onClick={() => onSelectBadge(badge)}
    onMouseEnter={() => onHoverBadge(badge.id)}
    onMouseLeave={() => onHoverBadge(null)}
    className="group relative flex flex-col items-center active:scale-95 transition-all"
  >
    <BadgeTooltip isVisible={isHovered} label={label} />

    <div className="w-full flex flex-col items-center" style={{ height: '110px' }}>
      <div className="flex-1 w-full flex items-end justify-center">
        <img
          src={getBadgeAssetPath(badge, stage)}
          alt={label}
          style={{
            height: '84px',
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            objectPosition: 'bottom',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.14)) drop-shadow(0 8px 16px rgba(0,0,0,0.08))',
          }}
          className="transform group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="w-full flex justify-center mt-1.5">
        <div style={{
          width: '68%',
          height: '9px',
          borderRadius: '50%',
          background: `linear-gradient(180deg, rgba(255,255,255,0.80) 0%, ${pedestal.bg} 100%)`,
          boxShadow: `0 6px 16px ${pedestal.shadow}, 0 2px 4px rgba(120,130,160,0.06), inset 0 1px 2px rgba(255,255,255,0.95)`,
        }} />
      </div>
    </div>

    <div className={`mt-3.5 px-3 py-1 rounded-full text-base font-normal leading-none transition-all ${
      stage === 5
        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm shadow-orange-500/20 active:from-amber-500 active:to-orange-600'
        : 'bg-[#F0F3F5] text-[#5A6E85] group-hover:bg-[#E2E6E9] group-hover:text-[#3C4A5A] dark:bg-slate-700 dark:text-slate-300'
    }`}>
      Lv.{stage}
    </div>
  </button>
  );
};

export default BadgeVaultTile;
