const RewardBreakdown = ({ reward, correctXp, clearXp = 30, correctLabel = '정답', clearLabel = '완료', detailText, missionXp = 0 }) => {
    if (!reward) return null;

    const parts = [];
    if (correctXp > 0) parts.push(`${correctLabel} ${correctXp}XP`);
    if (clearXp > 0) parts.push(`${clearLabel} ${clearXp}XP`);
    const baseText = detailText !== '' ? (detailText || (parts.length > 0 ? parts.join(' + ') : '')) : '';
    const totalXp = reward.finalXp + missionXp;

    return (
        <div className="w-full rounded-2xl bg-white/80 border-2 border-[#E9EDF2] px-4 py-3 shadow-inner">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-[#94A3B8]">{missionXp > 0 ? '보상 합계' : '활동 보상'}</span>
                <span className="text-xl font-black text-[#FF9B73]">+{totalXp} XP</span>
            </div>
            {baseText && (
            <div className="mt-1.5 flex items-center justify-between gap-2 text-sm font-bold text-[#8F99AD] leading-snug">
                <span>활동 {reward.finalXp}XP</span>
                <span className="text-right break-keep">{baseText}</span>
            </div>
            )}
            {missionXp > 0 && (
                <div className="mt-2 rounded-xl bg-[#EFFFFB] px-3 py-2 text-xs font-black text-[#00A891] break-keep">
                    미션 보상: 첫 완료 +{missionXp} XP 포함
                </div>
            )}
        </div>
    );
};

export default RewardBreakdown;
