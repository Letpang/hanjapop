import WordQuizEmptyState from './WordQuizEmptyState.jsx';
import WordQuizPlayCard from './WordQuizPlayCard.jsx';
import WordQuizResultOverlay from './WordQuizResultOverlay.jsx';
import WordQuizSetupView from './WordQuizSetupView.jsx';

const WordQuizContent = ({
    clearXp,
    contentPool,
    dailyMapNode,
    getRewardPreview,
    hideRetry,
    onBack,
    quiz,
    selectedCharacter,
}) => (
    <>
        {quiz.phase === 'select' && (
            <WordQuizSetupView
                viewMode={quiz.viewMode}
                gradeFilter={quiz.gradeFilter}
                categoryFilter={quiz.categoryFilter}
                categories={quiz.categories}
                characterAvatar={quiz.characterAvatar}
                unlockedGrades={quiz.unlockedGrades}
                unlockedIds={quiz.unlockedIds}
                onViewModeChange={quiz.setViewMode}
                onGradeSelect={quiz.setGradeFilter}
                onCategorySelect={quiz.setCategoryFilter}
                onStart={() => quiz.startQuiz()}
            />
        )}

        {quiz.isQuizActive && quiz.q && (
            <WordQuizPlayCard
                q={quiz.q}
                currentIdx={quiz.currentIdx}
                questionCount={quiz.questions.length}
                completing={quiz.completing}
                contentPool={contentPool}
                combo={quiz.combo}
                onCorrect={quiz.handleCorrect}
                onWrong={quiz.handleWrong}
                onNext={quiz.handleNext}
                onPrev={quiz.handlePrev}
                onCorrectSelected={() => quiz.setCurrentAnswered(true)}
            />
        )}

        {quiz.phase === 'quiz' && !quiz.q && <WordQuizEmptyState onBack={onBack} />}

        <WordQuizResultOverlay
            phase={quiz.phase}
            questions={quiz.questions}
            correctCount={quiz.correctCount}
            clearXp={clearXp}
            dailyMapNode={dailyMapNode}
            getRewardPreview={getRewardPreview}
            hideRetry={hideRetry}
            missionXp={quiz.missionXp}
            resultClearMsg={quiz.resultClearMsg}
            selectedCharacter={selectedCharacter}
            onRetry={quiz.startQuiz}
            onBack={quiz.handleResultBack}
        />
    </>
);

export default WordQuizContent;
