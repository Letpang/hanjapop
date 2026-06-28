import { getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import { useLang } from '../../../../hooks/useLang.js';

const FinalJourneyHero = ({ characterImage, selectedCharacter }) => {
  const { t } = useLang();

  return (
    <div className="final-journey-character-wrap">
      <div className="final-journey-halo" />
      <img
        src={characterImage}
        alt={t('ext_1863')}
        className="final-journey-character"
        style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
      />
      <div className="final-journey-crown" aria-hidden="true">♛</div>
    </div>
  );
};

export default FinalJourneyHero;