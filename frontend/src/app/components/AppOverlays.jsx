import AppModalStack from './overlays/AppModalStack.jsx';
import CharacterProgressOverlays from './overlays/CharacterProgressOverlays.jsx';
import RankJourneyOverlays from './overlays/RankJourneyOverlays.jsx';

export default function AppOverlays(props) {
  return (
    <>
      <RankJourneyOverlays
        handleStartNewJourney={props.handleStartNewJourney}
        isJourneyComplete={props.isJourneyComplete}
        journeyRound={props.journeyRound}
        onBrowseJourneyMemory={props.onBrowseJourneyMemory}
        selectedCharacter={props.selectedCharacter}
        setShowNewJourneyModal={props.setShowNewJourneyModal}
        setShowRankUpModal={props.setShowRankUpModal}
        showNewJourneyModal={props.showNewJourneyModal}
        showRankUpModal={props.showRankUpModal}
        userXp={props.userXp}
      />

      <CharacterProgressOverlays
        charToast={props.charToast}
        currentDay={props.currentDay}
        dismissToast={props.dismissToast}
        isInRankSoonZone={props.isInRankSoonZone}
        nextRankAvatar={props.nextRankAvatar}
        platform={props.platform}
        selectedCharacter={props.selectedCharacter}
        setCharToast={props.setCharToast}
        setCurrentScreen={props.setCurrentScreen}
        setShowSaveModal={props.setShowSaveModal}
        showSaveModal={props.showSaveModal}
        signInWithApple={props.signInWithApple}
        signInWithGoogle={props.signInWithGoogle}
        signInWithKakao={props.signInWithKakao}
        streak={props.streak}
        user={props.user}
        userXp={props.userXp}
      />

      <AppModalStack
        accountChoiceBusy={props.accountChoiceBusy}
        accountDataChoice={props.accountDataChoice}
        gradeTestAlert={props.gradeTestAlert}
        handleContinueWithoutLink={props.handleContinueWithoutLink}
        handleUsePreviousLogin={props.handleUsePreviousLogin}
        platform={props.platform}
        referralOffer={props.referralOffer}
        restoreFromCloud={props.restoreFromCloud}
        selectedCharacter={props.selectedCharacter}
        setCurrentScreen={props.setCurrentScreen}
        setGradeTestAlert={props.setGradeTestAlert}
        setReferralOffer={props.setReferralOffer}
        setShowLoginModal={props.setShowLoginModal}
        setShowPremiumModal={props.setShowPremiumModal}
        setUnlockedPack={props.setUnlockedPack}
        showLoginModal={props.showLoginModal}
        showPremiumModal={props.showPremiumModal}
        signInWithApple={props.signInWithApple}
        signInWithGoogle={props.signInWithGoogle}
        signInWithKakao={props.signInWithKakao}
        user={props.user}
        userXp={props.userXp}
      />
    </>
  );
}
