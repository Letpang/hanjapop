import CtaButton from '../../../../components/common/CtaButton.jsx';
import RewardBreakdown from '../../../../components/common/RewardBreakdown.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const FlashcardAllDoneModal = ({
  clearMessage,
  onBack,
  onClose,
  reward,
  selectedCharacter,
  totalQuizXp,
}) => {
  const { t } = useLang();
  const correctAnswerCount = Math.round((totalQuizXp || 0) / 5);

  return (
    <div className="mobile-center-overlay fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300 overlay-success">
      <div className="mobile-modal-card w-full max-w-sm flex flex-col items-center rounded-[2.5rem] bg-[var(--color-bg-surface)] border-4 border-[var(--color-border-subtle)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative animate-in zoom-in-95 duration-200">
        <div className="pt-8 pb-8 px-6 flex flex-col items-center gap-5 w-full">
          <img
            src={getCharacterImage(selectedCharacter, 'success')}
            alt="clear"
            className="w-44 h-44 object-contain drop-shadow-xl"
            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
          />
          <div className="text-center flex flex-col gap-1">
            <span className="result-subtitle">{t('ext_2023')}</span>
            <h1 className="text-h2-res leading-tight result-title result-title--clear">
              {t(clearMessage)}
            </h1>
          </div>
          <RewardBreakdown
            reward={reward}
            correctXp={totalQuizXp}
            clearXp={50}
            correctLabel={t('ext_1057')}
            detailText={t('ext_2905', { correctAnswerCount })}
            missionXp={50}
          />
          <div className="w-full flex flex-col gap-3">
            <CtaButton theme="coral" onClick={() => { onClose(); onBack(); }}>
              <span className="quiz-cta-text">{t('ext_1068')}</span>
            </CtaButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardAllDoneModal;
