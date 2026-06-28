import DailyFlashcardView from './DailyFlashcardView.jsx';
import DailyGameStage from './DailyGameStage.jsx';
import DailyMiniMap from './DailyMiniMap.jsx';
import DailyQuizStage from './DailyQuizStage.jsx';
import DailyResultsStage from './DailyResultsStage.jsx';
import { GamePickScreen, IntroScreen, QuizPickScreen } from './DailyStartScreens.jsx';

const DailySessionStageRouter = ({ missions, selectedCharacter, session, userNickname, userXp }) => {
  const renderMiniMap = (currentStepIndex) => (
    <DailyMiniMap
      currentStepIndex={currentStepIndex}
      chosenQuiz={session.chosenQuiz}
      chosenGame={session.chosenGame}
    />
  );

  if (session.step === 'results') {
    return (
      <DailyResultsStage
        dayNumber={session.dayNumber}
        dayData={session.dayData}
        todayHanja={session.todayHanja}
        resultMsg={session.resultMsg}
        selectedCharacter={selectedCharacter}
        userXp={userXp}
        chosenGame={session.chosenGame}
        chosenQuiz={session.chosenQuiz}
        doneTypes={session.sessionDoneTypesRef.current}
        userNickname={userNickname}
        missions={missions}
        doneCount={session.sessionDoneCount}
        onComplete={session.completeResults}
        onContinueNext={session.continueNextDay}
      />
    );
  }

  if (session.step === 'intro') return <IntroScreen {...session.introProps} />;
  if (session.step === 'flashcard') return <DailyFlashcardView {...session.flashcardProps} />;

  if (session.step === 'quizPick') {
    return (
      <QuizPickScreen
        onResult={(quiz) => {
          session.setChosenQuiz(quiz);
          session.setStep(quiz);
        }}
        onBack={() => session.setStep('intro')}
      />
    );
  }

  if (session.step === 'sentenceQuiz' || session.step === 'wordQuiz') {
    return (
      <DailyQuizStage
        quizType={session.step}
        dailyMapNode={renderMiniMap(1)}
        {...session.quizStageProps}
      />
    );
  }

  if (session.step === 'dice') {
    return (
      <GamePickScreen
        onResult={(game) => {
          session.setChosenGame(game);
          session.setStep(game);
        }}
        onBack={() => session.setStep('intro')}
      />
    );
  }

  if (session.step === 'shoot' || session.step === 'match') {
    return (
      <DailyGameStage
        gameType={session.step}
        dailyMapNode={renderMiniMap(2)}
        {...session.gameStageProps}
      />
    );
  }

  return null;
};

export default DailySessionStageRouter;
