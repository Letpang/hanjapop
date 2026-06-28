import { useLang } from '../../../hooks/useLang.js';

const GradeTestScoreCard = ({ correct, passCount, passed, percent, total }) => {
  const { t } = useLang();

  return (
    <div className="w-full mt-5 rounded-[1.75rem] border-4 border-[#E9EDF2] bg-white px-5 py-4 shadow-inner">
      <div className="flex items-end justify-center gap-2">
        <span className={`text-[3rem] leading-none font-normal tracking-normal ${passed ? 'text-[#00A891]' : 'text-[#FF6B6B]'}`}>{correct}</span>
        <span className="text-[2.35rem] leading-none font-normal text-[#334155]">/</span>
        <span className="text-[3rem] leading-none font-normal tracking-normal text-[#334155]">{total}</span>
      </div>
      <p className="text-body-sm font-normal text-[#AEB7C5] mt-2">{t('ext_2425', { passCount })}</p>
      <div className="w-full h-3.5 bg-[#EDF2F7] rounded-full mt-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${passed ? 'bg-gradient-to-r from-[#2DD4BF] to-[#7C83FF]' : 'bg-gradient-to-r from-[#FFB5A8] to-[#FF6B6B]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default GradeTestScoreCard;
