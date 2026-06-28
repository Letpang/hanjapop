import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../utils/rankUtils.js';
import CtaButton from '../CtaButton.jsx';
import RewardBreakdown from '../RewardBreakdown.jsx';

const FullQuizResultOverlay = ({
  backLabel,
  clearTitle,
  clearXp,
  correctXp,
  defaultFailTitle,
  detailText,
  failTitle,
  hideRetry,
  isClear,
  missionXp,
  onBack,
  onRetry,
  retryLabel,
  reward,
  scoreNode,
  selectedCharacter,
  subtitle,
}) => (
  <div
    className={`quiz-result-overlay fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300 ${isClear ? 'quiz-result-overlay--clear' : 'quiz-result-overlay--fail'}`}
  >
    <div className="activity-result-card result-balanced-card">
      <div className="result-balanced-body px-6 flex flex-col items-center w-full relative">
        <div className="activity-result-glow" />
        <img
          src={getCharacterImage(selectedCharacter, isClear ? 'success' : 'failure')}
          alt={isClear ? 'clear' : 'fail'}
          className="activity-result-char img-shadow-lg"
          style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, isClear ? 'success' : 'failure')})` }}
        />
        <div className="result-text-area result-balanced-content-stack">
          <span className="result-subtitle">{subtitle}</span>
          <h1 className={`text-h2-res leading-snug result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
            {isClear ? clearTitle : (failTitle || defaultFailTitle)}
          </h1>
          {scoreNode && (
            <p className="body-muted break-keep">{scoreNode}</p>
          )}
        </div>
        <div className="result-balanced-lower-stack">
          <RewardBreakdown
            reward={reward}
            correctXp={correctXp}
            clearXp={clearXp}
            detailText={detailText}
            missionXp={missionXp}
          />
        </div>
        <div className="result-btn-area result-balanced-lower-stack">
          {!hideRetry && onRetry && (
            <CtaButton theme="coral" onClick={onRetry}>
              <span className="quiz-cta-text">{retryLabel}</span>
            </CtaButton>
          )}
          <button onClick={onBack} className="back-quiz-button">
            {backLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default FullQuizResultOverlay;
