const RewardBreakdown = ({ reward, correctXp, clearXp = 30, correctLabel = '정답', clearLabel = '완료' }) => {
    if (!reward) return null;

    const parts = [];
    if (correctXp > 0) parts.push(`${correctLabel} 보상 ${correctXp}`);
    if (clearXp > 0) parts.push(`${clearLabel} 보너스 ${clearXp}`);
    const baseText = parts.length > 0 ? parts.join(' + ') : `기본 보상 ${reward.baseXp}`;

    return (
        <div className="w-full rounded-2xl bg-white/80 border-2 border-[#E9EDF2] px-4 py-3 shadow-inner">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-[#94A3B8]">획득 XP</span>
                <span className="text-xl font-black text-[#FF9B73]">+{reward.finalXp} XP</span>
            </div>
            <div className="mt-1.5 text-[11px] font-bold text-[#8F99AD] leading-snug break-keep">
                {baseText}
                {reward.multiplier > 1 && (
                    <span className="text-[#FF9B73]"> · {reward.multiplierText} 적용</span>
                )}
            </div>
        </div>
    );
};

export default RewardBreakdown;
