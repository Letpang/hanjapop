import HanjaStudyHero from './HanjaStudyHero.jsx';
import PracticeQuizSection from './PracticeQuizSection.jsx';
import RelatedIdiomsSection from './RelatedIdiomsSection.jsx';
import RelatedWordsSection from './RelatedWordsSection.jsx';
import SynAntSection from './SynAntSection.jsx';

const HanjaStudySheetBody = ({ item, study }) => (
  <div
    className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-10 overflow-y-auto px-5 pt-8"
    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)' }}
  >
    <HanjaStudyHero item={item} isSpeaking={study.isSpeaking} onSpeak={study.speak} />

    <RelatedWordsSection
      words={study.regularWords}
      isOpen={study.openSections.words}
      onToggle={() => study.toggleSection('words')}
    />

    <RelatedIdiomsSection
      idioms={study.relatedIdioms}
      isOpen={study.openSections.idioms}
      onToggle={() => study.toggleSection('idioms')}
    />

    <SynAntSection
      item={item}
      isOpen={study.openSections.synAnt}
      onToggle={() => study.toggleSection('synAnt')}
    />

    <PracticeQuizSection
      questions={study.questions}
      answers={study.answers}
      isOpen={study.openSections.quiz}
      onToggle={() => study.toggleSection('quiz')}
      onAnswer={study.handleAnswer}
      completionLabel={study.completionLabel}
      onComplete={study.handleWritingNext}
    />
  </div>
);

export default HanjaStudySheetBody;
