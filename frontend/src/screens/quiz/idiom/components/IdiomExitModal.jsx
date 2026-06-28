import ExitConfirmModal from '../../../../components/common/ExitConfirmModal.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const IdiomExitModal = ({ isOpen, selectedCharacter, onKeepGoing, onBack }) => {
  const { t } = useLang();
  return (
    <ExitConfirmModal
      isOpen={isOpen}
      selectedCharacter={selectedCharacter}
      title={t('ext_1957')}
      description={t('ext_2904')}
      onCancel={onKeepGoing}
      onConfirm={onBack}
    />
  );
};

export default IdiomExitModal;