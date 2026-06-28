import GradeTestRunner from './grade-runner/GradeTestRunner.jsx';

import { PASS_COUNT, QUESTIONS, TYPE_LABELS } from './grade-test-data/gradeTest6Data.js';
import { useLang } from '../../hooks/useLang.js';

const GradeTest6Screen = ({ onBack, onComplete, selectedCharacter, userXp }) => {
  const { t } = useLang();

  return (
    <GradeTestRunner
      title={t('ext_1668')}
      subtitle={<> {t('ext_1769')}<br />{t('ext_1669')}</>}
      questionsSource={QUESTIONS}
      passCount={PASS_COUNT}
      typeLabels={TYPE_LABELS}
      grade={t('ext_272')}
      nextGrade={null}
      unlockGrade={t('ext_272')}
      focusText={t('ext_2974')}
      prereqText={t('ext_2455')}
      alreadyUnlockedText={t('ext_2182')}
      getAlreadyUnlocked={(currentGrade) => currentGrade === t('ext_272')}
      getHasPrereq={(currentGrade, alreadyUnlocked) => currentGrade === '6급II' || alreadyUnlocked}
      largeChoiceTypes={['opposite', 'similar', 'idiom']}
      mediumChoiceTypes={['underline', 'meaning_to_word', 'homo_meaning']}
      onBack={onBack}
      onComplete={onComplete}
      selectedCharacter={selectedCharacter}
      userXp={userXp}
    />
  );
};

export default GradeTest6Screen;