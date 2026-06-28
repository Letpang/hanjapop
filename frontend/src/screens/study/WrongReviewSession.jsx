import { useState } from 'react';
import FlashcardScreen from './FlashcardScreen.jsx';
import WordQuizScreen from '../quiz/WordQuizScreen.jsx';
import { useLang } from '../../hooks/useLang.js';

const WrongReviewSession = ({
    onBack, onComplete, onHanjaAcquired, selectedCharacter,
    onMarkCorrect, onWordCorrect, onClearAllWrong, masteryData, srsData, wordData, userLevel, userXp,
    contentPool, isPremium
}) => {
    const [phase, setPhase] = useState('flashcard');
    const { t } = useLang();

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
                userXp={userXp}
                selectedCharacter={selectedCharacter}
            />
        );
    }

    if (phase === 'quiz') {
        return (
            <WordQuizScreen
                onBack={onBack}
                onStageClear={(correct, total) => {
                    // {t('ext_1492')} 완료 시 (결과 상관없이 1사이클 돌면 완료 처리)
                    // {t('ext_277')} 카운트 일괄 초기화
                    if (onClearAllWrong) {
                        onClearAllWrong();
                    }
                    // {t('ext_159')} XP 지급 (완료 시점)
                    if (onHanjaAcquired) {
                        onHanjaAcquired(null, 50);
                    }
                    // {t('ext_1')}으로 이동
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
                wordData={wordData}
                userLevel={userLevel}
                userXp={userXp}
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