import QuizProgressBar from '../../../../components/QuizProgressBar.jsx';
import GradeTestChoiceGrid from './GradeTestChoiceGrid.jsx';
import GradeTestQuestionCard from './GradeTestQuestionCard.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const GradeTestQuizView = ({
  characterAvatar,
  largeChoiceTypes,
  mediumChoiceTypes,
  onBack,
  onSelect,
  qIndex,
  question,
  questionsLength,
  revealed,
  selected,
  selectedCharacter,
  title,
  useCompoundHanjaBox,
}) => {
  const { t } = useLang();
  const unit = question.strokeUnit ? t(question.strokeUnit) : '';
  const answerDisplay = unit ? `${question.answer}${unit}` : question.answer;

  return (
    <div className="quiz-screen">
      <div className="quiz-header-wrap">
        <div className="quiz-header-card quiz-header-card--sm">
          <button onClick={onBack} className="hp-nav-button">
            <span>←</span>
          </button>
          <div className="quiz-header-title-area">
            <div className="grade-test-header-title">
              <span className="quiz-screen-title">{title}</span>
            </div>
          </div>
          <div className="quiz-header-right">
            <span className="quiz-counter-text">{qIndex + 1}/{questionsLength}</span>
          </div>
        </div>
        <QuizProgressBar
          current={qIndex}
          total={questionsLength}
          fillColor="#6D6FF2"
          avatar={characterAvatar}
          charType={selectedCharacter}
        />
      </div>

      <div className="quiz-content-area">
        <div className="quiz-content-inner">
          <GradeTestQuestionCard
            question={question}
            useCompoundHanjaBox={useCompoundHanjaBox}
          />

          <GradeTestChoiceGrid
            answer={question.answer}
            choices={question.choices}
            largeChoiceTypes={largeChoiceTypes}
            mediumChoiceTypes={mediumChoiceTypes}
            onSelect={onSelect}
            revealed={revealed}
            selected={selected}
            type={question.type}
            unit={unit}
          />

          {revealed && (
            <div className={`quiz-feedback ${selected === question.answer ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`}>
              {selected === question.answer ? t('ext_994') : t('ext_2412', { answer: answerDisplay })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeTestQuizView;
