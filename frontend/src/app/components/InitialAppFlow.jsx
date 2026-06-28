import { CharacterSelectionScreen, OnboardingScreen } from '../appScreens.js';

const InitialAppFlow = ({
  handleHanjaAcquired,
  onboardingDone,
  selectedCharacter,
  setOnboardingDone,
  setSelectedCharacter,
  setUserNickname,
}) => {
  if (!selectedCharacter) {
    return (
      <CharacterSelectionScreen
        onSelect={(id, nickname) => {
          setSelectedCharacter(id);
          setUserNickname(nickname);
        }}
      />
    );
  }

  if (!onboardingDone) {
    return (
      <OnboardingScreen
        selectedCharacter={selectedCharacter}
        onComplete={(grade, xp) => {
          setOnboardingDone(true);
          handleHanjaAcquired(null, xp);
        }}
      />
    );
  }

  return null;
};

export default InitialAppFlow;
