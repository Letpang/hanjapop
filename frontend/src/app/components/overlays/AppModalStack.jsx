import { Suspense } from 'react';
import { getRankDetails } from '../../../utils/rankUtils.js';
import {
  AccountDataChoiceModal,
  GradeTestAlertModal,
  LoginModal,
  PremiumModal,
} from '../../appScreens.js';

const AppModalStack = ({
  accountChoiceBusy,
  accountDataChoice,
  gradeTestAlert,
  handleContinueWithoutLink,
  handleUsePreviousLogin,
  platform,
  referralOffer,
  restoreFromCloud,
  selectedCharacter,
  setCurrentScreen,
  setGradeTestAlert,
  setReferralOffer,
  setShowLoginModal,
  setShowPremiumModal,
  setUnlockedPack,
  showLoginModal,
  showPremiumModal,
  signInWithApple,
  signInWithGoogle,
  signInWithKakao,
  user,
  userXp,
}) => (
  <Suspense fallback={null}>
    {showLoginModal && (
      <LoginModal
        platform={platform}
        signInWithApple={signInWithApple}
        signInWithGoogle={signInWithGoogle}
        signInWithKakao={signInWithKakao}
        onClose={() => setShowLoginModal(false)}
      />
    )}
    {accountDataChoice && (
      <AccountDataChoiceModal
        previousProvider={accountDataChoice.previousProvider}
        currentProvider={accountDataChoice.currentProvider}
        localXp={accountDataChoice.localXp}
        busy={accountChoiceBusy}
        onUsePreviousLogin={handleUsePreviousLogin}
        onContinueWithoutLink={handleContinueWithoutLink}
      />
    )}
    {showPremiumModal && (
      <PremiumModal
        user={user}
        referralOffer={referralOffer}
        onClose={() => setShowPremiumModal(false)}
        onShowLogin={() => {
          setShowPremiumModal(false);
          if (user) {
            restoreFromCloud();
          } else {
            setShowLoginModal(true);
          }
        }}
        avatarUrl={selectedCharacter ? getRankDetails(userXp, selectedCharacter).avatar : '/assets/images/characters/default_3d.webp'}
        onPurchaseSuccess={(pack) => {
          setUnlockedPack(pack);
          setReferralOffer(null);
          setShowPremiumModal(false);
        }}
        onReferralOfferConsumed={() => setReferralOffer(null)}
      />
    )}
    {gradeTestAlert && (
      <GradeTestAlertModal
        grade={gradeTestAlert}
        onNavigate={setCurrentScreen}
        onClose={() => setGradeTestAlert(null)}
      />
    )}
  </Suspense>
);

export default AppModalStack;
