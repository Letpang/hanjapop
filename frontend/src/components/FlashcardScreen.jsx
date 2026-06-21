import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { speakKorean } from '../utils/speakUtils.js';
import { QuizCard } from './WritingScreen.jsx';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import IDIOMS from '../data/idioms.js';
import { usePremium } from '../hooks/usePremium.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../utils/rankUtils.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import RewardBreakdown from './common/RewardBreakdown.jsx';
import CtaButton from './common/CtaButton.jsx';
import { pickClearMessage } from '../constants/messages.js';
import QuizProgressBar from './QuizProgressBar.jsx';

const CATEGORIES = ['전체', '숫자와 기초 개념', '자연과 시간', '나와 가족 신체', '공간과 위치', '학교와 일상생활', '행동과 상태', '사회와 문화'];
const STUDY_SHEET_CLEAR_XP = 25;

const loadCompletedStudyIds = (currentDay) => {
    try {
        const key = currentDay ? `${SK.STUDY_SHEET_COMPLETED}_${currentDay}` : SK.STUDY_SHEET_COMPLETED;
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(saved)) return new Set();
        return new Set(saved.map(Number).filter(Number.isFinite));
    } catch {
        return new Set();
    }
};

const saveCompletedStudyIds = (ids, currentDay) => {
    try {
        const key = currentDay ? `${SK.STUDY_SHEET_COMPLETED}_${currentDay}` : SK.STUDY_SHEET_COMPLETED;
        localStorage.setItem(key, JSON.stringify([...ids]));
    } catch {}
};

const CURRICULUM_ORDER = new Map();
DAILY_CURRICULUM.forEach((day, dayIdx) => {
    day.hanja.forEach((h, hIdx) => {
        if (h.id !== null) CURRICULUM_ORDER.set(h.id, dayIdx * 100 + hIdx);
    });
});

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const HANJA_MAP = Object.fromEntries(HANJA_DATA.map(h => [h.hanja, h]));

let stopActiveCardSound = null;

const playCardSound = (item, onEnd) => {
    if (!item) return () => {};
    stopActiveCardSound?.();

    let stopped = false;
    let audio = null;
    let stopTTS = null;
    const finish = () => {
        if (stopped) return;
        stopped = true;
        stopActiveCardSound = null;
        if (onEnd) onEnd();
    };
    const stop = () => {
        if (stopped) return;
        stopped = true;
        if (audio) {
            audio.onended = null;
            audio.onerror = null;
            audio.pause();
            audio.currentTime = 0;
        }
        stopTTS?.();
        if (stopActiveCardSound === stop) stopActiveCardSound = null;
    };
    stopActiveCardSound = stop;

    const playTTS = () => {
        if (stopped) return;
        const text = (item.meaning && item.sound) ? (item.meaning + ' ' + item.sound) : (item.sound || '');
        if (text) stopTTS = speakKorean(text, finish);
        else finish();
    };
    if (item.id <= 370) {
        const audioId = String(item.id).padStart(item.id < 51 ? 2 : 3, '0');
        audio = new Audio('/assets/audio/card_' + audioId + '.mp3');
        let done = false;
        const fallback = () => {
            if (stopped || done) return;
            done = true;
            playTTS();
        };
        audio.onended = () => { done = true; finish(); };
        audio.onerror = fallback;
        audio.play().catch(fallback);
    } else {
        playTTS();
    }
    return stop;
};

// 4지선다 오답 보기 생성
const pickDistractors = (correctId, field, count = 3) => {
    const correctValue = HANJA_DATA.find(h => h.id === correctId)?.[field]?.trim();
    const seen = new Set([correctValue]);
    const result = [];
    for (const h of shuffle([...HANJA_DATA])) {
        if (h.id === correctId || !h[field]) continue;
        const val = h[field].trim();
        if (seen.has(val)) continue;
        seen.add(val);
        result.push(val);
        if (result.length >= count) break;
    }
    return result;
};

