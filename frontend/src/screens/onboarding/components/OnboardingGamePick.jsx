import { getCharacterScale, getCharacterTranslateY } from '../../../utils/rankUtils.js';
import { useLang } from '../../../hooks/useLang.js';

const OnboardingGamePick = ({ onPick, guide, charId }) => {
  const { t } = useLang();
  const charScale = getCharacterScale(charId || 'garae', 'rank5');
  const charTranslateY = getCharacterTranslateY(charId || 'garae', true);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-5 safe-top"
      style={{ background: 'linear-gradient(180deg, #f0faf8 0%, #F7FAF9 40%)' }}>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
        <div className="text-center mb-2">
          <div className="relative inline-flex flex-col items-center mb-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,199,174,0.15) 0%, transparent 68%)' }} />
            <div style={{ transform: `translateY(${charTranslateY}) scale(${charScale})` }}>
              <img src={guide} alt={t('ext_981')} className="h-48 w-48 object-contain drop-shadow-xl animate-float" />
            </div>
          </div>
          <h2 className="text-h2 font-medium text-[#334155] dark:text-slate-100 tracking-normal">{t('ext_1895')}</h2>
          <p className="mt-2 text-body font-normal text-[#7A8798] dark:text-slate-400">{t('ext_1782')}</p>
        </div>

        <button
          onClick={() => onPick('shoot')}
          className="glass-panel flex items-center gap-4 rounded-[2rem] p-5 text-left active:scale-95 transition-all duration-200 hover:-translate-y-1"
        >
          <div className="w-20 h-20 rounded-[1.2rem] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FFF3EE 0%, #FFE8DC 100%)' }}>
            <img src="/assets/images/icons/monster.webp" alt={t('ext_909')} className="w-16 h-16 object-contain" />
          </div>
          <div>
            <p className="text-body font-bold text-[#334155] dark:text-slate-200">{t('ext_1573')}</p>
            <p className="text-body font-normal text-[#7A8798] dark:text-slate-400 mt-1 break-keep leading-snug">{t('ext_2019')}<br/>{t('ext_1642')}</p>
          </div>
        </button>

        <button
          onClick={() => onPick('match')}
          className="glass-panel flex items-center gap-4 rounded-[2rem] p-5 text-left active:scale-95 transition-all duration-200 hover:-translate-y-1"
        >
          <div className="w-20 h-20 rounded-[1.2rem] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #E8FAF7 0%, #D4F5F0 100%)' }}>
            <img src="/assets/images/icons/matching.webp" alt={t('ext_910')} className="w-16 h-16 object-contain" />
          </div>
          <div>
            <p className="text-body font-bold text-[#334155] dark:text-slate-200">{t('ext_1574')}</p>
            <p className="text-body font-normal text-[#7A8798] dark:text-slate-400 mt-1 break-keep leading-snug">{t('ext_1829')}<br/>{t('ext_1597')}</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OnboardingGamePick;