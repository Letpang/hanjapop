import { useLang } from '../../../../hooks/useLang.js';

const FinalJourneyRewards = () => {
  const { t } = useLang();

  return (
    <section className="final-journey-rewards" aria-label={t('ext_1495')}>
      <div className="final-journey-badge" aria-hidden="true">
        <span className="final-journey-badge-crown">★</span>
        <strong>124</strong>
        <small>{t('ext_1063')}</small>
      </div>
      <div className="final-journey-reward-copy">
        <span>{t('ext_1664')}</span>
        <strong>{t('ext_1854')}</strong>
        <p>{t('ext_1619')} · {t('ext_2547')}</p>
      </div>
    </section>
  );
};

export default FinalJourneyRewards;