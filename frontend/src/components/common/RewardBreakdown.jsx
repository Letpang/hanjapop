import { useLang } from '../../hooks/useLang.js';

const RewardBreakdown = ({ reward, correctXp, clearXp = 30, detailText, missionXp = 0 }) => {
    const { t } = useLang();

    if (!reward) return null;

    const parts = [];
    if (correctXp > 0) parts.push(`${t('ext_275')} ${correctXp}XP`);
    if (clearXp > 0) parts.push(`${t('ext_276')} ${clearXp}XP`);
    const baseText = detailText !== '' ? (detailText || (parts.length > 0 ? parts.join(' + ') : '')) : '';
    const totalXp = reward.finalXp + missionXp;

    return (
        <div className="reward-card">
            <div className="reward-row">
                <span className="reward-label">{missionXp > 0 ? t('ext_1476') : t('ext_1477')}</span>
                <span className="reward-total-xp">+{totalXp} XP</span>
            </div>
            {baseText && (
                <div className="reward-detail-row">
                    <span className="reward-activity-detail text-left">{baseText}</span>
                </div>
            )}
            {missionXp > 0 && (
                <div className="reward-mission-badge">
                    {t('ext_2922', { missionXp })}
                </div>
            )}
        </div>
    );
};

export default RewardBreakdown;
