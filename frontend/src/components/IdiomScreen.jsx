import { useState, useMemo, useRef } from 'react';
import IDIOMS from '../data/idioms.js';
import HANJA_DATA from '../hanja_unified.json';
import CtaButton from './common/CtaButton.jsx';
import RewardBreakdown from './common/RewardBreakdown.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';

const speakKorean = (text, onEnd) => {
    if (!text) return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const audio = new Audio(`/assets/audio/words/word_${encodeURIComponent(text.trim())}.mp3`);
    if (onEnd) audio.onended = onEnd;
    audio.play().catch(() => {
        if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ko-KR'; utter.rate = 0.8; utter.pitch = 0.95;
        if (onEnd) utter.onend = onEnd;
        const voices = window.speechSynthesis.getVoices();
        const ko = voices.filter(v => v.lang.startsWith('ko'));
        if (ko.length > 0) utter.voice = ko.find(v => /yuna|siri|sora/i.test(v.name)) || ko[0];
        window.speechSynthesis.speak(utter);
    });
};

const collectIdioms = (hanjaIds) => {
    const idSet = new Set(hanjaIds);
    const seen = new Set();
    const result = [];
    for (const item of HANJA_DATA) {
        if (!idSet.has(item.id)) continue;
        for (const w of (item.words || [])) {
            if (w.type !== 'idiom' || seen.has(w.word)) continue;
            seen.add(w.word);
            const meta = IDIOMS.find(x => x.hanja === w.word);
            if (meta) result.push(meta);
        }
    }
    return result;
};

const IDIOM_WRONG_KEY = 'idiom_wrong_data';

const idiomKey = (item) => item.id || item.hanja;

const readIdiomWrongData = () => {
    try { return JSON.parse(localStorage.getItem(IDIOM_WRONG_KEY) || '{}'); } catch { return {}; }
};

