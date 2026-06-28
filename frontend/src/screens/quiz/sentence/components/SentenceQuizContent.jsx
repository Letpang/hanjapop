import SentenceQuizPlayCard from './SentenceQuizPlayCard.jsx';
import SentenceQuizSetupView from './SentenceQuizSetupView.jsx';

const SentenceQuizContent = ({ quiz }) => (
    <>
        {!quiz.started && (
            <SentenceQuizSetupView
                viewMode={quiz.viewMode}
                selectedGrade={quiz.selectedGrade}
                selectedCategory={quiz.selectedCategory}
                categories={quiz.categories}
                characterAvatar={quiz.characterAvatar}
                unlockedGrades={quiz.unlockedGrades}
                unlockedIds={quiz.unlockedIds}
                onViewModeChange={quiz.setViewMode}
                onGradeSelect={quiz.setSelectedGrade}
                onCategorySelect={quiz.setSelectedCategory}
                onStart={() => quiz.startQuiz()}
            />
        )}

        {quiz.started && quiz.currentQuiz && (quiz.gameState === 'playing' || quiz.gameState === 'result') && (
            <SentenceQuizPlayCard
                questionKey={quiz.questionKey}
                currentQuiz={quiz.currentQuiz}
                options={quiz.options}
                currentAnswer={quiz.currentAnswer}
                isLastQuestion={quiz.isLastQuestion}
                completing={quiz.completing}
                speakText={quiz.speakText}
                combo={quiz.combo}
                onCorrect={quiz.handleCorrect}
                onWrong={quiz.handleWrong}
                onNext={quiz.handleNext}
                onCorrectSelected={() => quiz.setCurrentAnswered(true)}
            />
        )}
    </>
);

export default SentenceQuizContent;
