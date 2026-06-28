import CharacterToast from '../../../components/CharacterToast.jsx';
import { getLevel } from '../../../utils/rankUtils.js';
import SaveProgressModal from '../SaveProgressModal.jsx';

const CharacterProgressOverlays = ({
  charToast,
  currentDay,
  dismissToast,
  isInRankSoonZone,
  nextRankAvatar,
  platform,
  selectedCharacter,
  setCharToast,
  setCurrentScreen,
  setShowSaveModal,
  showSaveModal,
  signInWithApple,
  signInWithGoogle,
  signInWithKakao,
  streak,
  user,
  userXp,
}) => (
  <>
    {charToast && selectedCharacter && (
      <CharacterToast
        type={charToast}
        selectedCharacter={selectedCharacter}
        userXp={userXp}
        nextRankAvatar={nextRankAvatar}
        nearRankUp={isInRankSoonZone(getLevel(userXp))}
        onDismiss={dismissToast}
        onAction={charToast === 'review_reminder' ? () => {
          setCharToast(null);
          setCurrentScreen('wrongVocabulary');
        } : undefined}
      />
    )}

    {showSaveModal && !user && selectedCharacter && (
      <SaveProgressModal
        currentDay={currentDay}
        onApple={async () => {
          const result = await signInWithApple();
          if (result.success) {
            setShowSaveModal(false);
            setCurrentScreen('main');
            setTimeout(() => setCharToast('rank_soon'), 1200);
          }
        }}
        onGoogle={async () => {
          const result = await signInWithGoogle();
          if (result.success) {
            setShowSaveModal(false);
            setCurrentScreen('main');
            setTimeout(() => setCharToast('rank_soon'), 1200);
          }
        }}
        onKakao={async () => {
          const result = await signInWithKakao();
          if (result.success) {
            setShowSaveModal(false);
            setCurrentScreen('main');
            setTimeout(() => setCharToast('rank_soon'), 1200);
          }
        }}
        onSkip={() => {
          setShowSaveModal(false);
          setCurrentScreen('main');
          setTimeout(() => setCharToast('rank_soon'), 800);
        }}
        platform={platform}
        selectedCharacter={selectedCharacter}
        streak={streak}
      />
    )}
  </>
);

export default CharacterProgressOverlays;