const writeIdiomWrong = (item) => {
    const key = idiomKey(item);
    const data = readIdiomWrongData();
    const prev = data[key] || {};
    data[key] = {
        wrongCount: (prev.wrongCount || 0) + 1,
        lastWrongAt: new Date().toISOString(),
    };
    localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

const clearIdiomWrong = (item) => {
    const key = idiomKey(item);
    const data = readIdiomWrongData();
    const prev = data[key] || {};
    data[key] = {
        ...prev,
        correctCount: (prev.correctCount || 0) + 1,
    };
    if (data[key].wrongCount) {
        delete data[key].wrongCount;
    }
    localStorage.setItem(IDIOM_WRONG_KEY, JSON.stringify(data));
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const ALL_CHARS = () => [...new Set(IDIOMS.flatMap(i => [...i.hanja]))];

const buildQuiz = (idioms) => {
    if (idioms.length === 0) return [];
    const allChars = ALL_CHARS();
    const questions = [];

    shuffle([...idioms]).forEach((item, i) => {
        const others = IDIOMS.filter(x => x.hanja !== item.hanja);
        const type = i % 3;

        if (type === 0) {
            // 괄호 채우기
            const blankIdx = Math.floor(Math.random() * 4);
            const correct = item.hanja[blankIdx];
            const displayHanja = [...item.hanja].map((ch, j) => j === blankIdx ? '(  )' : ch).join('');
            const displayReading = [...item.reading].map((ch, j) => j === blankIdx ? '○' : ch).join('');
            const distractors = shuffle(allChars.filter(c => c !== correct)).slice(0, 3);
            questions.push({
                ...item,
                type: 'fill_blank',
                typeLabel: '괄호 채우기',
                prompt: '괄호 안에 들어갈 한자는?',
                displayHanja,
                displayReading,
                choices: shuffle([correct, ...distractors]),
                answer: correct,
            });
        } else if (type === 1) {
            // 독음 읽기
            const distractors = shuffle(others).slice(0, 3).map(x => x.reading);
            questions.push({
                ...item,
                type: 'reading',
                typeLabel: '독음 읽기',
                prompt: '다음 사자성어의 독음(讀音)은?',
                choices: shuffle([item.reading, ...distractors]),
                answer: item.reading,
            });
        } else {
            if (i % 6 < 3) {
                // 뜻 찾기
                const distractors = shuffle(others).slice(0, 3).map(x => x.meaning);
                questions.push({
                    ...item,
                    type: 'meaning_from_idiom',
                    typeLabel: '뜻 찾기',
                    prompt: '다음 사자성어의 뜻은?',
                    choices: shuffle([item.meaning, ...distractors]),
                    answer: item.meaning,
                });
            } else {
                // 사자성어 찾기
                const distractors = shuffle(others).slice(0, 3).map(x => x.hanja);
                questions.push({
                    ...item,
                    type: 'idiom_from_meaning',
                    typeLabel: '사자성어 찾기',
                    prompt: '다음 뜻에 해당하는 사자성어는?',
                    displayMeaning: item.meaning,
                    choices: shuffle([item.hanja, ...distractors]),
                    answer: item.hanja,
                });
            }
        }
    });

    return questions;
};

const IdiomQuiz = ({ idioms, onBack, onComplete, onHanjaAcquired, userXp, selectedCharacter, getRewardPreview }) => {
    const questions = useMemo(() => buildQuiz(idioms), [idioms]);
    const [idx, setIdx] = useState(0);
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const [isFlipped, setIsFlipped] = useState(false);
    const [skipTransition, setSkipTransition] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [history, setHistory] = useState([]); // [{wrongChoices, isCorrectSelected}]
    const flipTimerRef = useRef(null);
    const flipSeqRef = useRef(0);
    const clearCountRef = useRef(0);

    const characterAvatar = useMemo(() => {
        if (!selectedCharacter) return null;
        return getRankDetails(userXp || 0, selectedCharacter).avatar;
    }, [userXp, selectedCharacter]);

    const q = questions[idx];

    const handleSelect = (choice) => {
        if (isCorrectSelected || wrongChoices.includes(choice)) return;
        if (choice === q.answer) {
            setIsCorrectSelected(true);
            if (wrongChoices.length === 0) {
                setScore(s => s + 1);
                clearIdiomWrong(q);
                onHanjaAcquired?.(null, 5);
                setXpPopup({ show: true, key: Date.now(), amount: 5 });
                setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
            }
            const flipSeq = flipSeqRef.current + 1;
            flipSeqRef.current = flipSeq;
            flipTimerRef.current = setTimeout(() => {
                if (flipSeqRef.current !== flipSeq) return;
                setIsFlipped(true);
                setIsSpeaking(true);
                speakKorean(q.reading, () => setIsSpeaking(false));
                flipTimerRef.current = null;
            }, 1500);
            return;
        }
        if (wrongChoices.length === 0) writeIdiomWrong(q);
        setWrongChoices(prev => [...prev, choice]);
    };

    const resetCard = () => {
        if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
        flipSeqRef.current += 1;
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setSkipTransition(true);
        setIsFlipped(false);
    };

    const handleNext = () => {
        setHistory(h => [...h, { wrongChoices, isCorrectSelected }]);
        resetCard();
        requestAnimationFrame(() => {
            setSkipTransition(false);
            if (idx + 1 >= questions.length) {
                clearCountRef.current += 1;
                onComplete?.();
                setDone(true);
            } else {
                setIdx(i => i + 1);
                setWrongChoices([]);
                setIsCorrectSelected(false);
            }
        });
    };

    const handlePrev = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        resetCard();
        requestAnimationFrame(() => {
            setSkipTransition(false);
            setIdx(i => i - 1);
            setWrongChoices(prev.wrongChoices);
            setIsCorrectSelected(prev.isCorrectSelected);
        });
    };

    if (done) {
        const pct = Math.round((score / questions.length) * 100);
        const isClear = pct >= 70;
        const correctXp = score * 5;
        const clearXp = 25;
        const reward = getRewardPreview?.(correctXp + clearXp);
        return (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto backdrop-blur-lg animate-in fade-in duration-300"
                style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'rgba(255,107,107,0.18)' }}>
                <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-visible my-auto">
                    <div className="pt-6 pb-10 px-6 flex flex-col items-center gap-7 w-full relative">
                        <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0 char-bg-glow" />
                        <img
                            src={getCharacterImage(selectedCharacter, isClear ? 'success' : 'failure')}
                            alt="result"
                            className="w-[176px] h-[176px] object-contain relative z-10 mt-4 img-shadow-lg"
                        />
                        <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                            <span className="result-subtitle">
                                {isClear ? '사자성어 완료!' : '아쉬운 결과네요...'}
                            </span>
                            <h1 className={`text-h2-res leading-snug result-title ${isClear ? 'result-title--clear' : 'result-title--fail'}`}>
                                {pct === 100 ? '완벽해요! 마스터!' : isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br/>다시 도전해봐요!</>}
                            </h1>
                            <p className="body-muted">{score} / {questions.length}문제 정답</p>
                        </div>
                        <RewardBreakdown
                            reward={reward}
                            correctXp={correctXp}
                            clearXp={clearXp}
                            detailText={`${score}문제 x 5XP + 완료 ${clearXp}XP`}
                            missionXp={clearCountRef.current >= 1 ? 25 : 0}
                        />
                        <div className="w-full flex flex-col gap-3 relative z-10">
                            <CtaButton theme="coral" onClick={() => { setIdx(0); setWrongChoices([]); setIsCorrectSelected(false); setScore(0); setDone(false); }}>
                                <span className="quiz-cta-text">다시 풀기</span>
                            </CtaButton>
                            <button onClick={onBack} className="w-full py-3.5 rounded-2xl back-quiz-button">
                                목록으로 돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="idiom-quiz-shell">
            {xpPopup.show && (
                <div key={xpPopup.key} className="xp-popup-wrapper">
                    <div className="xp-popup-badge">⭐ +{xpPopup.amount} XP</div>
                </div>
            )}
            <div className="w-full shrink-0 mb-4 w-full max-w-lg mx-auto">
                <div className="quiz-header-card quiz-header-card--sm">
                    <button onClick={onBack} className="hp-nav-button">
                        <span>✕</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">사자성어 퀴즈</h2>
                        <p className="screen-subtitle">사자성어를 보고 뜻을 맞혀보세요</p>
                    </div>
                    <div className="quiz-header-right">
                        <span className="quiz-counter-text">{idx + 1}/{questions.length}</span>
                    </div>
                </div>
                <div className="w-full h-[10px] bg-[#F4F7F8] rounded-full mt-3 relative px-1 mx-auto max-w-[90%]">
                    <div
                        className="h-full transition-all duration-700 rounded-full bg-[#7C83FF] relative"
                        style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
                    >
                        {characterAvatar && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl border-2 border-[#7C83FF] flex items-center justify-center overflow-hidden z-10 transition-all duration-700">
                                <img src={characterAvatar} className="w-7 h-7 object-contain" alt="progress-pawn" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full card-flip-perspective"
                onClick={() => {
                    if (isCorrectSelected && isFlipped) {
                        setIsFlipped(f => !f);
                        if (!isFlipped) { setIsSpeaking(true); speakKorean(q.reading, () => setIsSpeaking(false)); }
                    }
                }}
            >
                <div
                    className="relative w-full"
                    style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: skipTransition ? 'none' : 'transform 700ms', minHeight: '180px' }}
                >
                    {/* 앞면: 문제 */}
                    <div
                        className="grade-test-question-card"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: isFlipped ? 'absolute' : 'relative', inset: 0 }}
                    >
                        <span className="grade-test-type-label">{q.typeLabel}</span>
                        <p className="grade-test-prompt">{q.prompt}</p>

                        {q.type === 'fill_blank' && (
                            <div className="grade-test-hanja-box grade-test-hanja-box--compound">
                                <span className="grade-test-hanja-char hanja-char">{q.displayHanja}</span>
                            </div>
                        )}
                        {(q.type === 'reading' || q.type === 'meaning_from_idiom') && (
                            <div className="grade-test-hanja-box grade-test-hanja-box--compound">
                                <span className="grade-test-hanja-char hanja-char">{q.hanja}</span>
                            </div>
                        )}
                        {q.type === 'idiom_from_meaning' && (
                            <p className="grade-exam-guide-text text-center">{q.displayMeaning}</p>
                        )}
                    </div>

                    {/* 뒷면: 정답 정보 */}
                    <div
                        className="grade-test-question-card absolute inset-0 flex flex-col items-center justify-center gap-3"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsSpeaking(true); speakKorean(q.reading, () => setIsSpeaking(false)); }}
                            className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border-2 border-slate-100 transition-all active:scale-90 ${isSpeaking ? 'bg-[#7C83FF] text-white' : 'bg-[#F8FAF9] text-[#AEB7C5]'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        </button>
                        <span className="text-5xl font-black text-[#4F56D9] tracking-tighter">{q.hanja}</span>
                        <span className="text-2xl font-black text-[#7C83FF]">{q.reading}</span>
                        <p className="text-sm font-bold text-[#8F99AD] text-center break-keep px-2">{q.meaning}</p>
                    </div>
                </div>
            </div>

            <div className={`grade-test-choice-grid ${q.type === 'meaning_from_idiom' ? 'grade-test-choice-grid--single' : ''}`}>
                {q.choices.map((choice, i) => {
                    const isWrong = wrongChoices.includes(choice);
                    const isCorrect = isCorrectSelected && choice === q.answer;
                    const isDimmed = isCorrectSelected && !isCorrect;
                    const isLarge = q.type === 'fill_blank' || q.type === 'idiom_from_meaning';

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(choice)}
                            disabled={isCorrectSelected}
                            className={`quiz-choice-btn ${isLarge ? 'quiz-choice-btn--large' : ''} ${isCorrect ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : isDimmed ? 'quiz-choice-btn--dimmed' : ''}`}
                        >
                            {choice}
                        </button>
                    );
                })}
            </div>

            {isCorrectSelected && (
                <div className="w-full flex gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    {history.length > 0 && (
                        <button onClick={handlePrev} className="quiz-prev-btn flex-[1.5]">
                            이전
                        </button>
                    )}
                    <button onClick={handleNext} className={`quiz-next-btn ${history.length > 0 ? 'flex-[2.5]' : 'w-full'}`}>
                        {idx + 1 >= questions.length ? '결과 보기' : '다음'}
                    </button>
                </div>
            )}
        </div>
    );
};

const IdiomScreen = ({ onBack, onComplete, onHanjaAcquired, contentPool, userXp, selectedCharacter, getRewardPreview }) => {
    const idioms = useMemo(() => {
        if (!contentPool) return IDIOMS;
        const hanjaIds = [
            ...(contentPool.main?.hanjaIds || []),
            ...(contentPool.review?.hanjaIds || []),
        ];
        const pool = collectIdioms(hanjaIds);
        return pool.length > 0 ? pool : IDIOMS;
    }, [contentPool]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#F8FAF9]">
            <div className="w-full shrink-0" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }} />
            <IdiomQuiz idioms={idioms} onBack={onBack} onComplete={onComplete} onHanjaAcquired={onHanjaAcquired} userXp={userXp} selectedCharacter={selectedCharacter} getRewardPreview={getRewardPreview} />
        </div>
    );
};

export default IdiomScreen;
