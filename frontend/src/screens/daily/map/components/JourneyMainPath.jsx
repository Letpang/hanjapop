import BranchSection from './BranchSection.jsx';
import JourneyFloatingClouds from './JourneyFloatingClouds.jsx';
import JourneyTrack from './JourneyTrack.jsx';
import MapNode from './MapNode.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const QUIZ_BRANCH = {
  left: { id: 'word', label: 'ext_1492', icon: '/assets/images/icons/words.webp' },
  right: { id: 'sentence', label: 'ext_1493', icon: '/assets/images/icons/sentence.webp' },
};

const GAME_BRANCH = {
  left: { id: 'shoot', label: 'ext_1573', icon: '/assets/images/icons/monster.webp' },
  right: { id: 'match', label: 'ext_1574', icon: '/assets/images/icons/matching.webp' },
};

const JourneyMainPath = ({
  charId,
  charImg,
  chosenGame,
  chosenQuiz,
  currentStep,
  done,
  onTapNode,
}) => {
  const { t } = useLang();

  return (
    <div className="relative z-10 flex w-full flex-col gap-[clamp(1rem,3vh,2rem)] pb-12 pt-0">
      <JourneyFloatingClouds />
      <JourneyTrack />

      <MapNode
        label={t('ext_1494')}
        icon="/assets/images/icons/study.webp"
        isLeft
        status={done.has('flashcard') ? 'done' : 'active'}
        charImg={currentStep === 'flashcard' ? charImg : null}
        charId={charId}
        onTap={() => onTapNode('flashcard')}
      />

      <BranchSection
        leftNode={QUIZ_BRANCH.left}
        rightNode={QUIZ_BRANCH.right}
        available={done.has('flashcard')}
        chosen={chosenQuiz}
        stepDone={done.has('quiz')}
        charImg={charImg}
        charId={charId}
        onTap={onTapNode}
      />

      <BranchSection
        leftNode={GAME_BRANCH.left}
        rightNode={GAME_BRANCH.right}
        available={done.has('quiz')}
        chosen={chosenGame}
        stepDone={done.has('game')}
        charImg={charImg}
        charId={charId}
        onTap={onTapNode}
      />

      <div className="mt-[30px]">
        <MapNode
          label={t('ext_1496')}
          icon="/assets/images/icons/writing.webp"
          isLeft={false}
          status={done.has('writing') ? 'done' : done.has('game') ? 'active' : 'locked'}
          charImg={currentStep === 'writing' ? charImg : null}
          charId={charId}
          onTap={() => onTapNode('writing')}
        />
      </div>
    </div>
  );
};

export default JourneyMainPath;