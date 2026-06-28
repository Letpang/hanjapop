import { useLang } from '../../../hooks/useLang.js';

const OnboardingIntroHero = ({ charScale, charTranslateY, guide }) => {
  const { t } = useLang();

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,199,174,0.18) 0%, transparent 68%)' }}
      />
      <div style={{ transform: `translateY(${charTranslateY}) scale(${charScale})` }}>
        <img src={guide} alt={t('ext_981')} className="h-52 w-52 object-contain drop-shadow-xl animate-float" />
      </div>
      <div
        className="w-16 h-2.5 rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 80%)' }}
      />
    </div>
  );
};

export default OnboardingIntroHero;