import { getCharacterScale, getCharacterTranslateY } from '../../../utils/rankUtils.js';
import { FLOAT_ITEMS, INTRO_SLIDES } from '../onboardingData.js';
import OnboardingFloatItems from './OnboardingFloatItems.jsx';
import OnboardingIntroActions from './OnboardingIntroActions.jsx';
import OnboardingIntroCopy from './OnboardingIntroCopy.jsx';
import OnboardingIntroHero from './OnboardingIntroHero.jsx';

const OnboardingIntro = ({ slideIdx, onNext, onSkip, guide, charId }) => {
  const slide = INTRO_SLIDES[slideIdx];
  const charScale = getCharacterScale(charId || 'garae', 'rank5');
  const charTranslateY = getCharacterTranslateY(charId || 'garae', true);

  return (
    <div
      className="onboarding-intro-screen relative flex min-h-[100dvh] w-full flex-col overflow-hidden"
      style={{
        background: '#f7fffe',
        backgroundImage: 'radial-gradient(rgba(0,199,174,0.18) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-72 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(46,214,197,0.18) 0%, transparent 100%)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, #f7fffe 0%, transparent 100%)' }}
      />

      <OnboardingFloatItems items={FLOAT_ITEMS} />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
          <OnboardingIntroHero
            charScale={charScale}
            charTranslateY={charTranslateY}
            guide={guide}
          />
          <OnboardingIntroCopy slide={slide} />
          <OnboardingIntroActions
            onNext={onNext}
            onSkip={onSkip}
            slideIdx={slideIdx}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingIntro;
