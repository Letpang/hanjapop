import { useMemo, useState } from 'react';
import { SK } from '../../../constants/storageKeys.js';
import { INTRO_SLIDES, QUESTIONS, SKILL_CONTEXT, SKILL_IDIOM, SKILL_WORD, getGuide, scoreToLevel } from '../onboardingData.js';
import { useLang } from '../../../hooks/useLang.js';

const getSkillStats = (answers) => answers.reduce((acc, answer) => {
  if (!answer.correct) return acc;
  if (answer.skill === SKILL_WORD) return { ...acc, word: acc.word + 1 };
  if (answer.skill === SKILL_CONTEXT) return { ...acc, context: acc.context + 1 };
  if (answer.skill === SKILL_IDIOM) return { ...acc, idiom: acc.idiom + 1 };
  return acc;
}, { word: 0, context: 0, idiom: 0 });

const finishOnboarding = (grade, onComplete, xp) => {
  localStorage.setItem(SK.ONBOARDING_DONE, 'true');
  localStorage.setItem(SK.START_GRADE, grade);
  onComplete(grade, xp);
};

export const useOnboardingFlow = ({ onComplete, selectedCharacter }) => {
  const { t } = useLang();
  const guide = getGuide(selectedCharacter);
  const [step, setStep] = useState('intro');
  const [slideIdx, setSlideIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finalLevel, setFinalLevel] = useState(1);

  const score = useMemo(() => answers.filter(a => a.correct).length, [answers]);
  const skillStats = useMemo(() => getSkillStats(answers), [answers]);
  const question = QUESTIONS[qIdx];

  const handleIntroNext = () => {
    if (slideIdx < INTRO_SLIDES.length - 1) setSlideIdx(prev => prev + 1);
    else setStep('quiz');
  };

  const handleSkip = () => {
    finishOnboarding(t('ext_270'), onComplete, 20);
  };

  const handleSelect = (option) => {
    if (selected != null) return;
    const correct = option === question.answer;
    setSelected(option);
    const nextAnswers = [...answers, { ...question, selected: option, correct }];
    setAnswers(nextAnswers);

    setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx >= QUESTIONS.length) {
        const nextScore = nextAnswers.filter(a => a.correct).length;
        setFinalLevel(scoreToLevel(nextScore));
        setStep('gamePick');
        return;
      }
      setQIdx(nextIdx);
      setSelected(null);
    }, 820);
  };

  const handleComplete = (grade, xp) => {
    finishOnboarding(grade, onComplete, xp);
  };

  return {
    finalLevel,
    guide,
    handleComplete,
    handleGameDone: () => setStep('result'),
    handleGamePick: setStep,
    handleIntroNext,
    handleSelect,
    handleSkip,
    qIdx,
    question,
    score,
    selected,
    skillStats,
    slideIdx,
    step,
  };
};