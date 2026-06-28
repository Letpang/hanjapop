import { useLang } from '../../../hooks/useLang.js';

const SaveProgressStats = ({ currentDay, streak }) => {
  const { t } = useLang();
  return (
    <div
      className="w-full max-w-xs mb-5 rounded-2xl px-5 py-4 flex justify-around"
      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(46,214,197,0.25)' }}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[1.3rem] font-medium text-teal-600">+200</span>
        <span className="text-base font-normal text-slate-400">{t('ext_3188')}</span>
      </div>
      <div className="w-px bg-slate-200" />
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[1.3rem] font-medium text-teal-600">{t('ext_3186', { n: streak?.count ?? 0 })}</span>
        <span className="text-base font-normal text-slate-400">{t('ext_1488')}</span>
      </div>
      <div className="w-px bg-slate-200" />
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[1.3rem] font-medium text-teal-600">{t('ext_3187', { n: currentDay })}</span>
        <span className="text-base font-normal text-slate-400">{t('ext_3189')}</span>
      </div>
    </div>
  );
};

export default SaveProgressStats;
