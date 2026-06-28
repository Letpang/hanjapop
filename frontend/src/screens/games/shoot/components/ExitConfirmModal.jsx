import ExitConfirmModalCommon from '../../../../components/common/ExitConfirmModal.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const ExitConfirmModal = ({ selectedCharacter, dailyMapNode, onCancel, onConfirm }) => {
    const { t } = useLang();
    return (
        <ExitConfirmModalCommon
            selectedCharacter={selectedCharacter}
            title={dailyMapNode ? t('ext_1766') : t('ext_1925')}
            description={dailyMapNode ? t('ext_2812') : t('ext_2856')}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
};

export default ExitConfirmModal;