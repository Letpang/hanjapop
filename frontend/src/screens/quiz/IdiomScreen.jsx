import { useMemo } from 'react';
import IDIOMS from '../../data/idioms.js';
import { localizeIdioms } from '../../data/idiomI18nKeys.js';
import { useLang } from '../../hooks/useLang.js';
import IdiomQuiz from './idiom/components/IdiomQuiz.jsx';
import { collectIdioms } from './idiom/idiomQuizUtils.js';

const IdiomScreen = ({
  onBack,
  onComplete,
  contentPool,
  userXp,
  selectedCharacter,
  getRewardPreview,
  missionDone = false,
}) => {
  const { t } = useLang();
  const allIdioms = useMemo(() => localizeIdioms(IDIOMS, t), [t]);
  const idioms = useMemo(() => {
    const mainIds = contentPool?.main?.hanjaIds || [];
    return collectIdioms(mainIds, allIdioms);
  }, [allIdioms, contentPool]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
      <div className="w-full shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }} />
      <IdiomQuiz
        idioms={idioms}
        allIdioms={allIdioms}
        onBack={onBack}
        onComplete={onComplete}
        userXp={userXp}
        selectedCharacter={selectedCharacter}
        getRewardPreview={getRewardPreview}
        missionDone={missionDone}
      />
    </div>
  );
};

export default IdiomScreen;
