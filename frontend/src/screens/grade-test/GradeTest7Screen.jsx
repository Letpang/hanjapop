import GradeTestRunner from './grade-runner/GradeTestRunner.jsx';

import { PASS_COUNT, QUESTIONS, TYPE_LABELS } from './grade-test-data/gradeTest7Data.js';
import { useLang } from '../../hooks/useLang.js';

const GradeTest7Screen = ({ onBack, onComplete, selectedCharacter, userXp }) => {
  const { t } = useLang();

  return (
    <GradeTestRunner
      title={t('ext_1670')}
      subtitle={<> {t('ext_1769')}<br />{t('ext_1671')}</>}
      questionsSource={QUESTIONS}
      passCount={PASS_COUNT}
      typeLabels={TYPE_LABELS}
      grade={t('ext_271')}
      nextGrade={t('ext_936')}
      unlockGrade={t('ext_271')}
      focusText={t('ext_2748')}
      prereqText={t('ext_2456')}
      alreadyUnlockedText={t('ext_2183')}
      getAlreadyUnlocked={(currentGrade) => [t('ext_271'), t('ext_1065'), t('ext_1065')].includes(currentGrade)}
      getHasPrereq={(currentGrade, alreadyUnlocked) => currentGrade === t('ext_936') || alreadyUnlocked}
      largeChoiceTypes={['hanja', 'opposite']}
      mediumChoiceTypes={['underline', 'meaning_to_word']}
      onBack={onBack}
      onComplete={onComplete}
      selectedCharacter={selectedCharacter}
      userXp={userXp}
    />
  );
};

export default GradeTest7Screen;