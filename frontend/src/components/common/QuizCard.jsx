import { useState, useRef, useEffect } from 'react';
import { speakKorean } from '../../utils/speakUtils.js';
import { CELEB_MESSAGES } from '../../constants/messages.js';



const StarBurst = () => (
    <>
        <span className="absolute left-[15%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-1 1s ease-out forwards' }}>⭐</span>
        <span className="absolute left-[35%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-2 1.2s ease-out forwards' }}>✨</span>
        <span className="absolute left-[45%] top-1/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-3 .9s ease-out forwards' }}>⭐</span>
        <span className="absolute left-[55%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-4 1.1s ease-out forwards' }}>✨</span>
        <span className="absolute left-[65%] top-1/2 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-5 1.3s ease-out forwards' }}>⭐</span>
        <span className="absolute left-[85%] top-1/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-6 1s ease-out forwards' }}>✨</span>
        <span className="absolute left-[25%] top-2/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-3 1.1s ease-out forwards' }}>⭐</span>
        <span className="absolute left-[75%] top-2/3 w-4 h-4 pointer-events-none z-[15]" style={{ animation: 'star-burst-1 1.2s ease-out forwards' }}>✨</span>
    </>
);

export const SpeakButton = ({ isSpeaking, onSpeak, className = '' }) => (
    <button
        onClick={onSpeak}
        className={`quiz-card-speak-btn ${isSpeaking ? 'quiz-card-speak-btn--active' : ''} ${className}`}
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
    </button>
);

/**
 * 공통 퀴즈 카드 컴포넌트 (WordQuiz, SentenceQuiz, IdiomQuiz 공용)
 *
 * cardLayout:
 *   'aspect'  — 고정 비율 컨테이너, 앞뒤 면 모두 absolute (단어/문장 퀴즈)
 *   'content' — 뒷면이 position:relative 로 높이 결정, 앞면 overlay (사자성어)
 */
