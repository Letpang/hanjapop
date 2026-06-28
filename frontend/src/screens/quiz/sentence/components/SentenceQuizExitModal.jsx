import ExitConfirmModal from '../../../../components/common/ExitConfirmModal.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const SentenceQuizExitModal = ({ dailyMapNode, selectedCharacter, onCancel, onConfirm }) => {
    const { t } = useLang();
    return (
        <ExitConfirmModal
            selectedCharacter={selectedCharacter}
            title={dailyMapNode ? t('ext_1766') : t('ext_1957')}
            description={dailyMapNode ? t('ext_2798') : t('ext_2904')}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
};

export default SentenceQuizExitModal;