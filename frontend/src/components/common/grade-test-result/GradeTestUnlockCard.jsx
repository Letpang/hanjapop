const GradeTestUnlockCard = ({ badgeImage, show, unlockText }) => {
  if (!show) return null;

  return (
    <div className="w-full mt-4 rounded-[1.75rem] bg-[#EFFFFB] border-2 border-[#8FEBDD] px-4 py-3.5 flex items-center justify-center gap-3 shadow-sm">
      {badgeImage && <img src={badgeImage} alt="" className="w-14 h-14 shrink-0 object-contain" />}
      <p className="text-[1.35rem] leading-snug font-normal text-[#007C6D] break-keep">{unlockText}</p>
    </div>
  );
};

export default GradeTestUnlockCard;
