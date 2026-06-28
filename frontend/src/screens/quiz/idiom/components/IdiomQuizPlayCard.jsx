import QuizCard from '../../../../components/common/QuizCard.jsx';
import { getIdiomChoicePresentation } from '../idiomQuizUtils.js';
import IdiomQuestionBack from './IdiomQuestionBack.jsx';
import IdiomQuestionFront from './IdiomQuestionFront.jsx';

const IdiomQuizPlayCard = ({
  question,
  idx,
  total,
  completing,
  onCorrect,
  onWrong,
  onNext,
  onPrev,
  onCorrectSelected,
}) => {
  const { choiceClass, choiceGridClass, choiceGridStyle } = getIdiomChoicePresentation(question);

  const renderChoice = question.type === 'fill_blank'
    ? (choice, { isCorrect, isWrong }) => (
        <span className="flex items-baseline gap-1.5">
          <span className={isCorrect ? 'text-[#4F56D9]' : isWrong ? 'text-[#FF8D72]' : ''}>{choice}</span>
          <span className="text-xl font-normal text-[#AEB7C5]">{question.charReadingMap?.[choice]}</span>
        </span>
      )
    : question.type === 'idiom_from_meaning'
    ? (choice, { isCorrect, isWrong }) => (
        <span className="flex items-baseline gap-1.5">
          <span className={`hanja-char ${isCorrect ? 'text-[#4F56D9]' : isWrong ? 'text-[#FF8D72]' : ''}`}>{choice}</span>
          <span className="text-xl font-normal text-[#AEB7C5]">{question.idiomReadingMap?.[choice]}</span>
        </span>
      )
    : undefined;

  return (
    <QuizCard
      key={idx}
      choices={question.choices}
      correctAnswer={question.answer}
      cardLayout="content"
      choiceGridClassName={choiceGridClass}
      choiceGridStyle={choiceGridStyle}
      choiceClassName={choiceClass}
      isFirst={idx === 0}
      isLast={idx === total - 1}
      completing={completing}
      speakText={question.reading}
      xpAmount={5}
      onCorrect={onCorrect}
      onWrong={onWrong}
      onNext={onNext}
      onPrev={onPrev}
      onCorrectSelected={onCorrectSelected}
      renderChoice={renderChoice}
      renderFront={() => <IdiomQuestionFront question={question} />}
      renderBack={({ isSpeaking, onSpeak }) => (
        <IdiomQuestionBack question={question} isSpeaking={isSpeaking} onSpeak={onSpeak} />
      )}
    />
  );
};

export default IdiomQuizPlayCard;
