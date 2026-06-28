import DailyInviteShareCard from './DailyInviteShareCard.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const DailyResultShareCapture = ({ captureRef, selectedCharacter, userNickname }) => {
  const { t } = useLang();

  return (
    <div
      ref={captureRef}
      aria-hidden="true"
      className="fixed pointer-events-none"
      style={{ left: '-10000px', top: 0, width: 800, height: 1000 }}
    >
      <DailyInviteShareCard
        selectedCharacter={selectedCharacter}
        nickname={userNickname || t('ext_980')}
      />
    </div>
  );
};

export default DailyResultShareCapture;