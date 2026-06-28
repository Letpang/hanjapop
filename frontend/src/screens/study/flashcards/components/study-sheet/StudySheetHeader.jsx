import QuizProgressBar from '../../../../../components/QuizProgressBar.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const StudySheetHeader = ({
  onBack,
  answerCount,
  questionCount,
  characterAvatar,
  selectedCharacter,
}) => {
  const { t } = useLang();

  return (
    <div
      className="relative z-50 w-full shrink-0 px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '4px' }}
    >
      <div className="minimal-card-studio flex min-h-[72px] w-full items-center justify-between border-[#E9EDF2] bg-white p-4 px-6 shadow-xl !rounded-[3rem] dark:bg-slate-800">
        <button onClick={onBack} className="hp-nav-button">
          ←
        </button>
        <div className="quiz-header-title-area">
          <h2 className="quiz-screen-title">{t('ext_1596')}</h2>
          <p className="screen-subtitle">{t('ext_2088')}</p>
        </div>
        <div className="w-11" />
      </div>
      <QuizProgressBar
        current={answerCount}
        total={questionCount}
        completing={answerCount >= questionCount && questionCount > 0}
        avatar={characterAvatar}
        charType={selectedCharacter}
      />
    </div>
  );
};

export default StudySheetHeader;
