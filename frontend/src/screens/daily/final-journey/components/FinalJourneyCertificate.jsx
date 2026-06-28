import { useLang } from '../../../../hooks/useLang.js';

const FinalJourneyCertificate = ({ userNickname, hanjaCount, completedDate }) => {
  const { t } = useLang();

  return (
    <section className="final-journey-certificate">
      <p>{t('ext_1862')}</p>
      <h2>{userNickname || t('ext_980')}</h2>
      <div className="final-journey-certificate-stats">
        <span><strong>124</strong>{t('ext_478')}</span>
        <span><strong>{hanjaCount}</strong>{t('ext_479')}</span>
        <span><strong>100%</strong>{t('ext_480')}</span>
      </div>
      <small>{completedDate} · HANJAPOP</small>
    </section>
  );
};

export default FinalJourneyCertificate;