import { useLang } from '../../../hooks/useLang.js';

const DetailLinkRow = ({ accentClass, icon, iconAlt, onClick, subtitle, title }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-[1.35rem] px-3 py-3 text-left transition-all active:scale-[0.99] active:bg-slate-50 dark:active:bg-slate-700/60"
  >
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentClass}`}>
      <img src={icon} alt={iconAlt} className="h-7 w-7 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]" />
    </div>
    <div className="min-w-0 flex-1">
      <span className="block truncate text-lg font-normal leading-tight text-[#334155] dark:text-slate-100">{title}</span>
      <span className="mt-0.5 block truncate text-base font-normal leading-tight text-[#8D9CAE] dark:text-slate-400">{subtitle}</span>
    </div>
    <span className="shrink-0 text-2xl leading-none text-[#AEB7C5]">›</span>
  </button>
);

const DetailLinksPanel = ({ onNavigate }) => {
  const { t } = useLang();

  return (
    <div className="w-full rounded-[2rem] border shadow-[0_8px_24px_rgba(0,0,0,0.045)] bg-white border-[#E9EDF2] dark:bg-slate-800 dark:border-slate-700">
      <div className="px-5 pt-4 pb-3 border-b rounded-t-[2rem] border-[#EEF2F6] bg-white dark:border-slate-700 dark:bg-slate-800">
        <h3 className="font-medium text-base tracking-normal text-[#3C3C3C] dark:text-slate-100">{t('ext_1565')}</h3>
      </div>
      <div className="flex flex-col divide-y divide-[#EEF2F6] p-2 dark:divide-slate-700">
        <DetailLinkRow
          accentClass="bg-[#F5F3FF] dark:bg-purple-950/30"
          icon="/assets/images/icons/icon_calendar.webp"
          iconAlt={t('ext_468')}
          onClick={() => onNavigate('calendar')}
          title={t('ext_700')}
          subtitle={t('ext_2452')}
        />
        <DetailLinkRow
          accentClass="bg-[#FFFBEB] dark:bg-amber-950/30"
          icon="/assets/images/icons/icon_vocab.webp"
          iconAlt={t('ext_971')}
          onClick={() => onNavigate('vocabulary')}
          title={t('ext_971')}
          subtitle={t('ext_1540')}
        />
      </div>
    </div>
  );
};

export default DetailLinksPanel;
