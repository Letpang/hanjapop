import CtaButton from '../../../../../components/common/CtaButton.jsx';
import RewardBreakdown from '../../../../../components/common/RewardBreakdown.jsx';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../../../utils/rankUtils.js';
import { useLang } from '../../../../../hooks/useLang.js';

const StudyCompleteModal = ({
  isOpen,
  onClose,
  selectedCharacter,
  getRewardPreview,
  correctAnswerCount,
  isAlreadyCompleted,
}) => {
  const { t } = useLang();

  if (!isOpen) return null;

  const correctXp = correctAnswerCount * 5;

  return (
    <div className="mobile-center-overlay fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="modal-backdrop" onClick={onClose} />

      <div className="mobile-modal-card minimal-card-studio relative w-full max-w-md border-4 border-white bg-white shadow-2xl !rounded-[3.5rem] animate-in zoom-in slide-in-from-bottom-8 duration-500 dark:border-slate-700 dark:bg-slate-800">
        <div className="relative flex w-full flex-col items-center gap-2 px-6 pb-8 pt-4">
          <div className="activity-result-glow" />
          <img
            src={getCharacterImage(selectedCharacter, 'success')}
            alt="celebration"
            className="activity-result-char img-shadow-lg"
            style={{
              transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})`,
            }}
          />

          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-h1 break-keep font-medium tracking-normaler text-[#3C3C3C] dark:text-slate-100">
              {t('ext_2605')}
            </h1>

            <RewardBreakdown
              reward={getRewardPreview?.(correctXp + 50)}
              correctXp={correctXp}
              clearXp={50}
              correctLabel={t('ext_1057')}
              detailText={t('ext_2787', { correctAnswerCount })}
              missionXp={isAlreadyCompleted ? 0 : 50}
            />
          </div>

          <div className="mt-4 flex w-full flex-col gap-3">
            <CtaButton theme="coral" onClick={onClose}>
              <span className="quiz-cta-text">{t('ext_1068')}</span>
            </CtaButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCompleteModal;