// 학습지용 퀴즈 생성
const buildWorksheetQuiz = (item) => {
    const questions = [];

    // Q1: 한자 음훈 (뜻 맞추기)
    const meaningDistractors = pickDistractors(item.id, 'meaning');
    questions.push({
        id: 'q_meaning',
        type: 'choice',
        prompt: `${item.hanja}의 뜻은?`,
        choices: shuffle([item.meaning, ...meaningDistractors]),
        answer: item.meaning,
    });

    // Q2: 한자 음 (음 맞추기)
    const soundDistractors = pickDistractors(item.id, 'sound');
    questions.push({
        id: 'q_sound',
        type: 'choice',
        prompt: `${item.hanja}의 음은?`,
        choices: shuffle([item.sound, ...soundDistractors]),
        answer: item.sound,
    });

    // Q3~: 역방향 — 뜻 보고 한자어 고르기 (단어마다 1개, 전체)
    const wordPool = (item.words || []).filter(w => w.word && w.meaning && w.type !== 'idiom');
    const allWords = HANJA_DATA.flatMap(h => h.words || []).filter(w => w.type !== 'idiom');
    wordPool.forEach((w, i) => {
        const revDistractors = shuffle(allWords.filter(x => x.word && x.word !== w.word)).slice(0, 3).map(x => x.word);
        questions.push({
            id: `q_reverse_${i}`,
            type: 'choice',
            choiceType: 'hanja',
            prompt: `"${w.meaning}"을 뜻하는 한자어는?`,
            choices: shuffle([w.word, ...revDistractors]),
            answer: w.word,
            wordId: w.id, word: w.word, reading: w.reading, meaning: w.meaning,
        });
    });

    // 유사어 문제
    const synList = (item.syn || []).filter(h => HANJA_MAP[h] && h !== item.hanja);
    if (synList.length > 0) {
        const correct = synList[Math.floor(Math.random() * synList.length)];
        const correctData = HANJA_MAP[correct];
        const correctLabel = `${correct}(${correctData.meaning} ${correctData.sound})`;
        const excludeSet = new Set([item.hanja, ...(item.syn || []), ...(item.ant || [])]);
        const distractors = shuffle(HANJA_DATA.filter(h => !excludeSet.has(h.hanja)))
            .slice(0, 3).map(h => `${h.hanja}(${h.meaning} ${h.sound})`);
        questions.push({
            id: 'q_syn',
            type: 'choice',
            prompt: `${item.hanja}(${item.meaning} ${item.sound})의 유사어는?`,
            choices: shuffle([correctLabel, ...distractors]),
            answer: correctLabel,
        });
    }

    // 반대어 문제
    const antList = (item.ant || []).filter(h => HANJA_MAP[h] && h !== item.hanja);
    if (antList.length > 0) {
        const correct = antList[Math.floor(Math.random() * antList.length)];
        const correctData = HANJA_MAP[correct];
        const correctLabel = `${correct}(${correctData.meaning} ${correctData.sound})`;
        const excludeSet = new Set([item.hanja, ...(item.syn || []), ...(item.ant || [])]);
        const distractors = shuffle(HANJA_DATA.filter(h => !excludeSet.has(h.hanja)))
            .slice(0, 3).map(h => `${h.hanja}(${h.meaning} ${h.sound})`);
        questions.push({
            id: 'q_ant',
            type: 'choice',
            prompt: `${item.hanja}(${item.meaning} ${item.sound})의 반대어는?`,
            choices: shuffle([correctLabel, ...distractors]),
            answer: correctLabel,
        });
    }

    return questions;
};

