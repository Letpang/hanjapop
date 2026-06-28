import QuizCard from '../../../../components/common/QuizCard.jsx';
import WordQuizAnswerDetail from './WordQuizAnswerDetail.jsx';
import WordQuizFrontContent from './WordQuizFrontContent.jsx';

const WordQuizPlayCard = ({
    q,
    currentIdx,
    questionCount,
    completing,
    contentPool,
    combo,
    onCorrect,
    onWrong,
    onNext,
    onPrev,
    onCorrectSelected,
}) => (
    <QuizCard
        key={currentIdx}
        choices={q.choices}
        correctAnswer={q.meaning}
        cardAspect="aspect-[9/6] sm:aspect-[16/9]"
        choiceGridClassName="quiz-choice-grid word-quiz-choice-grid"
        isFirst={currentIdx === 0}
        isLast={currentIdx === questionCount - 1}
        completing={completing}
        speakText={q.reading}
        xpAmount={5}
        suppressXp={!!contentPool}
        combo={combo}
        onCorrect={onCorrect}
        onWrong={onWrong}
        onNext={onNext}
        onPrev={onPrev}
        onCorrectSelected={onCorrectSelected}
        renderFront={() => <WordQuizFrontContent q={q} />}
        renderBack={({ isSpeaking, onSpeak }) => (
            <WordQuizAnswerDetail isSpeaking={isSpeaking} onSpeak={onSpeak} q={q} />
        )}
    />
);

export default WordQuizPlayCard;
