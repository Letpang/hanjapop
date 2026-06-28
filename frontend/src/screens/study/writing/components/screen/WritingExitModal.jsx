import ExitConfirmModal from '../../../../../components/common/ExitConfirmModal.jsx';
import { useLang } from '../../../../../hooks/useLang.js';

const WritingExitModal = ({ isOpen, selectedCharacter, onKeepGoing, onExit }) => {
  const { t } = useLang();
  return (
    <ExitConfirmModal
      isOpen={isOpen}
      selectedCharacter={selectedCharacter}
      title={t('ext_2025')}
      description={t('ext_3027')}
      onCancel={onKeepGoing}
      onConfirm={onExit}
    />
  );
};

export default WritingExitModal;