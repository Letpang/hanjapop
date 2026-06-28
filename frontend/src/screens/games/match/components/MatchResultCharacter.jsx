import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';

const MatchResultCharacter = ({ isClear, selectedCharacter }) => (
    <img
        src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
        alt=""
        className="activity-result-char img-shadow-lg"
        style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, isClear ? 'success' : 'failure')})` }}
        onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = isClear
                ? '/assets/images/icons/success_new.webp'
                : '/assets/images/icons/timeout_new.webp';
        }}
    />
);

export default MatchResultCharacter;
