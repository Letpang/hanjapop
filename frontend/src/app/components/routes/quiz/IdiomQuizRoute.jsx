import { SK } from '../../../../constants/storageKeys.js';
import HANJA_DATA from '../../../../hanja_unified.json';
import { IdiomScreen } from '../../../appScreens.js';

const IdiomQuizRoute = ({
  activeStage,
  addBonusXp,
  backToMain,
  effectivePool,
  getRewardPreview,
  handleHanjaAcquired,
  missions,
  selectedCharacter,
  selectedGrade,
  updateMissionProgress,
  userXp,
}) => {
  const activeHanja = HANJA_DATA.find((hanja) => effectivePool?.main?.hanjaIds?.includes(hanja.id));
  const idiomGrade = selectedGrade || activeHanja?.grade || localStorage.getItem(SK.UNLOCKED_GRADE) || '8급';

  return (
    <IdiomScreen
      onBack={backToMain}
      contentPool={effectivePool}
      grade={idiomGrade}
      day={activeStage}
      userXp={userXp}
      selectedCharacter={selectedCharacter}
      getRewardPreview={getRewardPreview}
      onHanjaAcquired={handleHanjaAcquired}
      missionDone={missions?.find((mission) => mission.type === 'idiomQuiz')?.done ?? false}
      onComplete={(score = 0) => {
        handleHanjaAcquired(null, 25 + score * 5);
        updateMissionProgress('idiomQuiz', 1, addBonusXp);
      }}
    />
  );
};

export default IdiomQuizRoute;
