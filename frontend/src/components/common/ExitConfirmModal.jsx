import { useLang } from '../../hooks/useLang.js';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../utils/rankUtils.js';
import { ResultPrimaryButton, ResultSecondaryButton, ResultModalActions } from './ResultModalShell.jsx';

const ExitConfirmModal = ({ 
    isOpen = true, 
    selectedCharacter, 
    title, 
    description, 
    onCancel, 
    onConfirm 
}) => {
    const { t } = useLang();

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 400 }}>
            <div className="exit-confirm-card">
                <img
                    src={getCharacterImage(selectedCharacter, 'keep_going')}
                    alt="exit confirm"
                    className="img-shadow-sm"
                    style={{ 
                        transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${getCharacterScale(selectedCharacter, 'keep_going')})` 
                    }}
                />
                <div className="exit-confirm-content">
                    <h2 className="exit-confirm-title">{title}</h2>
                    <p className="body-muted break-keep">{description}</p>
                </div>
                <ResultModalActions>
                    <ResultPrimaryButton onClick={onCancel}>
                        {t('ext_1501')}
                    </ResultPrimaryButton>
                    <ResultSecondaryButton onClick={onConfirm}>
                        {t('ext_1667')}
                    </ResultSecondaryButton>
                </ResultModalActions>
            </div>
        </div>
    );
};

export default ExitConfirmModal;
