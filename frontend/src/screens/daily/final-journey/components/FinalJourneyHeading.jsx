import { useLang } from '../../../../hooks/useLang.js';

const FinalJourneyHeading = ({ userNickname }) => {
  const { t } = useLang();

  return (
    <section className="final-journey-heading">
      <span>{t('ext_2178')}</span>
      <h1>{t('ext_1619')}</h1>
      <p>{userNickname || t('ext_980')}{t('ext_3183')}</p>
    </section>
  );
};

export default FinalJourneyHeading;