import QuizProgressBar from '../../../../components/QuizProgressBar.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const WordQuizHeader = ({
    characterAvatar,
    completing,
    currentAnswered,
    currentIdx,
    isQuizActive,
    onBack,
    onRequestExit,
    questionCount,
    selectedCharacter,
}) => {
    const { t } = useLang();

    return (
        <div className="quiz-study-header w-full shrink-0 safe-top pt-1.5 px-3 mb-0">
            <div className="quiz-header-card quiz-header-card--sm">
                <button onClick={isQuizActive ? onRequestExit : onBack} className="hp-nav-button">
                    <span>{isQuizActive ? '✕' : '←'}</span>
                </button>
                <div className="quiz-header-title-area">
                    <h2 className="quiz-screen-title">{t('ext_1492')}</h2>
                    <p className="screen-subtitle">{t('ext_2218')}</p>
                </div>
                <div className="quiz-header-right">
                    {isQuizActive && questionCount > 0 && (
                        <span className="quiz-counter-text">{currentIdx + 1}/{questionCount}</span>
                    )}
                </div>
            </div>
            {isQuizActive && questionCount > 0 && (
                <QuizProgressBar
                    current={currentIdx}
                    total={questionCount}
                    answered={currentAnswered}
                    completing={completing}
                    avatar={characterAvatar}
                    charType={selectedCharacter}
                />
            )}
        </div>
    );
};

export default WordQuizHeader;