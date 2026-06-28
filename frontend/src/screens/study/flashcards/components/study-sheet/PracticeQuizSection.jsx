import CtaButton from '../../../../../components/common/CtaButton.jsx';
import QuizItem from '../QuizItem.jsx';
import CollapsibleSection from './CollapsibleSection.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const PracticeQuizSection = ({
  questions,
  answers,
  isOpen,
  onToggle,
  onAnswer,
  completionLabel,
  onComplete,
}) => {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title={t('ext_1537')} isOpen={isOpen} onToggle={onToggle}>
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="minimal-card-studio border border-[#E9EDF2] bg-white p-5 shadow-xl !rounded-[3rem] dark:bg-slate-800"
          >
            <QuizItem q={question} idx={index} onAnswer={onAnswer} />
          </div>
        ))}
      </CollapsibleSection>

      <div className="mt-2 flex w-full">
        <CtaButton
          theme="coral"
          onClick={onComplete}
          disabled={questions.length > 0 && Object.keys(answers).length < questions.length}
        >
          <span className="quiz-cta-text">{completionLabel}</span>
        </CtaButton>
      </div>
    </div>
  );
};

export default PracticeQuizSection;