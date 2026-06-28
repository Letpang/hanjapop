import { useReferralProgress } from '../my-page/hooks/useReferralProgress.js';
import ReferralMilestoneGrid from '../my-page/referral/components/ReferralMilestoneGrid.jsx';
import ReferralProgressBar from '../my-page/referral/components/ReferralProgressBar.jsx';
import ReferralProgressHeader from '../my-page/referral/components/ReferralProgressHeader.jsx';
import ReferralRewardStatus from '../my-page/referral/components/ReferralRewardStatus.jsx';
import ReferralShareRow from '../my-page/referral/components/ReferralShareRow.jsx';

const ReferralProgressCard = ({ isDarkMode }) => {
  const referral = useReferralProgress();

  if (!referral.isVisible) return null;

  return (
    <section className={`w-full rounded-[2rem] border-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden ${
      isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'
    }`}>
      <ReferralProgressHeader count={referral.count} subtitle={referral.subtitle} />
      <div className="p-5">
        <ReferralProgressBar progress={referral.progress} />
        <ReferralMilestoneGrid milestones={referral.milestones} />
        <ReferralShareRow
          copied={referral.copied}
          referralCode={referral.referralCode}
          onShare={referral.handleShare}
        />
        <ReferralRewardStatus
          activeOffer={referral.activeOffer}
          fullpackGranted={referral.fullpackGranted}
          offerExpiryLabel={referral.offerExpiryLabel}
        />
      </div>
    </section>
  );
};

export default ReferralProgressCard;
