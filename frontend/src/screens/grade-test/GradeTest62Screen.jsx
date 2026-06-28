import GradeTestRunner from './grade-runner/GradeTestRunner.jsx';

import { PASS_COUNT, QUESTIONS, TYPE_LABELS } from './grade-test-data/gradeTest62Data.js';
import { useLang } from '../../hooks/useLang.js';

const GradeTest62Screen = ({ onBack, onComplete, selectedCharacter, userXp }) => {
  const { t } = useLang();

  return (
    <GradeTestRunner
      title={t('ext_1706')}
      subtitle={<> {t('ext_1769')}<br />{t('ext_1707')}</>}
      questionsSource={QUESTIONS}
      passCount={PASS_COUNT}
      typeLabels={TYPE_LABELS}
      grade={t('ext_936')}
      nextGrade={t('ext_272')}
      unlockGrade={t('ext_1065')}
      focusText={t('ext_2813')}
      prereqText={t('ext_2409')}
      alreadyUnlockedText={t('ext_2235')}
      getAlreadyUnlocked={(currentGrade) => ['6급II', '6급'].includes(currentGrade)}
      getHasPrereq={(currentGrade, alreadyUnlocked) => currentGrade === t('ext_271') || alreadyUnlocked}
      largeChoiceTypes={['opposite']}
      mediumChoiceTypes={['underline', 'meaning_to_word']}
      onBack={onBack}
      onComplete={onComplete}
      selectedCharacter={selectedCharacter}
      userXp={userXp}
    />
  );
};

export default GradeTest62Screen;