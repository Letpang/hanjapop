const renderSentence = (sentence, hanja, underline) => {
  if (underline) {
    const idx = sentence.indexOf(underline);
    if (idx === -1) return <span>{sentence}</span>;
    return (
      <>
        {sentence.slice(0, idx)}
        <span className="font-normal underline decoration-2 underline-offset-2">{underline}</span>
        {sentence.slice(idx + underline.length)}
      </>
    );
  }

  if (hanja) {
    const parts = sentence.split(`(${hanja})`);
    return parts.reduce((acc, part, i) => {
      if (i < parts.length - 1) {
        return [...acc, part, <span key={i} className="hanja-highlight">{hanja}</span>];
      }
      return [...acc, part];
    }, []);
  }

  return sentence;
};

import { useLang } from '../../../../hooks/useLang.js';

const GradeTestQuestionCard = ({ question, useCompoundHanjaBox }) => {
  const { t } = useLang();
  const isCompound = useCompoundHanjaBox && question?.hanja && question.hanja.length > 1;

  return (
    <div className="grade-test-question-card">
      <p className="grade-test-prompt">{t(question.prompt, question.promptParams)}</p>

      {(question.type === 'sound_sentence' || question.type === 'underline') && (
        <p className="grade-test-example">
          {renderSentence(
            question.sentence,
            question.type === 'sound_sentence' ? question.hanja : null,
            question.underline,
          )}
        </p>
      )}

      {question.hanja && question.type !== 'sound_sentence' && (
        <div className={`grade-test-hanja-box ${isCompound ? 'grade-test-hanja-box--compound' : 'grade-test-hanja-box--single'}`}>
          <span className="grade-test-hanja-char">{question.hanja}</span>
        </div>
      )}
    </div>
  );
};

export default GradeTestQuestionCard;
