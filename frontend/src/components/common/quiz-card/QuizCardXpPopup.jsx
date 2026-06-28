import { useLang } from '../../../hooks/useLang.js';

const QuizCardXpPopup = ({ combo, show, xpAmount, xpAnimKey }) => {
  const { t } = useLang();

  if (!show) return null;

  return (
    <div
      key={xpAnimKey}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
      style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '120px' }}
    >
      <div className="flex flex-col items-center gap-2">
        {combo > 1 && (
          <div
            className="px-4 py-1.5 rounded-full font-normal text-white text-base"
            style={{ backgroundColor: 'var(--color-primary-blue)', boxShadow: '0 4px 12px rgba(74,81,212,.45)' }}
          >
            {t('ext_2801', { combo })}
          </div>
        )}
        <div className="xp-popup-badge">⭐ +{xpAmount} XP</div>
      </div>
    </div>
  );
};

export default QuizCardXpPopup;
