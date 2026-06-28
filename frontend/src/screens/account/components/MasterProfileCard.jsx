import { useLang } from '../../../hooks/useLang.js';

const MasterProfileCard = ({ finalJourney }) => {
  const { t } = useLang();

  if (!finalJourney) return null;

  const finalJourneyDate = finalJourney.completedAt
    ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(finalJourney.completedAt))
    : '';

  return (
    <section className="master-profile-card" aria-label={t('ext_1810')}>
      <div className="master-profile-badge" aria-hidden="true">
        <span>★</span>
        <strong>124</strong>
        <small>{t('ext_1063')}</small>
      </div>
      <div className="master-profile-copy">
        <span>{t('ext_1619')}</span>
        <h3>{t('ext_1619')}</h3>
        <p>{finalJourney.stages || 124}{t('ext_478')} · {finalJourney.hanjaCount || 369}{t('ext_479')} {t('ext_480')}</p>
        <small>{t('ext_2352', { finalJourneyDate })}</small>
      </div>
      <div className="master-profile-seal">完</div>
    </section>
  );
};

export default MasterProfileCard;
