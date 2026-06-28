import { lazy, Suspense } from 'react';
import { hasPassedQuizMission } from '../hooks/useDailySessionProgress.js';

const SentenceQuizScreen = lazy(() => import('../../quiz/SentenceQuizScreen.jsx'));
const WordQuizScreen = lazy(() => import('../../quiz/WordQuizScreen.jsx'));

const QUIZ_CONFIG = {
    sentenceQuiz: {
        Component: SentenceQuizScreen,
        missionType: 'sentenceQuiz',
        correctXp: 10,
        quizCount: 5,
    },
    wordQuiz: {
        Component: WordQuizScreen,
        missionType: 'wordQuiz',
        correctXp: 5,
        quizCount: 6,
    },
};

const DailyQuizStage = ({
    quizType,
    dailyMapNode,
    onBack,
    onComplete,
    contentPool,
    getNextWordIds,
    selectedCharacter,
    missions,
    userXp,
    getRewardPreview,
    onHanjaAcquired,
    onMarkWordWrong,
    onWordCorrect,
    srsData,
    masteryData,
    wordData,
    seenHanjaIds,
    seenWordIds,
    markHanjaSeen,
    markWordSeen,
    onWordSeen,
    trackMission,
    addBonusXp,
    addTodayStat,
}) => {
    const config = QUIZ_CONFIG[quizType] || QUIZ_CONFIG.wordQuiz;
    const QuizComponent = config.Component;

    return (
        <Suspense fallback={<div className="min-h-screen " />}>
            <QuizComponent
                autoStart={true}
                hideRetry={true}
                dailyMapNode={dailyMapNode}
                onBack={onBack}
                contentPool={contentPool}
                onGetNextWordIds={getNextWordIds}
                selectedCharacter={selectedCharacter}
                missionDone={missions?.find(m => m.type === config.missionType)?.done ?? false}
                userXp={userXp}
                getRewardPreview={getRewardPreview}
                onHanjaAcquired={onHanjaAcquired}
                onMarkWordWrong={(wordId, hanjaId, reading, meaning, wordText) => {
                    if (onMarkWordWrong) onMarkWordWrong(wordId, hanjaId, reading, meaning, wordText);
                }}
                onWordCorrect={(wordId) => {
                    if (onWordCorrect) onWordCorrect(wordId);
                }}
                srsData={srsData}
                masteryData={masteryData}
                wordData={wordData}
                seenHanjaIds={seenHanjaIds}
                seenWordIds={seenWordIds}
                onWordSeen={(wordId) => {
                    markWordSeen([wordId]);
                    if (onWordSeen) onWordSeen(wordId);
                }}
                onStageClear={(correct, total, newSeenIds) => {
                    if (newSeenIds) markHanjaSeen(newSeenIds);
                    if (onHanjaAcquired) onHanjaAcquired(null, 20 + correct * config.correctXp);
                    if (hasPassedQuizMission(correct, total)) {
                        trackMission(config.missionType, 1, addBonusXp);
                    }
                    if (addTodayStat) addTodayStat(config.missionType);
                    onComplete();
                }}
                quizCount={config.quizCount}
                clearXp={20}
            />
        </Suspense>
    );
};

export default DailyQuizStage;
