const getChoiceStateClass = ({ revealed, selected, choice, answer }) => {
  const isSelected = selected === choice;
  const isAnswer = choice === answer;

  if (revealed) {
    if (isAnswer) return 'quiz-choice-btn--correct';
    if (isSelected) return 'quiz-choice-btn--wrong';
    return 'quiz-choice-btn--dimmed';
  }

  if (selected !== null) {
    return isSelected ? 'quiz-choice-btn--wrong' : 'quiz-choice-btn--dimmed';
  }

  return '';
};

const getChoiceSizeClass = (type, largeChoiceTypes, mediumChoiceTypes) => {
  if (largeChoiceTypes.includes(type)) return 'quiz-choice-btn--large';
  if (mediumChoiceTypes.includes(type)) return 'quiz-choice-btn--hanja';
  return '';
};

const GradeTestChoiceGrid = ({
  choices,
  answer,
  largeChoiceTypes,
  mediumChoiceTypes,
  onSelect,
  revealed,
  selected,
  type,
  unit = '',
}) => {
  const choiceSizeClass = getChoiceSizeClass(type, largeChoiceTypes, mediumChoiceTypes);

  return (
    <div className="grade-test-choice-grid">
      {choices.map((choice) => (
        <button
          key={choice}
          onClick={() => onSelect(choice)}
          className={`quiz-choice-btn ${choiceSizeClass} ${getChoiceStateClass({ revealed, selected, choice, answer })}`}
        >
          <span className="break-keep">{choice}{unit}</span>
        </button>
      ))}
    </div>
  );
};

export default GradeTestChoiceGrid;
