import GradeTestRunner from './grade-runner/GradeTestRunner.jsx';

import { PASS_COUNT, QUESTIONS, TYPE_LABELS } from './grade-test-data/gradeTest72Data.js';
import { useLang } from '../../hooks/useLang.js';

const GradeTest72Screen = ({ onBack, onComplete, selectedCharacter, userXp }) => {
  const { t } = useLang();

  return (
    <GradeTestRunner
      title={t('ext_1708')}
      subtitle={<> {t('ext_1769')}<br />{t('ext_1709')}</>}
      questionsSource={QUESTIONS}
      passCount={PASS_COUNT}
      typeLabels={TYPE_LABELS}
      grade={t('ext_935')}
      nextGrade={t('ext_271')}
      unlockGrade={t('ext_1064')}
      focusText={t('ext_2748')}
      prereqText={t('ext_2410')}
      alreadyUnlockedText={t('ext_2236')}
      getAlreadyUnlocked={(currentGrade) => ['7급II', '7급', '6급II', '6급'].includes(currentGrade)}
      getHasPrereq={(currentGrade, alreadyUnlocked) => currentGrade === t('ext_270') || alreadyUnlocked}
      largeChoiceTypes={['hanja', 'opposite']}
      mediumChoiceTypes={['underline', 'meaning_to_word']}
      onBack={onBack}
      onComplete={onComplete}
      selectedCharacter={selectedCharacter}
      userXp={userXp}
    />
  );
};

export default GradeTest72Screen;