// ─── 인라인 퀴즈 문항 ────────────────────────────────────────────────────
const QuizItem = ({ q, idx, onAnswer, twoCol }) => {
    const [wrongChoices, setWrongChoices] = useState([]);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleSelect = (c) => {
        if (isCorrect || wrongChoices.includes(c)) return;
        
        if (c === q.answer) {
            setIsCorrect(true);
            onAnswer(q.id, wrongChoices.length === 0);
        } else {
            setWrongChoices(prev => [...prev, c]);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#F4F7F8] flex items-center justify-center text-xs-res font-normal text-[#AEB7C5] border border-[#E9EDF2] uppercase tracking-widest shrink-0">Q{idx + 1}</span>
                <p className="font-normal text-[#3C3C3C] dark:text-slate-100 text-h4 tracking-tight break-keep leading-tight flex-1">
                    {(q.id === 'q_syn' || q.id === 'q_ant') && q.prompt.match(/^([^\(]+)\((.+?)\)(.*)$/) ? (
                        (() => {
                            const match = q.prompt.match(/^([^\(]+)\((.+?)\)(.*)$/);
                            return (
                                <>
                                    <span className="hanja-char text-[#4F56D9] text-2xl align-middle mr-1">{match[1]}</span>
                                    <span className="text-sm text-[#7882A0] align-middle mr-1">({match[2]})</span>
                                    <span className="align-middle">{match[3]}</span>
                                </>
                            );
                        })()
                    ) : (
                        q.prompt
                    )}
                </p>
            </div>
            <div className="quiz-choice-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {q.choices.map((c, i) => {
                    const isWrong = wrongChoices.includes(c);
                    const isRight = isCorrect && c === q.answer;
                    const cls = `quiz-choice-btn ${q.choiceType === 'hanja' ? 'quiz-choice-btn--hanja' : ''} ${isRight ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : ''}`;

                    let content = <span className="break-keep">{c}</span>;
                    let customStyle = {};

                    if (typeof c === 'string' && (q.id === 'q_syn' || q.id === 'q_ant')) {
                        const match = c.match(/^([^\(]+)\((.+)\)$/);
                        if (match) {
                            content = (
                                <div className="flex flex-col items-center justify-center w-full gap-1.5 py-2">
                                    <span className={`hanja-char text-[2rem] leading-none ${isRight ? 'text-[#4F56D9]' : isWrong ? 'text-[#FF8D72]' : 'text-[#3C3C3C] dark:text-slate-100'}`}>{match[1]}</span>
                                    <span className={`text-[0.9rem] font-normal tracking-tight ${isRight ? 'text-[#7C83FF]' : isWrong ? 'text-[#FFA88D]' : 'text-[#7882A0]'}`}>{match[2]}</span>
                                </div>
                            );
                        }
                    } else if (typeof c === 'string' && c.length >= 6) {
                        customStyle = { fontSize: '1.25rem', justifyContent: 'center', textAlign: 'center' };
                    } else if (typeof c === 'string' && c.length >= 4) {
                        customStyle = { fontSize: '1.5rem', justifyContent: 'center', textAlign: 'center' };
                    } else {
                        customStyle = { justifyContent: 'center', textAlign: 'center' };
                    }

                    return (
                        <button key={i} className={cls} style={customStyle} onClick={() => handleSelect(c)}>
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── 풀 학습지 화면 ──────────────────────────────────────────────────────
const HanjaStudySheet = ({ item, onBack, onWriteHanja, onMarkCorrect, onMarkWrong, onMarkWordWrong, onHanjaAcquired, isSequence, onNext, isLast, isAlreadyCompleted = false, onStudySheetComplete, onQuizXp, selectedCharacter, getRewardPreview, characterAvatar }) => {
    const questions = useMemo(() => buildWorksheetQuiz(item), [item]);
    const [answers, setAnswers] = useState({});
    const refWords   = useRef(null);
    const refIdioms  = useRef(null);
    const refSynAnt  = useRef(null);
    const refQuiz    = useRef(null);
    const refWriting = useRef(null);
    const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const hasSynAnt = (item.syn && item.syn.length > 0) || (item.ant && item.ant.length > 0);

    const [isWordsOpen, setIsWordsOpen] = useState(false);
    const [isIdiomsOpen, setIsIdiomsOpen] = useState(false);
    const [isSynAntOpen, setIsSynAntOpen] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);

    const regularWords = useMemo(() => {
        return (item.words || []).filter(w => w.type !== 'idiom');
    }, [item]);

    const relatedIdioms = useMemo(() => {
        return (item.words || [])
            .filter(w => w.type === 'idiom')
            .map(w => IDIOMS.find(x => x.hanja === w.word))
            .filter(Boolean);
    }, [item]);
    const [quizDone, setQuizDone] = useState(false);
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const [isSpeaking, setIsSpeaking] = useState(false);
    const completionAwardedRef = useRef(false);
    const answeredQuestionIdsRef = useRef(new Set());

    useEffect(() => {
        setIsSpeaking(true);
        const stop = playCardSound(item, () => setIsSpeaking(false));
        return stop;
    }, [item.id]);
    const completionLabel = isSequence ? (isLast ? '전체 학습 완료하기' : '다음 한자로 이동') : '학습지 완료하기';

    const handleWritingComplete = useCallback((hanjaId, score) => {
        if (onHanjaAcquired) onHanjaAcquired(hanjaId, Math.round(score / 10));
    }, [onHanjaAcquired]);

    // handleWritingNext moved below finishStudySheet to avoid TDZ

    const handleAnswer = (qId, isCorrect) => {
        if (answeredQuestionIdsRef.current.has(qId)) return;
        answeredQuestionIdsRef.current.add(qId);
        const next = { ...answers, [qId]: isCorrect };
        setAnswers(next);

        if (isCorrect && onHanjaAcquired) {
            onHanjaAcquired(item.id, 5);
            setXpPopup({ show: true, key: Date.now(), amount: 5 });
            setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
        }

        // React 상태 계산 함수에는 부모 상태 변경 같은 부수 효과를 넣지 않는다.
        if (!isCorrect) {
            const q = questions.find(question => question.id === qId);
            if (q?.wordId != null && onMarkWordWrong) {
                onMarkWordWrong(q.wordId, item.id, q.reading, q.meaning);
            } else if (onMarkWrong) {
                onMarkWrong(item.id);
            }
        }

        if (Object.keys(next).length >= questions.length) {
            const correct = Object.values(next).filter(Boolean).length;
            if (correct >= Math.ceil(questions.length * 0.7) && onMarkCorrect) onMarkCorrect(item.id);
        }
    };

    const finishStudySheet = useCallback((afterComplete) => {
        if (!completionAwardedRef.current) {
            completionAwardedRef.current = true;
            const questionXp = Object.values(answers).filter(Boolean).length * 5;
            onQuizXp?.(questionXp);
        }
        onStudySheetComplete?.(item.id);
        afterComplete?.();
    }, [answers, isAlreadyCompleted, item.id, onHanjaAcquired, onStudySheetComplete, onQuizXp]);

    const handleWritingNext = useCallback(() => {
        if (isSequence && isLast) {
            finishStudySheet();
            setQuizDone(true);
        } else if (isSequence) {
            finishStudySheet(onNext);
        } else {
            finishStudySheet(onBack);
        }
    }, [isSequence, isLast, finishStudySheet, onNext, onBack]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#F8FAF9] dark:bg-slate-900">
            {xpPopup.show && (
                <div key={xpPopup.key} className="xp-popup-wrapper">
                    <div className="xp-popup-badge">
                        ⭐ +{xpPopup.amount} XP
                    </div>
                </div>
            )}
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0 relative z-50" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '4px' }}>
                <div className="minimal-card-studio w-full flex justify-between items-center p-4 px-6 bg-white dark:bg-slate-800 border-[#E9EDF2] shadow-xl !rounded-[3rem] min-h-[72px]">
                    <button onClick={onBack} className="hp-nav-button">
                        ←
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">한자 학습지</h2>
                        <p className="screen-subtitle">단어장을 보고 문제를 풀며<br />한자를 다양하게 익혀보아요!</p>
                    </div>
                    <div className="w-11" />
                </div>
                <QuizProgressBar
                    current={Object.keys(answers).length}
                    total={questions.length}
                    completing={Object.keys(answers).length >= questions.length && questions.length > 0}
                    avatar={characterAvatar}
                    charType={selectedCharacter}
                />
            </div>



            <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-8 flex flex-col gap-10 max-w-2xl w-full mx-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)' }}>

                {/* ── 섹션 1: 한자 정보 ── */}
                <div className="minimal-card-studio bg-white dark:bg-slate-800 border border-[#E9EDF2] shadow-xl px-5 py-3 !rounded-[2rem]">
                    <div className="flex flex-col items-center gap-1">
                        <div className="hanja-char text-[#3C3C3C] dark:text-slate-100 leading-tight drop-shadow-sm text-display">{item.hanja}</div>
                        <div className="flex items-baseline gap-4 mt-2">
                            <span className="font-normal text-[#7C83FF] text-h2 tracking-tighter">{item.meaning}</span>
                            <span className="font-normal text-[#7C83FF] text-h2 tracking-tighter">{item.sound}</span>
                        </div>
                        <button
                            onClick={() => {
                                setIsSpeaking(true);
                                playCardSound(item, () => setIsSpeaking(false));
                            }}
                            className={`mt-3 w-11 h-11 rounded-2xl border-2 flex items-center justify-center active:scale-90 shadow-sm transition-all ${isSpeaking ? 'bg-[#7C83FF] border-[#7C83FF]' : 'bg-white dark:bg-slate-800 border-[#E9EDF2]'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={isSpeaking ? '#fff' : '#7C83FF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                            </svg>
                        </button>
                    </div>
                    {item.etymology_short && (
                        <div className="mt-6 pt-6 border-t border-[#E9EDF2]">
                            <p className="font-normal text-[#3C3C3C] dark:text-slate-100 leading-relaxed tracking-tight break-keep text-body text-center">{item.etymology_short}</p>
                        </div>
                    )}
                </div>

                {/* ── 섹션 3: 단어장 ── */}
                {regularWords.length > 0 && (
                    <div ref={refWords} className="flex flex-col gap-4">
                        <button onClick={() => setIsWordsOpen(!isWordsOpen)} className="flex items-center justify-between w-full text-left px-1">
                            <div className="flex items-center gap-3">
                                <div className="flashcard-section-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#C8A882" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="4" y="3" width="16" height="18" rx="3" />
                                        <line x1="8" y1="8" x2="16" y2="8" />
                                        <line x1="8" y1="12" x2="14" y2="12" />
                                        <line x1="8" y1="16" x2="12" y2="16" />
                                    </svg>
                                </div>
                                <span className="flashcard-section-title">관련 단어 <span className="text-sm text-[#9AA4B5] ml-1">({regularWords.length})</span></span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform ${isWordsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </button>
                        {isWordsOpen && (
                            <div className="flex flex-col gap-4 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                {regularWords.map((w, i) => (
                                    <div key={i} className="flashcard-word-item">
                                        <div className={`flashcard-word-item__hanja${w.word.length >= 4 ? ' flashcard-word-item__hanja--col' : ''}`}>
                                            <span className={`flashcard-word-item__word hanja-char text-[#4F56D9] ${w.word.length <= 2 ? 'flashcard-word-item__word--short' : w.word.length === 3 ? 'flashcard-word-item__word--medium' : 'flashcard-word-item__word--long'}`}>{w.word}</span>
                                            <span className={`flashcard-word-item__reading text-[#9AA4B5]${w.word.length < 4 ? ' whitespace-nowrap ml-2' : ''}`}>{w.reading}</span>
                                        </div>
                                        <div className="flashcard-word-item__divider" />
                                        <div className="flashcard-word-item__meaning">
                                            <span className="flashcard-word-item__meaning-text break-keep text-[#5B677A] dark:text-slate-300">{w.meaning}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 섹션 3-2: 사자성어 ── */}
                {relatedIdioms.length > 0 && (
                    <div ref={refIdioms} className="flex flex-col gap-4">
                        <button onClick={() => setIsIdiomsOpen(!isIdiomsOpen)} className="flex items-center justify-between w-full text-left px-1">
                            <div className="flex items-center gap-3">
                                <div className="flashcard-section-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#C8A882" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="4" y="3" width="16" height="18" rx="3" />
                                        <line x1="8" y1="8" x2="16" y2="8" />
                                        <line x1="8" y1="12" x2="14" y2="12" />
                                        <line x1="8" y1="16" x2="12" y2="16" />
                                    </svg>
                                </div>
                                <span className="flashcard-section-title">사자성어 <span className="text-sm text-[#9AA4B5] ml-1">({relatedIdioms.length})</span></span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform ${isIdiomsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </button>
                        {isIdiomsOpen && (
                            <div className="flex flex-col gap-4 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                {relatedIdioms.map((idiom, i) => (
                                    <div key={i} className="flashcard-word-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                        <div style={{ display: 'flex', alignItems: 'stretch' }}>
                                            <div className="flashcard-word-item__hanja flashcard-word-item__hanja--col">
                                                <span className="flashcard-word-item__word flashcard-word-item__word--long hanja-char text-[#4F56D9]">{idiom.hanja}</span>
                                                <span className="flashcard-word-item__reading text-[#9AA4B5]">{idiom.reading}</span>
                                            </div>
                                            <div className="flashcard-word-item__divider" />
                                            <div className="flashcard-word-item__meaning py-3">
                                                <span className="flashcard-word-item__meaning-text break-keep text-[#5B677A] dark:text-slate-300">{idiom.meaning}</span>
                                            </div>
                                        </div>
                                        {idiom.origin && (
                                            <div className="flex items-start gap-2 px-4 pb-3 pt-2 border-t border-[#E9EDF2]">
                                                <span className="shrink-0 mt-0.5 text-[10px] leading-none text-[#AEB7C5] bg-[#F2F4F6] border border-[#E2E6EA] rounded px-1.5 py-0.5">유래</span>
                                                <p className="text-xs text-[#9AA4B5] leading-relaxed break-keep">{idiom.origin}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 섹션 3-3: 유사어 · 반대어 ── */}
                {hasSynAnt && (
                    <div ref={refSynAnt} className="flex flex-col gap-4">
                        <button onClick={() => setIsSynAntOpen(!isSynAntOpen)} className="flex items-center justify-between w-full text-left px-1">
                            <div className="flex items-center gap-3">
                                <div className="flashcard-section-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#C8A882" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="4" y="3" width="16" height="18" rx="3" />
                                        <line x1="8" y1="8" x2="16" y2="8" />
                                        <line x1="8" y1="12" x2="14" y2="12" />
                                        <line x1="8" y1="16" x2="12" y2="16" />
                                    </svg>
                                </div>
                                <span className="flashcard-section-title">유사어 · 반대어</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform ${isSynAntOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </button>
                        
                        {isSynAntOpen && (
                            <div className="flex flex-col gap-4 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                {item.syn && item.syn.length > 0 && (
                                    <div className="minimal-card-studio p-5 bg-white dark:bg-slate-800 border border-[#E9EDF2] shadow-sm !rounded-[2.5rem] flex flex-col gap-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-4 rounded-full bg-[#7C83FF]" />
                                            <span className="font-semibold text-sm-res text-[#4F56D9] dark:text-[#7C83FF]">유사어 — 비슷한 뜻</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {item.syn.map(entry => {
                                                const h = typeof entry === 'string' ? entry : entry.hanja;
                                                const d = typeof entry === 'object' ? entry : HANJA_MAP[h];
                                                return (
                                                    <div key={h} className="syn-chip">
                                                        <span className="hanja-char font-normal text-h3 text-[#7C83FF]">{h}</span>
                                                        {d && <span className="text-sm font-normal text-[#9AA4B5]">{d.meaning} {d.sound}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {item.ant && item.ant.length > 0 && (
                                    <div className="minimal-card-studio p-5 bg-white dark:bg-slate-800 border border-[#E9EDF2] shadow-sm !rounded-[2.5rem] flex flex-col gap-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-4 rounded-full bg-[#FF8D72]" />
                                            <span className="font-semibold text-sm-res text-[#E06D53] dark:text-[#FF8D72]">반대어 — 반대 뜻</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {item.ant.map(h => {
                                                const d = HANJA_MAP[h];
                                                return (
                                                    <div key={h} className="ant-chip">
                                                        <span className="hanja-char font-normal text-h3 text-[#FF8D72]">{h}</span>
                                                        {d && <span className="text-sm font-normal text-[#9AA4B5]">{d.meaning} {d.sound}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── 섹션 4: 연습 문제 ── */}
                <div ref={refQuiz} className="flex flex-col gap-4">
                    <button onClick={() => setIsQuizOpen(!isQuizOpen)} className="flex items-center justify-between w-full text-left px-1">
                        <div className="flex items-center gap-3">
                            <div className="flashcard-section-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#C8A882" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="3" width="16" height="18" rx="3" />
                                    <line x1="8" y1="8" x2="16" y2="8" />
                                    <line x1="8" y1="12" x2="14" y2="12" />
                                    <line x1="8" y1="16" x2="12" y2="16" />
                                </svg>
                            </div>
                            <span className="flashcard-section-title">연습 문제</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform ${isQuizOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </button>

                    {isQuizOpen && (
                        <div className="flex flex-col gap-4 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="minimal-card-studio p-5 bg-white dark:bg-slate-800 border border-[#E9EDF2] shadow-xl !rounded-[3rem]">
                                    <QuizItem
                                        q={q}
                                        idx={idx}
                                        onAnswer={handleAnswer}
                                        answered={!!answers[q.id]}
                                        twoCol={!q.id.startsWith('q_word_') && q.id !== 'q_syn' && q.id !== 'q_ant'}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 하단 완료/다음 버튼 */}
                    <div className="flex w-full mt-2">
                        <CtaButton theme="coral" onClick={handleWritingNext}
                            disabled={questions.length > 0 && Object.keys(answers).length < questions.length}>
                            <span className="quiz-cta-text">{completionLabel}</span>
                        </CtaButton>
                    </div>

                </div>
            </div>

                {/* 퀴즈 완료 결과 모달 (시퀀스의 마지막에만 노출) */}
                {quizDone && (
                <div className="mobile-center-overlay fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="modal-backdrop" onClick={() => { setQuizDone(false); onNext(); }} />
                        
                        <div className="mobile-modal-card minimal-card-studio bg-white dark:bg-slate-800 w-full max-w-md relative animate-in zoom-in slide-in-from-bottom-8 duration-500 !rounded-[3.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                            <div className="pt-4 pb-8 px-6 flex flex-col items-center gap-2 w-full relative">
                                {/* 메인 비주얼 */}
                                <div className="activity-result-glow" />
                                <img
                                    src={getCharacterImage(selectedCharacter, 'success')}
                                    alt="celebration"
                                    className="activity-result-char img-shadow-lg"
                                    style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
                                />

                                {/* 텍스트 정보 */}
                                <div className="text-center flex flex-col gap-2">
                                    <h1 className="text-h1 font-medium text-[#3C3C3C] dark:text-slate-100 tracking-tighter break-keep">
                                        모든 한자 학습 완료!
                                    </h1>
                                    
                                    <RewardBreakdown
                                        reward={getRewardPreview?.((Object.values(answers).filter(Boolean).length * 5) + 50)}
                                        correctXp={Object.values(answers).filter(Boolean).length * 5}
                                        clearXp={50}
                                        correctLabel="학습지"
                                        detailText={`${Object.values(answers).filter(Boolean).length}개 정답 × 5XP + 완료 50XP`}
                                        missionXp={isAlreadyCompleted ? 0 : 50}
                                    />
                                </div>

                                {/* 하단 버튼 */}
                                <div className="w-full flex flex-col gap-3 mt-4">
                                    <CtaButton theme="coral" onClick={() => { setQuizDone(false); onNext(); }}>
                                        <span className="quiz-cta-text">돌아가기</span>
                                    </CtaButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
};

// 급수별 하단 바 색상 (메인 메뉴 카드와 동일한 톤)
const GRADE_BAR_COLOR = {
    '8급':  '#A8E6CF',
    '7급Ⅱ': '#FFADAD',
    '7급':  '#FFD6A5',
    '6급Ⅱ': '#BDB2FF',
    '6급':  '#A5F3FC',
    'NON':  '#C7D2FE',
};

// ─── 한자 카드 (그리드용) — 메인 메뉴 카드 스타일 ──────────────────────────
const HanjaCard = ({ item, isLocked, isCompleted, onClick }) => {
    const barColor = GRADE_BAR_COLOR[item.grade] || '#E2E8F0';

    if (isLocked) {
        return (
            <div className="hanja-grid-card hanja-grid-card--locked">
                <span className="text-h1-res opacity-20 mb-3">🔒</span>
                <span className="hanja-char text-[#5D544F] font-normal text-h3-res tracking-tighter uppercase">{item.hanja}</span>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 opacity-30" style={{ backgroundColor: barColor }} />
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`hanja-grid-card group ${isCompleted ? 'hanja-grid-card--completed' : ''}`}
        >
            {isCompleted && <div className="hanja-grid-card__check">✓</div>}
            <div className="w-24 h-24 mb-3 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                <div
                    className="absolute inset-0 rounded-[2.5rem] opacity-5 group-hover:opacity-10 transition-opacity"
                    style={{ backgroundColor: barColor }}
                />
                <img
                    src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                    onError={e => {
                        if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                        else e.target.src = '/assets/images/hanja_placeholder.webp';
                    }}
                    className="w-[95%] h-[95%] object-contain relative z-20 drop-shadow-sm"
                    alt={item.hanja}
                />
            </div>
            <div className="flex flex-col items-center relative z-10">
                <span className="hanja-char text-h2-res font-normal text-[#5D544F] tracking-tighter uppercase">{item.hanja}</span>
            </div>
        </button>
    );
};

// ─── 인라인 플립 카드 (백업 스타일 모방) ────────────────────
// ─── 메인 FlashcardScreen ──────────────────────────────────────────────────
const FlashcardScreen = ({ onBack, onCardFlip, onWriteHanja, onMarkCorrect, onMarkWrong, onMarkWordWrong, hanjaFilter, onStageClear, unlockedHanjaIds, onHanjaAcquired, userXp, selectedCharacter, getRewardPreview, onStudySheetComplete, isPremium = false, contentPool = null, currentDay = null }) => {
    const { showPremiumGate } = usePremium();
    const [viewMode, setViewMode] = useState('grade');
    const [phase, setPhase] = useState('list');
    const [isDailyMode, setIsDailyMode] = useState(!!contentPool && !hanjaFilter);
    const [studyItem, setStudyItem] = useState(null); // 학습지 열린 한자
    const [showExitModal, setShowExitModal] = useState(false);
    const [showAllDoneModal, setShowAllDoneModal] = useState(false);
    const [completedStudyIds, setCompletedStudyIds] = useState(() => loadCompletedStudyIds(currentDay));
    const [totalQuizXp, setTotalQuizXp] = useState(0);
    const [allDoneClearMsg] = useState(() => pickClearMessage());
    const stageClearFiredRef = useRef(false);
    
    // 백업 스타일 싱글 카드 모드용 상태
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completing, setCompleting] = useState(false);

    const handleExitConfirm = () => {
        setShowExitModal(false);
        onBack();
    };

    const characterAvatar = useMemo(() => getRankDetails(userXp || 0, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const unlockedIds = useMemo(() => new Set(unlockedHanjaIds || []), [unlockedHanjaIds]);

    // 마운트 시 한 번만 스냅샷 — contentPool이 재빌드돼도 복습 목록이 바뀌지 않음
    const [contentPoolIds] = useState(() => {
        if (!contentPool) return null;
        return new Set([...(contentPool.main?.hanjaIds || []), ...(contentPool.review?.hanjaIds || [])]);
    });

    // 무조건 이번 스테이지 한자(contentPoolIds)만 보여줍니다. (사전 모드 제거됨)
    const effectiveIds = useMemo(() => {
        if (contentPoolIds) return contentPoolIds;
        return unlockedIds;
    }, [contentPoolIds, unlockedIds]);

    const unlockedGrades = useMemo(() => {
        const s = new Set(['전체']);
        for (const h of HANJA_DATA) { if (unlockedIds.has(h.id)) s.add(h.grade); }
        return s;
    }, [unlockedIds]);

    const currentItems = useMemo(() => {
        if (hanjaFilter && hanjaFilter.length > 0) return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        return HANJA_DATA
            .filter(h => effectiveIds.has(h.id))
            .sort((a, b) => {
                const aO = CURRICULUM_ORDER.get(a.id) ?? 999999;
                const bO = CURRICULUM_ORDER.get(b.id) ?? 999999;
                return aO - bO;
            });
    }, [hanjaFilter, effectiveIds]);

    const isUnlocked = (item) => hanjaFilter ? true : unlockedIds.has(item.id);

    const handleCardClick = (item) => {
        if (onCardFlip) onCardFlip(item.id);
        setStudyItem(item);
    };

    const handleStudySheetComplete = useCallback((id) => {
        if (id == null) return;
        onStudySheetComplete?.(id);
        const next = new Set(completedStudyIds);
        next.add(id);
        saveCompletedStudyIds(next, currentDay);
        setCompletedStudyIds(next);

        const allDone = currentItems.length > 0 && currentItems.every(h => next.has(h.id));
        if (allDone && !stageClearFiredRef.current) {
            stageClearFiredRef.current = true;
            onStageClear?.();
            setShowAllDoneModal(true);
        }
    }, [completedStudyIds, currentDay, currentItems, onStageClear, onStudySheetComplete]);

    const handleNext = () => {
        if (completing) return;
        if (currentIndex < currentItems.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCompleting(true);
            setTimeout(() => {
                if (onStageClear) onStageClear();
                onBack();
            }, 750);
        }
    };

    return (
        <div className="quiz-screen animate-fade-in">
        {studyItem && !hanjaFilter && (
            <HanjaStudySheet
                item={studyItem}
                onBack={() => setStudyItem(null)}
                onWriteHanja={(h) => { setStudyItem(null); if (onWriteHanja) onWriteHanja(h); }}
                onMarkCorrect={onMarkCorrect}
                onMarkWrong={onMarkWrong}
                onMarkWordWrong={onMarkWordWrong}
                onHanjaAcquired={onHanjaAcquired}
                isAlreadyCompleted={completedStudyIds.has(studyItem.id)}
                onStudySheetComplete={handleStudySheetComplete}
                onQuizXp={(xp) => setTotalQuizXp(prev => prev + xp)}
                selectedCharacter={selectedCharacter}
                getRewardPreview={getRewardPreview}
                characterAvatar={characterAvatar}
            />
        )}
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-2 px-4 mb-3">
                <div className="quiz-header-card quiz-header-card--sm">
                    <button onClick={
                        studyItem || (hanjaFilter && hanjaFilter.length > 0) ? () => setShowExitModal(true) : onBack
                    }
                        className="hp-nav-button">
                        <span>{studyItem || (hanjaFilter && hanjaFilter.length > 0) ? '✕' : '←'}</span>
                    </button>
                    <div className="quiz-header-title-area">
                        <h2 className="quiz-screen-title">한자 학습지</h2>
                        <p className="screen-subtitle">단어장을 보고 문제를 풀며<br />한자를 다양하게 익혀보아요!</p>
                    </div>
                    <div className="quiz-header-right">
                        {(studyItem || (hanjaFilter && hanjaFilter.length > 0)) && (
                            <span className="quiz-counter-text">
                                {hanjaFilter && hanjaFilter.length > 0 ? `${currentIndex + 1}/${currentItems.length}` : '1/1'}
                            </span>
                        )}
                    </div>
                </div>
                {/* 진행 바 */}
                {(studyItem || (hanjaFilter && hanjaFilter.length > 0)) && (
                    <QuizProgressBar
                        current={hanjaFilter && hanjaFilter.length > 0 ? currentIndex : currentItems.length}
                        total={currentItems.length}
                        completing={completing}
                        avatar={characterAvatar}
                        charType={selectedCharacter}
/>
                )}
            </div>

            {/* 본문 컨텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden pt-2">

                {currentItems.length === 0 ? (
                    <div className="flex flex-1 w-full max-w-sm mx-auto flex-col items-center justify-center text-center px-8 pb-16">
                        <div className="w-20 h-20 rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shadow-sm">
                            <span className="hanja-char text-4xl text-[#7C83FF]">學</span>
                        </div>
                        <h3 className="mt-5 text-xl font-medium text-slate-700 dark:text-slate-100">학습할 한자가 아직 없어요</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400 break-keep">오늘의 탐험을 시작하면 배운 한자의 학습지가 이곳에 모여요.</p>
                        <button onClick={onBack} className="mt-6 w-full rounded-2xl bg-[#7C83FF] py-3.5 text-base text-white shadow-sm active:scale-95 transition-transform">
                            탐험으로 돌아가기
                        </button>
                    </div>
                ) : hanjaFilter && hanjaFilter.length > 0 ? (
                    /* ── 학습지 시퀀스 모드 (Daily Journey) ── */
                    <div className="flex-1 overflow-hidden">
                        <HanjaStudySheet
                            key={currentIndex}
                            item={currentItems[currentIndex]}
                            onBack={onBack}
                            onWriteHanja={onWriteHanja}
                            onMarkCorrect={onMarkCorrect}
                            onMarkWrong={onMarkWrong}
                            onMarkWordWrong={onMarkWordWrong}
                            onHanjaAcquired={onHanjaAcquired}
                            isSequence={true}
                            onNext={handleNext}
                            isLast={currentIndex === currentItems.length - 1}
                            isAlreadyCompleted={completedStudyIds.has(currentItems[currentIndex]?.id)}
                            onStudySheetComplete={handleStudySheetComplete}
                            onQuizXp={(xp) => setTotalQuizXp(prev => prev + xp)}
                            selectedCharacter={selectedCharacter}
                            getRewardPreview={getRewardPreview}
                            characterAvatar={characterAvatar}
                        />
                    </div>
                ) : (
                    /* ── 기본 그리드 모드 (학습 센터) ── */
                    <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5 flex-1 min-h-0 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {currentItems.map(item => (
                                <HanjaCard
                                    key={item.id}
                                    item={item}
                                    isLocked={!isUnlocked(item)}
                                    isCompleted={completedStudyIds.has(item.id)}
                                    onClick={() => handleCardClick(item)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {showExitModal && (
                <div className="modal-overlay">
                    <div className="exit-confirm-card">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="img-shadow-sm"
                            style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter)}) scale(${getCharacterScale(selectedCharacter, 'keep_going')})` }}
                        />
                        <div className="exit-confirm-content">
                            <h2 className="exit-confirm-title">
                                정말 학습을 중단할까요?
                            </h2>
                            <p className="body-muted break-keep">
                                지금 나가면 공부 중인 학습지의 진행 상황이 저장되지 않아요. 계속 끝까지 학습해 볼까요?
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="quiz-cta-text">계속 공부하기</span>
                            </CtaButton>
                            <button
                                onClick={handleExitConfirm}
                                className="back-quiz-button"
                            >
                                그만하고 나가기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAllDoneModal && (
                <div className="mobile-center-overlay fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300 overlay-success">
                    <div className="mobile-modal-card w-full max-w-sm flex flex-col items-center rounded-[2.5rem] bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative animate-in zoom-in-95 duration-200">
                        <div className="pt-8 pb-8 px-6 flex flex-col items-center gap-5 w-full">
                            <img
                                src={getCharacterImage(selectedCharacter, 'success')}
                                alt="clear"
                                className="w-44 h-44 object-contain drop-shadow-xl"
                                style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
                            />
                            <div className="text-center flex flex-col gap-1">
                                <span className="result-subtitle">모든 한자를 완료했어요!</span>
                                <h1 className="text-h2-res leading-tight result-title result-title--clear">
                                    {allDoneClearMsg}
                                </h1>
                            </div>
                            <RewardBreakdown
                                reward={getRewardPreview?.(totalQuizXp + 50)}
                                correctXp={totalQuizXp}
                                clearXp={50}
                                correctLabel="학습지"
                                detailText={`${Math.round(totalQuizXp / 5)}개 정답 × 5XP + 완료 50XP`}
                                missionXp={50}
                            />
                            <div className="w-full flex flex-col gap-3">
                                <CtaButton theme="coral" onClick={() => { setShowAllDoneModal(false); onBack(); }}>
                                    <span className="quiz-cta-text">돌아가기</span>
                                </CtaButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashcardScreen;
