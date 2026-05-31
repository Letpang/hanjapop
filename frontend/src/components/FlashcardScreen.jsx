import { useState, useMemo, useCallback, useRef } from 'react';
import { QuizCard } from './WritingScreen.jsx';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import IDIOMS from '../data/idioms.js';
import { usePremium } from '../hooks/usePremium.js';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import RewardBreakdown from './common/RewardBreakdown.jsx';
import CtaButton from './common/CtaButton.jsx';

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

const speakKorean = (text, onEnd) => {
    if (!text || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 0.8;
    utter.pitch = 0.95;
    if (onEnd) utter.onend = onEnd;
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find(v => v.lang.startsWith('ko') && (
        v.name.toLowerCase().includes('yuna') || v.name.toLowerCase().includes('sora') ||
        v.name.toLowerCase().includes('hyerim') || v.name.toLowerCase().includes('heami')
    )) || voices.find(v => v.lang.startsWith('ko'));
    if (koVoice) utter.voice = koVoice;
    window.speechSynthesis.speak(utter);
};

const playCardSound = (item, onEnd) => {
    if (!item) return;
    const playTTS = () => {
        const text = (item.meaning && item.sound) ? (item.meaning + ' ' + item.sound) : (item.sound || '');
        if (text) speakKorean(text, onEnd);
        else if (onEnd) onEnd();
    };
    if (item.id <= 370) {
        const audioId = String(item.id).padStart(item.id < 51 ? 2 : 3, '0');
        const audio = new Audio('/assets/audio/card_' + audioId + '.mp3');
        if (onEnd) audio.onended = onEnd;
        audio.play().catch(() => {
            playTTS();
        });
    } else {
        playTTS();
    }
};

// 4지선다 오답 보기 생성
const pickDistractors = (correctId, field, count = 3) => {
    const correctValue = HANJA_DATA.find(h => h.id === correctId)?.[field];
    const pool = HANJA_DATA.filter(h => h.id !== correctId && h[field] && h[field] !== correctValue);
    return shuffle(pool).slice(0, count).map(h => h[field]);
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

    // Q3~Q5: 역방향 — 뜻 보고 한자어 고르기 (단어마다 1개, 최대 3개)
    const wordPool = (item.words || []).filter(w => w.word && w.meaning);
    const allWords = HANJA_DATA.flatMap(h => h.words || []);
    shuffle(wordPool).slice(0, 3).forEach((w, i) => {
        const revDistractors = shuffle(allWords.filter(x => x.word && x.word !== w.word)).slice(0, 3).map(x => x.word);
        questions.push({
            id: `q_reverse_${i}`,
            type: 'choice',
            prompt: `"${w.meaning}"을 뜻하는 한자어는?`,
            choices: shuffle([w.word, ...revDistractors]),
            answer: w.word,
            word: w.word, reading: w.reading, meaning: w.meaning,
        });
    });

    // 유사어 문제
    const synList = (item.syn || []).filter(h => HANJA_MAP[h]);
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
    const antList = (item.ant || []).filter(h => HANJA_MAP[h]);
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
                <span className="w-8 h-8 rounded-xl bg-[#F4F7F8] flex items-center justify-center text-xs-res font-bold text-[#AEB7C5] border border-[#E9EDF2] uppercase tracking-widest">Q{idx + 1}</span>
                <p className="font-extrabold text-[#3C3C3C] text-h3 tracking-tight break-keep leading-standard">{q.prompt}</p>
            </div>
            <div className={`grid gap-3 ${twoCol ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {q.choices.map((c, i) => {
                    const isWrong = wrongChoices.includes(c);
                    const isRight = isCorrect && c === q.answer;
                    const cls = `quiz-choice-btn ${isRight ? 'quiz-choice-btn--correct' : isWrong ? 'quiz-choice-btn--wrong' : ''}`;

                    return (
                        <button key={i} className={cls} onClick={() => handleSelect(c)}>
                            <span className="break-keep">{c}</span>
                            {isRight && <span className="text-[#7C83FF] shrink-0 ml-2">✓</span>}
                            {isWrong && <span className="text-[#FF8D72] shrink-0 ml-2">✕</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── 풀 학습지 화면 ──────────────────────────────────────────────────────
const HanjaStudySheet = ({ item, onBack, onWriteHanja, onMarkCorrect, onMarkWrong, onMarkWordWrong, onHanjaAcquired, isSequence, onNext, isLast, isAlreadyCompleted = false, onStudySheetComplete, onQuizXp, selectedCharacter, getRewardPreview }) => {
    const questions = useMemo(() => buildWorksheetQuiz(item), [item]);
    const [answers, setAnswers] = useState({});
    const refWords   = useRef(null);
    const refIdioms  = useRef(null);
    const refSynAnt  = useRef(null);
    const refQuiz    = useRef(null);
    const refWriting = useRef(null);
    const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const hasSynAnt = (item.syn && item.syn.length > 0) || (item.ant && item.ant.length > 0);

    const relatedIdioms = useMemo(() => {
        return (item.words || [])
            .filter(w => w.type === 'idiom')
            .map(w => IDIOMS.find(x => x.hanja === w.word))
            .filter(Boolean);
    }, [item]);
    const [quizDone, setQuizDone] = useState(false);
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const completionAwardedRef = useRef(false);
    const completionLabel = isSequence ? (isLast ? '전체 학습 완료하기' : '다음 한자로 이동') : '학습지 완료하기';

    const handleWritingComplete = useCallback((hanjaId, score) => {
        if (onHanjaAcquired) onHanjaAcquired(hanjaId, Math.round(score / 10));
    }, [onHanjaAcquired]);

    // handleWritingNext moved below finishStudySheet to avoid TDZ

    const handleAnswer = (qId, isCorrect) => {
        if (answers[qId] !== undefined) return;
        setAnswers(prev => {
            const next = { ...prev, [qId]: isCorrect };
            if (isCorrect && onHanjaAcquired) {
                onHanjaAcquired(item.id, 5);
                setXpPopup({ show: true, key: Date.now(), amount: 5 });
                setTimeout(() => setXpPopup(p => ({ ...p, show: false })), 1500);
            }
            // 문제별 오답 기록 (QuizItem이 정답 선택 시 1회만 호출 보장)
            if (!isCorrect) {
                const q = questions.find(q => q.id === qId);
                if (q?.word && onMarkWordWrong) {
                    onMarkWordWrong(q.word, item.id, q.reading, q.meaning);
                } else if (onMarkWrong) {
                    onMarkWrong(item.id);
                }
            }
            if (Object.keys(next).length >= questions.length) {
                const correct = Object.values(next).filter(Boolean).length;
                if (correct >= Math.ceil(questions.length * 0.7) && onMarkCorrect) onMarkCorrect(item.id);
            }
            return next;
        });
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
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ backgroundColor: '#F8FAF9' }}>
            <style>{`@keyframes xpFloat{0%{opacity:0;transform:scale(0.6) translateY(16px)}28%{opacity:1;transform:scale(1.1) translateY(-6px)}40%{opacity:1;transform:scale(1) translateY(0)}68%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:translateY(-28px)}}`}</style>
            
            {xpPopup.show && (
                <div key={xpPopup.key} className="fixed inset-0 flex items-center justify-center pointer-events-none z-[999]" style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '120px' }}>
                    <div className="px-7 py-3 rounded-full font-extrabold text-h3 shadow-2xl" style={{ backgroundColor: 'rgba(255,180,51,0.12)', color: '#A07800', border: '2px solid #FFB433' }}>
                        ⭐ +{xpPopup.amount} XP
                    </div>
                </div>
            )}
            {/* 헤더 */}
            <div className="w-full px-4 shrink-0 relative z-50" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '4px' }}>
                <div className="minimal-card-studio w-full flex justify-between items-center p-4 px-6 bg-white border-[#E9EDF2] shadow-xl !rounded-[3rem] min-h-[72px]">
                    <button onClick={onBack} className="hp-nav-button">
                        ←
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">한자 학습지</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>획순대로 써보고 문제를 풀며<br />한자를 다양하게 익혀보아요!</p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            {/* ── 섹션 바로가기 ── */}
            <div className="w-full px-5 pt-4 pb-2 flex items-center justify-center gap-2 flex-wrap">
                {[
                    { label: '관련 단어', ref: refWords, theme: 'warm', show: true },
                    { label: '사자성어', ref: refIdioms, theme: 'purple', show: relatedIdioms.length > 0 },
                    { label: '유사어·반대어', ref: refSynAnt, theme: 'purple', show: hasSynAnt },
                    { label: '문제', ref: refQuiz, theme: 'blue', show: true },
                ].filter(s => s.show).map(({ label, ref, theme }) => (
                    <button
                        key={label}
                        onClick={() => scrollTo(ref)}
                        className={`hp-section-shortcut hp-section-shortcut--${theme}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-32 px-5 pt-4 flex flex-col gap-10 max-w-2xl w-full mx-auto">

                {/* ── 섹션 1: 한자 정보 ── */}
                <div className="minimal-card-studio bg-white border border-[#E9EDF2] shadow-xl px-5 py-3 !rounded-[2rem]">
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-[#3C3C3C] leading-tight drop-shadow-sm text-display" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>{item.hanja}</div>
                        <div className="flex items-baseline gap-4 mt-2">
                            <span className="font-black text-[#7C83FF] text-h2 tracking-tighter">{item.meaning}</span>
                            <span className="font-black text-[#7C83FF] text-h2 tracking-tighter">{item.sound}</span>
                        </div>
                        <button
                            onClick={() => playCardSound(item)}
                            className="mt-3 w-11 h-11 rounded-2xl bg-white border-2 border-[#E9EDF2] flex items-center justify-center active:scale-90 shadow-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#7C83FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
                            </svg>
                        </button>
                    </div>
                    {item.etymology_short && (
                        <div className="mt-6 pt-6 border-t border-[#E9EDF2]">
                            <p className="font-extrabold text-[#3C3C3C] leading-relaxed tracking-tight break-keep text-body">{item.etymology_short}</p>
                        </div>
                    )}
                </div>

                {/* ── 섹션 3: 단어장 ── */}
                {item.words && item.words.length > 0 && (
                    <div ref={refWords} className="flex flex-col gap-5">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FFF8EE' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#C8A882" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="3" width="16" height="18" rx="3" />
                                    <line x1="8" y1="8" x2="16" y2="8" />
                                    <line x1="8" y1="12" x2="14" y2="12" />
                                    <line x1="8" y1="16" x2="12" y2="16" />
                                </svg>
                            </div>
                            <span className="font-extrabold text-h3 uppercase tracking-widest" style={{ color: '#34383F' }}>관련 단어</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {item.words.map((w, i) => (
                                <div key={i} className="flex flex-col" style={{ backgroundColor: '#FCFCFC', border: '1.5px solid #E9EDF2', borderRadius: '28px', padding: '24px 28px' }}>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-extrabold text-body-lg break-keep" style={{ color: '#34383F' }}>{w.word}</span>
                                        <span className="text-sm-res break-keep" style={{ color: '#9AA4B5' }}>({w.reading})</span>
                                    </div>
                                    <span className="text-body break-keep mt-1" style={{ color: '#5B677A' }}>{w.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 섹션 3-2: 사자성어 ── */}
                {relatedIdioms.length > 0 && (
                    <div ref={refIdioms} className="flex flex-col gap-5">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#F4F3FF' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#7C83FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="3" width="16" height="18" rx="3" />
                                    <line x1="8" y1="8" x2="16" y2="8" />
                                    <line x1="8" y1="12" x2="14" y2="12" />
                                    <line x1="8" y1="16" x2="12" y2="16" />
                                </svg>
                            </div>
                            <span className="font-extrabold text-h3 uppercase tracking-widest" style={{ color: '#34383F' }}>사자성어</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {relatedIdioms.map((idiom, i) => (
                                <div key={i} className="flex flex-col" style={{ backgroundColor: '#FCFCFC', border: '1.5px solid #E9EDF2', borderRadius: '28px', padding: '24px 28px' }}>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-extrabold text-body-lg break-keep" style={{ color: '#34383F' }}>{idiom.hanja}</span>
                                        <span className="text-sm-res break-keep" style={{ color: '#9AA4B5' }}>({idiom.reading})</span>
                                    </div>
                                    <span className="text-body break-keep mt-1" style={{ color: '#5B677A' }}>{idiom.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 섹션 3-3: 유사어 · 반대어 ── */}
                {hasSynAnt && (
                    <div ref={refSynAnt} className="flex flex-col gap-5">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#F0EEFF' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#7C83FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="3" width="16" height="18" rx="3" />
                                    <line x1="8" y1="8" x2="16" y2="8" />
                                    <line x1="8" y1="12" x2="14" y2="12" />
                                    <line x1="8" y1="16" x2="12" y2="16" />
                                </svg>
                            </div>
                            <span className="font-extrabold text-h3 uppercase tracking-widest" style={{ color: '#34383F' }}>유사어 · 반대어</span>
                        </div>

                        {item.syn && item.syn.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <span className="font-bold text-sm px-1" style={{ color: '#7C83FF' }}>유사어 — 비슷한 뜻</span>
                                <div className="flex flex-wrap gap-3">
                                    {item.syn.map(h => {
                                        const d = HANJA_MAP[h];
                                        return d ? (
                                            <div key={h} className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: '#F4F3FF', border: '1.5px solid #C3C6FF' }}>
                                                <span className="font-black text-h3" style={{ color: '#7C83FF' }}>{h}</span>
                                                <span className="text-sm font-bold" style={{ color: '#9AA4B5' }}>{d.meaning} {d.sound}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {item.ant && item.ant.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <span className="font-bold text-sm px-1" style={{ color: '#FF8D72' }}>반대어 — 반대 뜻</span>
                                <div className="flex flex-wrap gap-3">
                                    {item.ant.map(h => {
                                        const d = HANJA_MAP[h];
                                        return d ? (
                                            <div key={h} className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: '#FFF3EE', border: '1.5px solid #FFCDB8' }}>
                                                <span className="font-black text-h3" style={{ color: '#FF8D72' }}>{h}</span>
                                                <span className="text-sm font-bold" style={{ color: '#9AA4B5' }}>{d.meaning} {d.sound}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── 섹션 4: 연습 문제 ── */}
                <div ref={refQuiz} className="flex flex-col gap-6">
                    <div className="flex items-center px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#FFF8EE' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#C8A882" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                </svg>
                            </div>
                            <span className="font-extrabold text-h3 uppercase tracking-widest" style={{ color: '#34383F' }}>연습 문제</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-10">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="minimal-card-studio p-5 bg-white border border-[#E9EDF2] shadow-xl !rounded-[3rem]">
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

                    {/* 하단 완료/다음 버튼 */}
                    <div className="flex w-full mt-2">
                        <CtaButton theme="coral" onClick={handleWritingNext}>
                            <span className="font-black text-white text-[1.35rem] drop-shadow-md">{completionLabel}</span>
                        </CtaButton>
                    </div>

                    </div>
                </div>

                {/* 퀴즈 완료 결과 모달 (시퀀스의 마지막에만 노출) */}
                {quizDone && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setQuizDone(false); onNext(); }} />
                        
                        <div className="minimal-card-studio bg-white w-full max-w-md overflow-hidden relative animate-in zoom-in slide-in-from-bottom-8 duration-500 !rounded-[3.5rem] shadow-2xl border-4 border-white">
                            <div className="pt-4 pb-8 px-6 flex flex-col items-center gap-2 w-full relative">
                                {/* 메인 비주얼 */}
                                <img 
                                    src={getCharacterImage(selectedCharacter, 'success')} 
                                    alt="celebration" 
                                    className="w-52 h-52 object-contain drop-shadow-xl mt-4" 
                                />

                                {/* 텍스트 정보 */}
                                <div className="text-center flex flex-col gap-2">
                                    <h1 className="text-h1 font-black text-[#3C3C3C] tracking-tighter break-keep">
                                        모든 한자 학습 완료!
                                    </h1>
                                    
                                    <RewardBreakdown
                                        reward={getRewardPreview?.((Object.values(answers).filter(Boolean).length * 5) + 50)}
                                        correctXp={Object.values(answers).filter(Boolean).length * 5}
                                        clearXp={50}
                                        correctLabel="학습지"
                                        detailText={`${Object.values(answers).filter(Boolean).length}문제 × 5XP + 완료 50XP`}
                                        missionXp={isAlreadyCompleted ? 0 : 50}
                                    />
                                </div>

                                {/* 하단 버튼 */}
                                <div className="w-full flex flex-col gap-3 mt-4">
                                    <CtaButton theme="coral" onClick={() => { setQuizDone(false); onNext(); }}>
                                        <span className="font-black text-white text-[1.35rem] drop-shadow-md">돌아가기</span>
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
            <div className="minimal-card-studio !rounded-3xl relative w-full flex flex-col items-center justify-center p-8 bg-white/40 border-[#E9EDF2] !min-h-[200px] opacity-40 grayscale">
                <span className="text-h1-res opacity-20 mb-3">🔒</span>
                <span className="text-[#5D544F] font-extrabold text-h3-res tracking-tighter uppercase">{item.hanja}</span>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 opacity-30" style={{ backgroundColor: barColor }} />
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className="minimal-card-studio !rounded-3xl group relative w-full flex flex-col items-center justify-center p-5 bg-white border-[#E9EDF2] hover:border-[#7C83FF] hover:shadow-xl hover:shadow-[#C3C6FF]/40 active:scale-95 transition-all duration-300 !min-h-[200px]"
        >
            {isCompleted && (
                <div className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-[#2ED6C5] flex items-center justify-center text-xl font-black text-white shadow-lg shadow-[#2ED6C5]/25 border-[3px] border-white">
                    ✓
                </div>
            )}
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
                <span className="text-h2-res font-extrabold text-[#5D544F] tracking-tighter uppercase">{item.hanja}</span>
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
    const stageClearFiredRef = useRef(false);
    
    // 백업 스타일 싱글 카드 모드용 상태
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleExitConfirm = () => {
        setShowExitModal(false);
        onBack();
    };

    const characterAvatar = useMemo(() => getRankDetails(userXp || 0, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const unlockedIds = useMemo(() => new Set(unlockedHanjaIds || []), [unlockedHanjaIds]);

    const contentPoolIds = useMemo(() => {
        if (!contentPool) return null;
        return new Set([...(contentPool.main?.hanjaIds || []), ...(contentPool.review?.hanjaIds || [])]);
    }, [contentPool]);

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
        setCompletedStudyIds(prev => {
            const next = new Set(prev);
            next.add(id);
            saveCompletedStudyIds(next, currentDay);

            const allDone = currentItems.length > 0 && currentItems.every(h => next.has(h.id));
            if (allDone && !stageClearFiredRef.current) {
                stageClearFiredRef.current = true;
                onStageClear?.();
                setShowAllDoneModal(true);
            }

            return next;
        });
    }, [contentPool, currentItems, onStageClear, onStudySheetComplete]);

    const handleNext = () => {
        if (currentIndex < currentItems.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            if (onStageClear) onStageClear();
            onBack();
        }
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden animate-fade-in" style={{ backgroundColor: '#F7FAF9' }}>
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
            />
        )}
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-5">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={
                        studyItem ? () => setShowExitModal(true) : onBack
                    }
                        className="hp-nav-button">
                        <span>{studyItem ? '✕' : '←'}</span>
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">한자 학습지</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>획순대로 써보고 문제를 풀며<br />한자를 다양하게 익혀보아요!</p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            {/* 본문 컨텐츠 */}
            <div className="flex-1 flex flex-col overflow-hidden pt-2">

                {hanjaFilter && hanjaFilter.length > 0 ? (
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
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300" style={{ background: 'rgba(120, 130, 160, 0.22)' }}>
                    <div className="w-full max-w-sm flex flex-col items-center bg-white shadow-2xl rounded-[40px] p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <img
                            src={getCharacterImage(selectedCharacter, 'keep_going')}
                            alt="exit confirm"
                            className="w-[120px] h-[120px] object-contain mb-4"
                            style={{ filter: 'drop-shadow(0 8px 16px rgba(120,130,160,0.16))' }}
                        />
                        <div className="text-center flex flex-col gap-2 mb-6">
                            <h2 className="text-h3-res font-black text-slate-700 tracking-tight leading-snug">
                                정말 학습을 중단할까요? 🥺
                            </h2>
                            <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                지금 나가면 공부 중인 학습지의 진행 상황이 저장되지 않아요. 계속 끝까지 학습해 볼까요?
                            </p>
                        </div>
                        <div className="w-full flex flex-col gap-3">
                            <CtaButton theme="indigo" onClick={() => setShowExitModal(false)}>
                                <span className="font-black text-white text-[1.35rem] drop-shadow-md">계속 공부하기</span>
                            </CtaButton>
                            <button
                                onClick={handleExitConfirm}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                그만하고 나가기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAllDoneModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-lg animate-in fade-in duration-300" style={{ background: 'linear-gradient(180deg, rgba(221,241,234,0.85) 0%, rgba(234,246,242,0.95) 100%)' }}>
                    <div className="w-full max-w-sm flex flex-col items-center overflow-hidden rounded-[2.5rem] bg-white border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative animate-in zoom-in-95 duration-200">
                        <div className="pt-8 pb-8 px-6 flex flex-col items-center gap-5 w-full">
                            <img
                                src={getCharacterImage(selectedCharacter, 'success')}
                                alt="clear"
                                className="w-44 h-44 object-contain drop-shadow-xl"
                            />
                            <div className="text-center flex flex-col gap-1">
                                <span className="text-sm font-extrabold text-[#AEB7C5]">모든 한자를 완료했어요!</span>
                                <h1 className="text-h2-res font-black leading-tight" style={{ color: '#FF9B73', letterSpacing: '-0.02em' }}>
                                    와우! 참 잘했어요!
                                </h1>
                            </div>
                            <RewardBreakdown
                                reward={getRewardPreview?.(totalQuizXp + 50)}
                                correctXp={totalQuizXp}
                                clearXp={50}
                                correctLabel="학습지"
                                detailText={`${Math.round(totalQuizXp / 5)}문제 × 5XP + 완료 50XP`}
                                missionXp={50}
                            />
                            <div className="w-full flex flex-col gap-3">
                                <CtaButton theme="coral" onClick={() => { setShowAllDoneModal(false); onBack(); }}>
                                    <span className="font-black text-white text-[1.35rem] drop-shadow-md">돌아가기</span>
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
