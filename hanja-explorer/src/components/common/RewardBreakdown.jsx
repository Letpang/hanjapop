const RewardBreakdown = ({ reward, correctXp, clearXp = 30, correctLabel = '정답', clearLabel = '완료', detailText, missionXp = 0 }) => {
    if (!reward) return null;

    const parts = [];
    if (correctXp > 0) parts.push(`${correctLabel} ${correctXp}XP`);
    if (clearXp > 0) parts.push(`${clearLabel} ${clearXp}XP`);
    const baseText = detailText !== '' ? (detailText || (parts.length > 0 ? parts.join(' + ') : '')) : '';
    const totalXp = reward.finalXp + missionXp;

    return (
        <div className="reward-card">
            <div className="reward-row">
                <span className="reward-label">{missionXp > 0 ? '보상 합계' : '활동 보상'}</span>
                <span className="reward-total-xp">+{totalXp} XP</span>
            </div>
            {baseText && (
                <div className="reward-detail-row">
                    <span className="reward-activity-label">활동 {reward.finalXp}XP</span>
                    <span className="reward-activity-detail">{baseText}</span>
                </div>
            )}
            {missionXp > 0 && (
                <div className="reward-mission-badge">
                    미션 보상: 첫 완료 +{missionXp} XP 포함
                </div>
            )}
        </div>
    );
};

export default RewardBreakdown;
