import WordQuizExitModal from './word/components/WordQuizExitModal.jsx';
import WordQuizHeader from './word/components/WordQuizHeader.jsx';
import WordQuizContent from './word/components/WordQuizContent.jsx';
import { useWordQuizEngine } from './word/hooks/useWordQuizEngine.js';
import { DEFAULT_CLEAR_XP, DEFAULT_QUIZ_COUNT } from './word/wordQuizUtils.js';
import QuizStudyScreenFrame from './shared/components/QuizStudyScreenFrame.jsx';

const WordQuizScreen = ({
    onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onMarkWordWrong,
    onWordCorrect, onStageClear, onWordSeen, onGoToReview,
    srsData, masteryData, wordData, userLevel, userXp, selectedCharacter,
    getRewardPreview, contentPool, onGetNextWordIds, unlockedHanjaIds,
    seenWordIds, dailyMapNode, hideRetry,
    missionDone = false, quizCount = DEFAULT_QUIZ_COUNT, clearXp = DEFAULT_CLEAR_XP,
}) => {
    const quiz = useWordQuizEngine({
        contentPool,
        dailyMapNode,
        missionDone,
        onBack,
        onGetNextWordIds,
        onHanjaAcquired,
        onMarkCorrect,
        onMarkWordWrong,
        onStageClear,
        onWordCorrect,
        onWordSeen,
        quizCount,
        seenWordIds,
        selectedCharacter,
        unlockedHanjaIds,
        userLevel,
        userXp,
        wordData,
    });

    const header = (
        <WordQuizHeader
            characterAvatar={quiz.characterAvatar}
            completing={quiz.completing}
            currentAnswered={quiz.currentAnswered}
            currentIdx={quiz.currentIdx}
            isQuizActive={quiz.isQuizActive}
            onBack={onBack}
            onRequestExit={() => quiz.setShowExitModal(true)}
            questionCount={quiz.questions.length}
            selectedCharacter={selectedCharacter}
        />
    );

    return (
        <>
            <QuizStudyScreenFrame header={header}>
                <WordQuizContent
                    clearXp={clearXp}
                    contentPool={contentPool}
                    dailyMapNode={dailyMapNode}
                    getRewardPreview={getRewardPreview}
                    hideRetry={hideRetry}
                    onBack={onBack}
                    quiz={quiz}
                    selectedCharacter={selectedCharacter}
                />
            </QuizStudyScreenFrame>

            {quiz.showExitModal && (
                <WordQuizExitModal
                    dailyMapNode={dailyMapNode}
                    selectedCharacter={selectedCharacter}
                    onCancel={() => quiz.setShowExitModal(false)}
                    onConfirm={quiz.handleExitConfirm}
                />
            )}
        </>
    );
};

export default WordQuizScreen;
