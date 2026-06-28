import QuizProgressBar from '../../../../components/QuizProgressBar.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const IdiomQuizHeader = ({
  idx,
  total,
  currentAnswered,
  completing,
  characterAvatar,
  selectedCharacter,
  onRequestExit,
}) => {
  const { lang, t } = useLang();
  const isKorean = lang === 'ko';

  return (
    <div className="idiom-quiz-header w-full shrink-0">
      <div className="quiz-header-card quiz-header-card--sm">
        <button onClick={onRequestExit} className="hp-nav-button">
          <span>✕</span>
        </button>
        <div className="quiz-header-title-area">
          <h2 className="quiz-screen-title">{isKorean ? t('ext_1391') : t('ext_1683')}</h2>
          {isKorean && <p className="screen-subtitle">{t('ext_1683')}</p>}
        </div>
        <div className="quiz-header-right">
          <span className="quiz-counter-text">{idx + 1}/{total}</span>
        </div>
      </div>
      <QuizProgressBar
        current={idx}
        total={total}
        answered={currentAnswered}
        completing={completing}
        avatar={characterAvatar}
        charType={selectedCharacter}
      />
    </div>
  );
};

export default IdiomQuizHeader;
