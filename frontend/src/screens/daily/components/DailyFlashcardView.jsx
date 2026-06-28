import { useDailyFlashcards } from '../hooks/useDailyFlashcards.js';
import DailyFlashcardCard from './DailyFlashcardCard.jsx';
import DailyFlashcardClearPopup from './DailyFlashcardClearPopup.jsx';
import DailyFlashcardHeader from './DailyFlashcardHeader.jsx';
import DailyFlashcardNav from './DailyFlashcardNav.jsx';
import DailyFlashcardProgress from './DailyFlashcardProgress.jsx';
import DailyWordsPopup from './DailyWordsPopup.jsx';

const DailyFlashcardView = ({ items, onBack, onCardFlip, onStageClear, getRewardPreview }) => {
    const flashcards = useDailyFlashcards({ items, onCardFlip });

    return (
        <>
            <div className="fixed inset-0 w-full h-full z-50 flex flex-col items-center px-6 overflow-y-auto ">
                <div className="w-full max-w-sm mx-auto flex flex-col relative z-10 safe-top pt-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
                    <DailyFlashcardHeader
                        currentIndex={flashcards.currentIndex}
                        total={items.length}
                        onBack={onBack}
                    />
                    <DailyFlashcardProgress
                        currentIndex={flashcards.currentIndex}
                        flippedSet={flashcards.flippedSet}
                        total={items.length}
                    />
                    <DailyFlashcardCard
                        isFlipped={flashcards.isFlipped}
                        isTransitioning={flashcards.isTransitioning}
                        item={flashcards.item}
                        onCardClick={flashcards.handleCardClick}
                        onShowWords={() => flashcards.setShowWords(true)}
                    />
                    <DailyFlashcardNav
                        currentIndex={flashcards.currentIndex}
                        isFlipped={flashcards.isFlipped}
                        isLastCard={flashcards.isLastCard}
                        onNext={flashcards.handleNext}
                        onPrevious={flashcards.handlePrevious}
                    />
                </div>
            </div>

            {flashcards.showWords && (
                <DailyWordsPopup
                    item={flashcards.item}
                    onClose={() => flashcards.setShowWords(false)}
                />
            )}

            {flashcards.showClearPopup && (
                <DailyFlashcardClearPopup
                    clearMsg={flashcards.clearMsg}
                    getRewardPreview={getRewardPreview}
                    onStageClear={() => {
                        flashcards.setShowClearPopup(false);
                        onStageClear();
                    }}
                />
            )}
        </>
    );
};

export default DailyFlashcardView;
