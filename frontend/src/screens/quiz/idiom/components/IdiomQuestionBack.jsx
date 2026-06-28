import { SpeakButton } from '../../../../components/common/QuizCard.jsx';

const IdiomQuestionBack = ({ question, isSpeaking, onSpeak }) => (
  <div className="grade-test-question-card flex flex-col items-center justify-center gap-3 py-10">
    <SpeakButton
      isSpeaking={isSpeaking}
      onSpeak={(event) => {
        event.stopPropagation();
        onSpeak(event);
      }}
      className="absolute right-4 top-4"
    />
    <span className="hanja-char mt-2 text-5xl font-medium tracking-normaler text-[#4F56D9]">{question.hanja}</span>
    <span className="text-2xl font-normal text-[#7C83FF]">{question.reading}</span>
    <p className="quiz-card-back__text px-2 text-center">{question.meaning}</p>
  </div>
);

export default IdiomQuestionBack;
