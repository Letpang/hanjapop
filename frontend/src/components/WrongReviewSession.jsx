import React, { useState } from 'react';
import FlashcardScreen from './FlashcardScreen.jsx';
import WordQuizScreen from './WordQuizScreen.jsx';

const WrongReviewSession = ({
    onBack, onComplete, onHanjaAcquired, selectedCharacter,
    onMarkCorrect, onWordCorrect, onClearAllWrong, masteryData, srsData, userLevel,
    contentPool, isPremium
}) => {
    const [phase, setPhase] = useState('flashcard');

    if (phase === 'flashcard') {
        return (
            <FlashcardScreen
                onBack={onBack}
                isPremium={isPremium}
                contentPool={contentPool}
                unlockedHanjaIds={null} // Not used for review
                onHanjaAcquired={() => {}} // Skip individual XP during review phase
                onStageClear={() => setPhase('quiz')}
                onCardFlip={() => {}}
                onWriteHanja={() => {}} // Could be implemented, but flashcard in review usually skips writing unless requested
                onMarkCorrect={() => {}} 
                onMarkWrong={() => {}}
                onMarkWordWrong={() => {}}
                onStudySheetComplete={() => {}}
                userXp={0}
                selectedCharacter={selectedCharacter}
            />
        );
    }

    if (phase === 'quiz') {
        return (
            <WordQuizScreen
                onBack={onBack}
                onStageClear={(correct, total) => {
                    // 단어 퀴즈 완료 시 (결과 상관없이 1사이클 돌면 완료 처리)
                    // 오답 카운트 일괄 초기화
                    if (onClearAllWrong) {
                        onClearAllWrong();
                    }
                    // 약속된 50 XP 지급 (완료 시점)
                    if (onHanjaAcquired) {
                        onHanjaAcquired(null, 50);
                    }
                    // 메인으로 이동
                    if (onComplete) {
                        onComplete();
                    }
                }}
                onHanjaAcquired={() => {}} // Skip individual XP
                onWordCorrect={onWordCorrect} // Keep tracking SRS
                onWordSeen={() => {}}
                onMarkCorrect={onMarkCorrect} // Keep tracking SRS
                onMarkWrong={() => {}} // It's already wrong, if they get it wrong again, it's fine
                onMarkWordWrong={() => {}}
                onGoToReview={() => {}} // Cannot go to review from review
                srsData={srsData}
                masteryData={masteryData}
                userLevel={userLevel}
                userXp={0}
                selectedCharacter={selectedCharacter}
                isPremium={isPremium}
                unlockedHanjaIds={null}
                contentPool={contentPool}
            />
        );
    }

    return null;
};

export default WrongReviewSession;
