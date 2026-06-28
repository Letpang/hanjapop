import { useLang } from '../../../../hooks/useLang.js';

const FinalJourneyActions = ({
  claiming,
  shareStatus,
  onShare,
  onClaim,
}) => {
  const { t } = useLang();

  return (
    <div className="final-journey-actions">
      <button className="final-journey-action-button final-journey-share" onClick={onShare}>
        <span>{t('ext_1791')}</span>
        <small>{t('ext_2177')}</small>
      </button>
      {shareStatus && <p className="final-journey-share-status" aria-live="polite">{shareStatus}</p>}
      <button
        className="final-journey-action-button final-journey-cta"
        disabled={claiming}
        onClick={onClaim}
      >
        <span>{claiming ? t('ext_1763') : t('ext_1921')}</span>
        <small>{t('ext_2354')}</small>
      </button>
    </div>
  );
};

export default FinalJourneyActions;