const QuizCard = ({
    renderFront,          // ({ isAnswered, hasWrong }) => ReactNode
    renderBack,           // ({ isSpeaking, onSpeak }) => ReactNode
    choices = [],
    correctAnswer,
    choiceGridClassName,  // 지정 시 기본 'quiz-choice-grid' 대체
    choiceGridStyle,
    choiceClassName = '',
    renderChoice,         // (choice, { isCorrect, isWrong, isDimmed }) => ReactNode
    cardAspect = 'aspect-[2/1] sm:aspect-[16/9]',
    cardLayout = 'aspect',
    isFirst = true,
    isLast = false,
    completing = false,
    speakText = '',
    xpAmount = 5,
    suppressXp = false,
    combo = 0,
    onCorrect,            // (isFirstAttempt: bool) => void
    onWrong,              // (choice: string) => void  — 문제당 1회만
    onNext,
    onPrev,
    onCorrectSelected,
}) => {
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [celebrationMsg, setCelebrationMsg] = useState('');
    const [showXPPopup, setShowXPPopup] = useState(false);
    const [xpAnimKey, setXpAnimKey] = useState(0);

    const flipTimerRef = useRef(null);
    const flipSeqRef = useRef(0);
    const wrongFiredRef = useRef(false);
    const celebIdxRef = useRef(0);

    useEffect(() => () => {
        if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
        flipSeqRef.current += 1;
        window.speechSynthesis?.cancel();
    }, []);

    const doSpeak = (e) => {
        e?.stopPropagation();
        if (!speakText) return;
        setIsSpeaking(true);
        speakKorean(speakText, () => setIsSpeaking(false));
    };

    const handleCardClick = () => {
        if (!isCorrectSelected) return;
        const toBack = !isFlipped;
        setIsFlipped(f => !f);
        if (toBack && speakText) {
            setIsSpeaking(true);
            speakKorean(speakText, () => setIsSpeaking(false));
        } else {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        }
    };

    const handleSelect = (choice) => {
        if (isCorrectSelected || wrongChoices.includes(choice)) return;
        if (choice === correctAnswer) {
            const isFirstAttempt = wrongChoices.length === 0;
            setIsCorrectSelected(true);
            onCorrectSelected?.();
            const msg = CELEB_MESSAGES[celebIdxRef.current % CELEB_MESSAGES.length];
            celebIdxRef.current += 1;
            setCelebrationMsg(msg);
            onCorrect?.(isFirstAttempt);
            if (!suppressXp) {
                setShowXPPopup(false);
                setTimeout(() => {
                    setShowXPPopup(true);
                    setXpAnimKey(k => k + 1);
                    setTimeout(() => setShowXPPopup(false), 1500);
                }, 0);
            }
            if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
            const seq = ++flipSeqRef.current;
            flipTimerRef.current = setTimeout(() => {
                if (flipSeqRef.current !== seq) return;
                setIsFlipped(true);
                flipTimerRef.current = null;
                if (speakText) {
                    setIsSpeaking(true);
                    speakKorean(speakText, () => setIsSpeaking(false));
                }
            }, 1500);
        } else {
            if (!wrongFiredRef.current) {
                wrongFiredRef.current = true;
                onWrong?.(choice);
            }
            setWrongChoices(prev => [...prev, choice]);
        }
    };

    const handleNext = () => {
        window.speechSynthesis?.cancel();
        if (flipTimerRef.current) { clearTimeout(flipTimerRef.current); flipTimerRef.current = null; }
        flipSeqRef.current += 1;
        setIsSpeaking(false);
        onNext?.();
    };

    const flipStyle = {
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
    };

    const card = cardLayout === 'content' ? (
        // 사자성어: 뒷면(relative)이 높이 결정, 앞면(absolute)이 overlay
        <div className="w-full card-flip-perspective" onClick={handleCardClick}>
            <div style={{ ...flipStyle, transition: 'transform 700ms' }}>
                <div style={{ position: 'relative', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isFlipped ? 1 : 0 }}>
                    {renderBack?.({ isSpeaking, onSpeak: doSpeak })}
                </div>
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }}>
                    {renderFront?.({ isAnswered: isCorrectSelected, hasWrong: wrongChoices.length > 0 })}
                </div>
            </div>
        </div>
    ) : (
        // 단어/문장: 고정 비율 컨테이너, 양면 absolute
        <div className={`relative w-full ${cardAspect} card-flip-perspective`} onClick={handleCardClick}>
            <div className={`relative w-full h-full transition-all duration-700 ${isCorrectSelected ? 'cursor-pointer shadow-2xl dark:shadow-slate-900/50' : ''} rounded-[4rem]`} style={flipStyle}>
                <div className="quiz-card-front absolute inset-0 bg-white dark:bg-slate-800 rounded-[2.5rem] border-[10px] border-white dark:border-slate-700 flex flex-col items-center justify-center px-8 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }}>
                    {renderFront?.({ isAnswered: isCorrectSelected, hasWrong: wrongChoices.length > 0 })}
                </div>
                {isCorrectSelected && (
                    <div className="quiz-card-back dark:bg-slate-800 dark:border-slate-800" style={{ zIndex: isFlipped ? 1 : 0 }}>
                        {renderBack?.({ isSpeaking, onSpeak: doSpeak })}
                    </div>
                )}
            </div>
        </div>
    );

    const gridClass = choiceGridClassName !== undefined ? choiceGridClassName : 'quiz-choice-grid';

    return (
        <div className={`quiz-card-layout quiz-card-layout--${cardLayout} flex-1 flex flex-col gap-3 w-full max-w-2xl mx-auto animate-in fade-in duration-500`}>

            {showXPPopup && (
                <div key={xpAnimKey}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
                    style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '120px' }}>
                    <div className="flex flex-col items-center gap-2">
                        {combo > 1 && (
                            <div className="px-4 py-1.5 rounded-full font-normal text-white text-sm"
                                style={{ backgroundColor: '#4A51D4', boxShadow: '0 4px 12px rgba(74,81,212,.45)' }}>
                                🔥 {combo}연속 정답!
                            </div>
                        )}
                        <div className="xp-popup-badge">⭐ +{xpAmount} XP</div>
                    </div>
                </div>
            )}

            <div className={`flex-1 flex flex-col gap-4 sm:gap-5 w-full animate-in slide-in-from-bottom-6 duration-400 ${completing ? 'pointer-events-none' : ''}`}>
                {card}

                <div className={gridClass}
                    style={choiceGridStyle}>
                    {choices.map((choice, i) => {
                        const isWrong = wrongChoices.includes(choice);
                        const isCorrect = isCorrectSelected && choice === correctAnswer;
                        const isDimmed = isCorrectSelected && !isCorrect;
                        return (
                            <button key={i}
                                onClick={() => handleSelect(choice)}
                                disabled={isCorrectSelected}
                                className={`quiz-choice-btn ${choiceClassName} ${isCorrect ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : isDimmed ? 'quiz-choice-btn--dimmed' : ''}`}>
                                {renderChoice
                                    ? renderChoice(choice, { isCorrect, isWrong, isDimmed })
                                    : <span>{choice}</span>
                                }
                                {isCorrect && celebrationMsg && (
                                    <div className="absolute bottom-[125%] left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-[1.3rem] text-white font-normal text-[1.05rem] shadow-xl flex items-center justify-center whitespace-nowrap z-[20] pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(135deg,#FF9B73 0%,#FF6B6B 100%)',
                                            boxShadow: '0 8px 24px rgba(255,107,107,.3),inset 0 -3px 0 rgba(0,0,0,.15)',
                                            animation: 'pop-bubble .4s cubic-bezier(.175,.885,.32,1.275) forwards,fade-out-up .3s ease-in 1.2s forwards',
                                        }}>
                                        <span className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,.15)]">{celebrationMsg}</span>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#FF6B6B]" />
                                    </div>
                                )}
                                {isCorrect && <StarBurst />}
                            </button>
                        );
                    })}
                </div>

                <div className={`pt-2 sm:pt-4 w-full flex gap-3 transition-opacity duration-300 ${isCorrectSelected && !completing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {!isFirst && <button onClick={onPrev} className="quiz-prev-btn flex-[1.5]">이전</button>}
                    <button onClick={handleNext} className={`quiz-next-btn ${isFirst ? 'w-full' : 'flex-[2.5]'}`}>
                        {isLast ? '결과 보기' : '다음'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizCard;
