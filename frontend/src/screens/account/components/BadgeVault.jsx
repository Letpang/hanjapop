import { BADGE_CATEGORIES, BADGE_PEDESTAL } from '../profileData.js';
import { getBadgeProgress } from '../my-page/badges/badgeProgress.js';
import BadgeVaultTile from '../my-page/badges/components/BadgeVaultTile.jsx';
import { useLang } from '../../../hooks/useLang.js';

const BadgeVault = ({ streak, totalStats, hoveredBadgeId, onHoverBadge, onSelectBadge }) => {
  const { t } = useLang();

  return (
    <div className="w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-white border-white dark:bg-slate-800 dark:border-slate-700">
      <div className="px-5 pt-4 pb-3 border-b rounded-t-[1.8rem] border-[#E5EAF2] bg-white dark:border-slate-700 dark:bg-slate-800">
        <h3 className="font-medium text-base tracking-normal text-[#3C3C3C] dark:text-slate-100">{t('ext_1564')}</h3>
      </div>

      <div className="grid grid-cols-3 px-4 pt-4 pb-6" style={{ columnGap: '10px', rowGap: '20px' }}>
        {BADGE_CATEGORIES.map((badge) => {
          const { current } = getBadgeProgress({ badge, streak, totalStats });

          return (
            <BadgeVaultTile
              key={badge.id}
              badge={badge}
              isHovered={hoveredBadgeId === badge.id}
              onHoverBadge={onHoverBadge}
              onSelectBadge={onSelectBadge}
              pedestal={BADGE_PEDESTAL[badge.id]}
              stage={current}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BadgeVault;
