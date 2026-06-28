import DailyJourneyMap from './DailyJourneyMap.jsx';
import DailyResultsScreen from './DailyResultsScreen.jsx';

const DailyResultsStage = ({
  dayNumber,
  dayData,
  todayHanja,
  resultMsg,
  selectedCharacter,
  userXp,
  chosenGame,
  chosenQuiz,
  doneTypes,
  userNickname,
  missions,
  doneCount,
  onComplete,
  onContinueNext,
}) => (
  <>
    <DailyJourneyMap
      dayNumber={dayNumber}
      theme={dayData.theme}
      charId={selectedCharacter}
      userXp={userXp}
      done={doneTypes}
      chosenGame={chosenGame}
      chosenQuiz={chosenQuiz}
      onTapNode={() => {}}
      onShowResults={() => {}}
      onBack={() => {}}
      todayHanja={todayHanja}
    />
    <DailyResultsScreen
      todayHanja={todayHanja}
      clearMsg={resultMsg}
      onComplete={onComplete}
      onContinueNext={onContinueNext}
      selectedCharacter={selectedCharacter}
      userNickname={userNickname}
      dayNumber={dayNumber}
      missions={missions}
      doneCount={doneCount}
    />
  </>
);

export default DailyResultsStage;
