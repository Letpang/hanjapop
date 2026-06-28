import { useState } from 'react';
import { pickClearMessage } from '../../../../constants/messages.js';
import RewardBreakdown from '../../../../components/common/RewardBreakdown.jsx';
import CtaButton from '../../../../components/common/CtaButton.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import { WRITING_CLEAR_XP, WRITING_XP_PER_CHAR } from '../writingConstants.js';
import { useLang } from '../../../../hooks/useLang.js';

const WritingResultScreen = ({ correct, total, onRetry, onBack, selectedCharacter, getRewardPreview, missionXp = 0 }) => {
  const { t } = useLang();
  const pct = Math.round((correct / total) * 100);
  const isClear = pct >= 70;
  const [clearMsg] = useState(() => pickClearMessage());
  const writingXp = correct * WRITING_XP_PER_CHAR;
  const clearXp = isClear ? WRITING_CLEAR_XP : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto backdrop-blur-lg animate-in fade-in duration-300"
      style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'rgba(255,107,107,0.18)' }}
    >
      <div className="activity-result-card result-balanced-card">
        <div className="result-balanced-body px-6 flex flex-col items-center w-full relative">
          <div className="activity-result-glow" />

          <img
            src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
            alt={isClear ? 'clear' : 'fail'}
            className="activity-result-char img-shadow-lg"
            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, isClear ? 'success' : 'failure')})` }}
          />
          <div className="result-text-area -mt-5 result-balanced-content-stack">
            <span className="result-subtitle">
              {isClear ? t('ext_1788') : t('ext_1898')}
            </span>
            <h1 className={`text-h2-res leading-snug result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
              {isClear ? t(clearMsg) : <> {t('ext_1475')}<br />{t('ext_1555')}</>}
            </h1>
          </div>
          <div className="result-balanced-lower-stack">
            <RewardBreakdown
              reward={getRewardPreview?.(writingXp + clearXp)}
              correctXp={writingXp}
              clearXp={clearXp}
              correctLabel={t('ext_919')}
              detailText={`${correct}${t('ext_350')} x ${WRITING_XP_PER_CHAR}XP${clearXp > 0 ? ` + ${t('ext_276')} ${clearXp}XP` : ''}`}
              missionXp={missionXp}
            />
          </div>
          <div className="result-btn-area result-balanced-lower-stack">
            <CtaButton theme="indigo" onClick={onRetry}>
              <span className="quiz-cta-text">{t('ext_1610')}</span>
            </CtaButton>
            <button
              onClick={onBack}
              className="back-quiz-button"
            >
              {t('ext_1068')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingResultScreen;