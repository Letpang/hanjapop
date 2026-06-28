import { useState } from 'react';
import { useLang } from '../../../../hooks/useLang.js';

const DetailSection = ({ title, count, tone = 'slate', children }) => {
  const [open, setOpen] = useState(false);
  const toneClasses = {
    teal: 'text-[#00A994] dark:text-teal-300 bg-[#E8FAF7] dark:bg-teal-950/40',
    coral: 'text-[#E8664F] dark:text-rose-300 bg-[#FFF1EE] dark:bg-rose-950/40',
    amber: 'text-[#B7791F] dark:text-amber-300 bg-[#FFF7D6] dark:bg-amber-950/40',
    slate: 'text-[#5D677A] dark:text-slate-300 bg-[#F4F6F8] dark:bg-slate-700',
  };

  const { t } = useLang();

  return (
    <section className="flex flex-col gap-2.5">
      <button className="flex items-center justify-between w-full active:opacity-70 transition-opacity" onClick={() => setOpen(v => !v)}>
        <h3 className="text-sm font-medium text-[#334155] dark:text-slate-200">{title}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-base font-normal ${toneClasses[tone]}`}>
            {count}{t('ext_231')}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: '#FF8D7E' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
      {open && children}
    </section>
  );
};

export default DetailSection;