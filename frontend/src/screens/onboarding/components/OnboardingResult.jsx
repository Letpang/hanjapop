import { getCharacterScale, getCharacterTranslateY } from '../../../utils/rankUtils.js';
import { GRADE_STEPS, PROFILE, SKILL_MAX, TOTAL } from '../onboardingData.js';
import { useLang } from '../../../hooks/useLang.js';

const OnboardingResult = ({ score, finalLevel, skillStats, onComplete, guide, charId }) => {
  const { t } = useLang();
  const profile = PROFILE[finalLevel];
  const gameBonus = 30;
  const totalXp = profile.xp + gameBonus;
  const currentGradeIndex = Math.max(0, GRADE_STEPS.indexOf(profile.grade));
  const charScale = getCharacterScale(charId || 'garae', 'rank5');
  const charTranslateY = getCharacterTranslateY(charId || 'garae', true);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-y-auto  px-5 py-6 safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 safe-bottom">
        <div className="glass-panel rounded-[2.4rem] overflow-hidden text-center"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #e8faf7 0%, rgba(255,255,255,0.55) 60%)' }}>
          <div className="pt-6 pb-2 flex flex-col items-center">
            <div style={{ transform: `translateY(${charTranslateY}) scale(${charScale})` }}>
              <img src={guide} alt={t('ext_981')} className="h-40 w-40 object-contain drop-shadow-2xl animate-float" />
            </div>
          </div>
          <div className="px-6 pb-7">
            <p className="text-base font-normal tracking-[0.12em] text-[#00A994]">DIAGNOSIS COMPLETE</p>
            <h1 className="mt-1 text-h2 font-medium leading-tight tracking-normal text-[#334155] dark:text-slate-200 break-keep">
              <span className="text-[#00C7AE]">{profile.grade}</span> {t(profile.title)}
            </h1>
            <p className="mt-2 text-body font-normal leading-relaxed text-[#7A8798] dark:text-slate-400 break-keep">{t(profile.message)}</p>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] px-5 pt-4 pb-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-body font-medium text-[#334155] dark:text-slate-200">{t('ext_1724')}</span>
            <span className="rounded-full bg-[#E8FAF7] px-3 py-1 text-base font-normal text-[#00A994]">{t('ext_2286', { score, TOTAL })}</span>
          </div>
          <div className="relative flex items-start justify-between">
            <div className="absolute top-[9px] left-0 right-0 h-[3px] bg-[#E5ECF3] dark:bg-slate-700 mx-2" />
            <div className="absolute top-[9px] left-0 h-[3px] bg-[#00C7AE]"
              style={{ width: `${(currentGradeIndex / (GRADE_STEPS.length - 1)) * 100}%`, marginLeft: '8px' }} />
            {GRADE_STEPS.map((grade, idx) => {
              const done = idx < currentGradeIndex;
              const current = idx === currentGradeIndex;
              return (
                <div key={grade} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full border-2 border-[var(--color-border-subtle)] flex items-center justify-center shadow ${
                    done ? 'bg-[#00C7AE]' : current ? 'bg-[#00C7AE] ring-4 ring-[#00C7AE]/20' : 'bg-[#E5ECF3] dark:bg-slate-700'
                  }`}>
                    {done && <span className="text-white text-base">✓</span>}
                  </div>
                  <span className={`text-base font-normal ${current ? 'text-[#00A994] font-medium' : 'text-[#AEB7C5]'}`}>{grade}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            [t('ext_1533'), skillStats.word, SKILL_MAX.word],
            [t('ext_1534'), skillStats.context, SKILL_MAX.context],
            [t('ext_1391'), skillStats.idiom, SKILL_MAX.idiom],
          ].map(([label, value, max]) => (
            <div key={label} className="glass-panel rounded-[1.35rem] p-3 text-center">
              <p className="body-muted">{label}</p>
              <p className="mt-1">
                <span className="text-h3 font-medium text-[#7C83FF]">{value}</span>
                <span className="text-body font-normal text-[#AEB7C5]">/{max}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] p-5 shadow-sm" style={{ background: '#fff9f0', border: '1.5px solid #FFE5C8' }}>
          <div className="flex items-center justify-between">
            <span className="text-body font-medium text-[#334155]">{t('ext_1598')}</span>
            <span className="text-h3 font-medium" style={{ color: '#E67E22' }}>+{totalXp} XP ✨</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-body font-normal">
            <span className="rounded-xl bg-[#FFF1EA] px-3 py-2 text-center text-[#E8664F]">{t('ext_2213', { xp: profile.xp })}</span>
            <span className="rounded-xl bg-[#FFF1EA] px-3 py-2 text-center text-[#FF9B73]">{t('ext_2323', { gameBonus })}</span>
          </div>
        </div>

        <button
          onClick={() => onComplete(profile.grade, totalXp)}
          className="hp-cta-button hp-cta-button--teal text-h3 tracking-normal"
        >
          {t('ext_2415')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingResult;
