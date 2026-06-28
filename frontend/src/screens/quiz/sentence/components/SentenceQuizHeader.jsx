import QuizProgressBar from '../../../../components/QuizProgressBar.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const SentenceQuizHeader = ({
    characterAvatar,
    completing,
    currentAnswered,
    displayQuestionNumber,
    onBackPress,
    plannedQuizTotal,
    selectedCharacter,
    started,
    totalAnswered,
}) => {
    const { t } = useLang();

    return (
        <div className="quiz-study-header w-full shrink-0 safe-top pt-1.5 px-3 mb-0">
            <div className="quiz-header-card quiz-header-card--sm">
                <button onClick={onBackPress} className="hp-nav-button">
                    <span>{started ? '✕' : '←'}</span>
                </button>
                <div className="quiz-header-title-area">
                    <h2 className="quiz-screen-title">{t('ext_1493')}</h2>
                    <p className="screen-subtitle">{t('ext_2250')}</p>
                </div>
                <div className="quiz-header-right">
                    {started && <span className="quiz-counter-text">{displayQuestionNumber}/{plannedQuizTotal}</span>}
                </div>
            </div>
            {started && (
                <QuizProgressBar
                    current={totalAnswered - (currentAnswered ? 1 : 0)}
                    total={plannedQuizTotal}
                    answered={currentAnswered}
                    completing={completing}
                    avatar={characterAvatar}
                    charType={selectedCharacter}
                />
            )}
        </div>
    );
};

export default SentenceQuizHeader;