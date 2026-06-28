import SentenceQuizExitModal from './sentence/components/SentenceQuizExitModal.jsx';
import SentenceQuizContent from './sentence/components/SentenceQuizContent.jsx';
import SentenceQuizHeader from './sentence/components/SentenceQuizHeader.jsx';
import SentenceQuizResultOverlay from './sentence/components/SentenceQuizResultOverlay.jsx';
import { useSentenceQuizEngine } from './sentence/hooks/useSentenceQuizEngine.js';
import { DEFAULT_CLEAR_XP, DEFAULT_QUIZ_COUNT } from './sentence/sentenceQuizUtils.js';
import QuizStudyScreenFrame from './shared/components/QuizStudyScreenFrame.jsx';

const SentenceQuizScreen = ({
    onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onMarkWordWrong,
    onWordCorrect, onStageClear, onWordSeen, onGoToReview,
    srsData, masteryData, userLevel, userXp, selectedCharacter,
    getRewardPreview, contentPool, onGetNextWordIds, unlockedHanjaIds,
    currentDayHanjaIds, seenHanjaIds, mainSeenHanjaIds, seenWordIds,
    dailyMapNode, hideRetry, missionDone = false,
    quizCount = DEFAULT_QUIZ_COUNT, clearXp = DEFAULT_CLEAR_XP,
}) => {
    const quiz = useSentenceQuizEngine({
        clearXp,
        contentPool,
        currentDayHanjaIds,
        dailyMapNode,
        getRewardPreview,
        mainSeenHanjaIds,
        masteryData,
        missionDone,
        onBack,
        onGetNextWordIds,
        onGoToReview,
        onHanjaAcquired,
        onMarkCorrect,
        onMarkWordWrong,
        onMarkWrong,
        onStageClear,
        onWordCorrect,
        onWordSeen,
        quizCount,
        seenHanjaIds,
        seenWordIds,
        selectedCharacter,
        srsData,
        unlockedHanjaIds,
        userLevel,
        userXp,
    });

    const header = (
        <SentenceQuizHeader
            characterAvatar={quiz.characterAvatar}
            completing={quiz.completing}
            currentAnswered={quiz.currentAnswered}
            displayQuestionNumber={quiz.displayQuestionNumber}
            onBackPress={quiz.started ? () => quiz.setShowExitModal(true) : onBack}
            plannedQuizTotal={quiz.plannedQuizTotal}
            selectedCharacter={selectedCharacter}
            started={quiz.started}
            totalAnswered={quiz.totalAnswered}
        />
    );

    return (
        <>
            <QuizStudyScreenFrame header={header} isActive={quiz.started}>
                <SentenceQuizContent quiz={quiz} />
            </QuizStudyScreenFrame>

            {quiz.showExitModal && (
                <SentenceQuizExitModal
                    dailyMapNode={dailyMapNode}
                    selectedCharacter={selectedCharacter}
                    onCancel={() => quiz.setShowExitModal(false)}
                    onConfirm={quiz.handleExitConfirm}
                />
            )}

            <SentenceQuizResultOverlay
                started={quiz.started}
                gameState={quiz.gameState}
                completing={quiz.completing}
                resultStats={quiz.resultStats}
                score={quiz.score}
                totalAnswered={quiz.totalAnswered}
                resultClearMsg={quiz.resultClearMsg}
                selectedCharacter={selectedCharacter}
                dailyMapNode={dailyMapNode}
                reward={quiz.resultReward}
                clearXp={clearXp}
                missionXp={quiz.missionXpGranted}
                hideRetry={hideRetry}
                onRetry={() => quiz.startQuiz()}
                onBack={quiz.handleResultBack}
                onNextStage={quiz.deliverStageClear}
            />
        </>
    );
};

export default SentenceQuizScreen;
