import { useLang } from '../../../../hooks/useLang.js';

const DailyHanjaReview = ({ todayHanja }) => {
  const { t } = useLang();

  return (
    <div className="w-full flex flex-col gap-1.5">
      <p className="text-base font-medium text-slate-500 text-center">{t('ext_1704')}</p>
      <div className="flex gap-2 w-full">
        {todayHanja.filter((hanja) => hanja.id).map((hanja, index) => (
          <div
            key={index}
            className="hanja-review-card flex-1 !rounded-2xl flex flex-col items-center justify-center py-3 px-1.5 gap-1 border border-[#D8E2ED] !bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <span className="hanja-char text-[2.25rem] font-normal text-slate-700 leading-none">{hanja.hanja}</span>
            <span className="hanja-label text-[16px] font-normal text-[#7D8798] text-center break-keep leading-tight">
              {hanja.meaning} {hanja.sound}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyHanjaReview;
