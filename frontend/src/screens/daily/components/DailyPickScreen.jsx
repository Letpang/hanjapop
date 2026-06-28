import { useMemo } from 'react';
import CtaButton from '../../../components/common/CtaButton.jsx';
import { pickDailyOption } from './dailyStartOptions.js';
import { useLang } from '../../../hooks/useLang.js';

const DailyPickScreen = ({ accent, onBack, onResult, options, salt, title }) => {
  const { t } = useLang();
  const option = useMemo(() => pickDailyOption(options, salt), [options, salt]);

  return (
    <div className="daily-mobile-screen daily-pick-screen fixed inset-0  flex flex-col items-center px-6">
      <button onClick={onBack} className="hp-nav-button absolute left-4 top-12 z-10 !text-slate-400">←</button>
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none" style={{ background: accent }} />
      <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-[#FF9B73] blur-[100px] opacity-10 pointer-events-none" />

      <div className="daily-pick-content w-full flex-1 min-h-0 flex flex-col items-center justify-center pt-24 pb-5">
        <p className="font-normal text-sm text-[#94A3B8] mb-3 tracking-wide">{title}</p>
        <h2 className="font-medium text-[#3C3C3C] dark:text-slate-100 mb-10 text-center">{t(option.label)}</h2>

        <div
          className="daily-pick-card flex flex-col items-center gap-4 p-10 rounded-[2.5rem] border-2"
          style={{ background: option.bg, borderColor: `${option.color}55`, boxShadow: `0 12px 32px ${option.color}33` }}
        >
          <img src={option.icon} className="w-28 h-28 object-contain" alt={t(option.label)} />
        </div>
      </div>

      <div className="daily-mobile-cta w-full max-w-xs shrink-0 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        <CtaButton theme={option.theme} onClick={() => onResult(option.id)}>
          <div className="daily-pick-cta-title font-medium text-white leading-tight drop-shadow-md flex items-center justify-center gap-2 py-0.5">
            <span>{t('ext_1373')}</span>
            <span className="text-[1.35rem] translate-y-[1px]">›</span>
          </div>
        </CtaButton>
      </div>
    </div>
  );
};

export default DailyPickScreen;