import ExitConfirmModal from '../../../../components/common/ExitConfirmModal.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const FlashcardExitModal = ({ onCancel, onConfirm, selectedCharacter }) => {
  const { t } = useLang();
  return (
    <ExitConfirmModal
      selectedCharacter={selectedCharacter}
      title={t('ext_2514')}
      description={t('ext_3021')}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
};

export default FlashcardExitModal;