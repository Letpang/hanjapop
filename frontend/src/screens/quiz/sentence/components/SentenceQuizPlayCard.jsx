import { useMemo } from 'react';
import QuizCard from '../../../../components/common/QuizCard.jsx';
import SentenceQuizAnswerDetail from './SentenceQuizAnswerDetail.jsx';
import SentenceQuizFrontPrompt from './SentenceQuizFrontPrompt.jsx';
import { getSentenceParts, getSentenceSizeClass, wordReadingMap } from '../sentenceQuizUtils.js';

const SentenceQuizPlayCard = ({
    questionKey,
    currentQuiz,
    options,
    currentAnswer,
    isLastQuestion,
    completing,
    speakText,
    combo,
    onCorrect,
    onWrong,
    onNext,
    onCorrectSelected,
}) => {
    const word = currentQuiz?.target?.word || '';
    const reading = wordReadingMap[word] || currentQuiz?.target?.reading || word;
    const meaning = currentQuiz?.target?.meaning || '';
    const sentenceSizeClass = getSentenceSizeClass(currentQuiz?.sentence || '');
    const sentenceParts = useMemo(() => getSentenceParts(currentQuiz?.sentence), [currentQuiz]);

    return (
        <QuizCard
            key={questionKey}
            choices={options}
            correctAnswer={currentAnswer}
            choiceClassName=""
            cardAspect="aspect-[9/6] sm:aspect-[16/9]"
            isFirst={true}
            isLast={isLastQuestion}
            completing={completing}
            speakText={speakText}
            xpAmount={10}
            combo={combo}
            onCorrect={onCorrect}
            onWrong={onWrong}
            onNext={onNext}
            onCorrectSelected={onCorrectSelected}
            renderFront={({ isAnswered }) => (
                <SentenceQuizFrontPrompt
                    currentQuiz={currentQuiz}
                    isAnswered={isAnswered}
                    sentenceParts={sentenceParts}
                    sentenceSizeClass={sentenceSizeClass}
                />
            )}
            renderBack={({ isSpeaking, onSpeak }) => (
                <SentenceQuizAnswerDetail
                    currentQuiz={currentQuiz}
                    isSpeaking={isSpeaking}
                    meaning={meaning}
                    onSpeak={onSpeak}
                    reading={reading}
                    word={word}
                />
            )}
        />
    );
};

export default SentenceQuizPlayCard;
