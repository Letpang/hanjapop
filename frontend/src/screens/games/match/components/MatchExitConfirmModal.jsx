import ExitConfirmModal from '../../../../components/common/ExitConfirmModal.jsx';
import { useLang } from '../../../../hooks/useLang.js';

export default function MatchExitConfirmModal({ dailyMapNode, onCancel, onConfirm, selectedCharacter }) {
    const { t } = useLang();
    return (
        <ExitConfirmModal
            selectedCharacter={selectedCharacter}
            title={dailyMapNode ? t('ext_1766') : t('ext_1924')}
            description={dailyMapNode ? t('ext_2812') : t('ext_2917')}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
}