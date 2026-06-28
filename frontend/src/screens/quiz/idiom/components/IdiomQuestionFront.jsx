import { useLang } from '../../../../hooks/useLang.js';

const IdiomQuestionFront = ({ question }) => {
  const { t } = useLang();
  return (
  <div className="grade-test-question-card">
    <span className="grade-test-type-label">{t(question.typeLabel)}</span>
    <p className="grade-test-prompt">{t(question.prompt)}</p>

    {question.type === 'fill_blank' && (
      <>
        <div className="grade-test-hanja-box grade-test-hanja-box--compound">
          <span className="grade-test-hanja-char hanja-char">{question.displayHanja}</span>
        </div>
        {question.displayReading && (
          <p className="text-center text-xl font-normal text-[#AEB7C5] mt-1">{question.displayReading}</p>
        )}
      </>
    )}

    {(question.type === 'reading' || question.type === 'meaning_from_idiom') && (
      <>
        <div className="grade-test-hanja-box grade-test-hanja-box--compound">
          <span className="grade-test-hanja-char hanja-char">{question.hanja}</span>
        </div>
        {question.type === 'meaning_from_idiom' && question.reading && (
          <p className="text-center text-xl font-normal text-[#AEB7C5] mt-1">{question.reading}</p>
        )}
      </>
    )}

    {question.type === 'idiom_from_meaning' && (
      <p className="grade-exam-guide-text text-center">{question.displayMeaning}</p>
    )}

    {question.origin && (
      <p className="mt-2 break-keep border-t border-[#E9EDF2] px-4 pt-3 text-center text-base leading-relaxed text-[#8F99AD]">
        {question.origin}
      </p>
    )}
  </div>
  );
};

export default IdiomQuestionFront;
