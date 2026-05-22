import { useState, useMemo } from 'react';
import { SK } from '../constants/storageKeys.js';
import HANJA_DATA from '../hanja_unified.json';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import { useLang } from '../LangContext.jsx';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';

const CATEGORIES = ['숫자와 기초 개념', '자연과 시간', '나와 가족 신체', '공간과 위치', '학교와 일상생활', '행동과 상태', '사회와 문화'];

const CURRICULUM_ORDER = new Map();
DAILY_CURRICULUM.forEach((day, dayIdx) => {
    day.hanja.forEach((h, hIdx) => {
        if (h.id !== null) CURRICULUM_ORDER.set(h.id, dayIdx * 100 + hIdx);
    });
});

const getTotalDays = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(SK.TOTAL_ACTIVITY_STATS) || '{}');
        return saved.totalDays || 1;
    } catch { return 1; }
};

const getLevelTestBonus = () => {
    try { return Number(localStorage.getItem(SK.LEVEL_TEST_BONUS) || '0'); } catch { return 0; }
};

const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const speakKorean = (text, onEnd) => {
    if (!text) return;
    const audioUrl = `/assets/audio/words/word_${encodeURIComponent(text.trim())}.mp3`;
    const audio = new Audio(audioUrl);
    if (onEnd) audio.onended = onEnd;
    audio.play().catch(() => {
        if (!window.speechSynthesis) {
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
        const koVoices = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('ko-KR'));
        if (koVoices.length > 0) {
            const preferred = koVoices.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('yuna') || name.includes('siri') || name.includes('sora') || name.includes('hyerim') || name.includes('hyejin') || name.includes('heami');
            }) || koVoices[0];
            utter.voice = preferred;
        }
        window.speechSynthesis.speak(utter);
    });
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
    const pool = HANJA_DATA.filter(h => h.id !== correctId && h[field]);
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

    // Q3~Q5: 단어 뜻 맞추기 (최대 3개)
    const wordPool = (item.words || []).filter(w => w.word && w.meaning);
    const pickedWords = shuffle(wordPool).slice(0, 3);
    pickedWords.forEach((w, i) => {
        const wDistractors = shuffle(HANJA_DATA.flatMap(h => h.words || []).filter(x => x.meaning && x.meaning !== w.meaning)).slice(0, 3).map(x => x.meaning);
        questions.push({
            id: `q_word_${i}`,
            type: 'choice',
            prompt: `${w.word}(${w.reading})의 뜻은?`,
            choices: shuffle([w.meaning, ...wDistractors]),
            answer: w.meaning,
            word: w.word, reading: w.reading, meaning: w.meaning,
        });
    });

    // Q_last: 역방향 — 뜻 보고 한자 고르기
    if (wordPool.length > 0) {
        const target = wordPool[0];
        const revDistractors = shuffle(HANJA_DATA.flatMap(h => h.words || []).filter(x => x.word && x.word !== target.word)).slice(0, 3).map(x => x.word);
        questions.push({
            id: 'q_reverse',
            type: 'choice',
            prompt: `"${target.meaning}"을 뜻하는 한자어는?`,
            choices: shuffle([target.word, ...revDistractors]),
            answer: target.word,
            word: target.word, reading: target.reading, meaning: target.meaning,
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
                    
                    let cls = 'py-3.5 px-4 rounded-[2rem] font-extrabold text-body-lg border-2 transition-all active:translate-y-[4px] active:border-b-0 text-left flex justify-between items-center leading-standard relative ';

                    if (isRight) {
                        cls += 'bg-[#F2F3FF] border-[#7C83FF] border-b-8 border-b-[#7C83FF] text-[#4F56D9] -translate-y-[4px]';
                    } else if (isWrong) {
                        cls += 'bg-white border-rose-200 border-b-8 border-b-rose-300 text-rose-400 opacity-70 -translate-y-[4px]';
                    } else {
                        cls += 'bg-white border-[#E9EDF2] border-b-8 border-b-slate-200 text-[#5D544F] -translate-y-[4px] hover:border-[#7C83FF]';
                    }

                    return (
                        <button key={i} className={cls} style={{ boxShadow: '0 10px 16px rgba(120,130,160,0.10)' }} onClick={() => handleSelect(c)}>
                            <span className="break-keep">{c}</span>
                            {isRight && <span className="text-[#7C83FF] shrink-0 ml-2">✓</span>}
                            {isWrong && <span className="text-rose-300 shrink-0 ml-2">✕</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── 풀 학습지 화면 ──────────────────────────────────────────────────────
const HanjaStudySheet = ({ item, onBack, onWriteHanja, onMarkCorrect, onMarkWrong, onMarkWordWrong, onHanjaAcquired, isSequence, onNext, isLast, onStudySheetComplete }) => {
    const questions = useMemo(() => buildWorksheetQuiz(item), [item.id]);
    const [answers, setAnswers] = useState({}); // { qId: isCorrect }
    const [quizDone, setQuizDone] = useState(false);
    const [xpPopup, setXpPopup] = useState({ show: false, key: 0, amount: 0 });
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = () => {
        setIsSpeaking(true);
        playCardSound(item, () => setIsSpeaking(false));
    };

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
                setTimeout(() => setQuizDone(true), 400);
            }
            return next;
        });
    };

    const correctCount = Object.values(answers).filter(Boolean).length;
    const totalQ = questions.length;

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
            <div className="w-full px-4 shrink-0 relative z-50" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>
                <div className="minimal-card-studio w-full flex justify-between items-center p-4 px-6 bg-white border-[#E9EDF2] shadow-xl !rounded-[3rem] min-h-[72px]">
                    <button onClick={onBack} className="w-11 h-11 rounded-2xl bg-white border-2 border-[#E9EDF2] flex items-center justify-center font-bold text-body-lg active:scale-90 text-[#AEB7C5] shadow-sm">
                        ←
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">한자 학습지</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>카드를 뒤집어 문제를 풀고 XP를 쌓아보세요</p>
                    </div>
                    <div className="flex items-center justify-end w-11">
                        <span className="text-[#AEB7C5] font-bold text-sm whitespace-nowrap">{correctCount}/{totalQ}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pb-32 px-5 pt-8 flex flex-col gap-10 max-w-2xl w-full mx-auto">

                {/* ── 섹션 1: 한자 정보 ── */}
                <div className="minimal-card-studio bg-white border border-[#E9EDF2] shadow-xl px-5 py-3 !rounded-[2rem]">
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-[#3C3C3C] leading-tight drop-shadow-sm text-display" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>{item.hanja}</div>
                        <div className="flex items-baseline gap-4 mt-2">
                            <span className="font-black text-[#7C83FF] text-h2 tracking-tighter">{item.meaning}</span>
                            <span className="font-black text-[#7C83FF] text-h2 tracking-tighter">{item.sound}</span>
                        </div>
                        <button
                            onClick={handleSpeak}
                            className={`w-12 h-12 mt-2 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-xl border-4 border-white ${isSpeaking ? 'bg-[#7C83FF] text-white' : 'bg-[#F8FAF9] text-slate-200'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
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
                    <div className="flex flex-col gap-5">
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

                {/* ── 섹션 4: 연습 문제 ── */}
                <div className="flex flex-col gap-6">
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
                                    twoCol={!q.id.startsWith('q_word_')}
                                />
                            </div>
                        ))}
                    </div>

                    {/* 퀴즈 완료 결과 모달 */}
                    {quizDone && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onBack} />
                            
                            <div className="minimal-card-studio bg-white w-full max-w-md overflow-hidden relative animate-in zoom-in slide-in-from-bottom-8 duration-500 !rounded-[3.5rem] shadow-2xl border-4 border-white">
                                <div className="pt-4 pb-8 px-6 flex flex-col items-center gap-2 w-full relative">
                                    
                                    {/* 상단 장식 아이콘 제거됨 */}

                                    {/* 메인 비주얼 */}
                                    <img 
                                        src={getCharacterImage(selectedCharacter, 'success')} 
                                        alt="celebration" 
                                        className="w-52 h-52 object-contain drop-shadow-xl mt-4" 
                                    />

                                    {/* 텍스트 정보 */}
                                    <div className="text-center flex flex-col gap-2">
                                        <span className="text-xs-res font-extrabold text-[#AEB7C5] uppercase tracking-widest">
                                            {correctCount >= Math.ceil(totalQ * 0.7) ? '정말 멋진 결과예요!' : '조금만 더 힘내볼까요?'}
                                        </span>
                                        <h1 className="text-h1 font-black text-[#3C3C3C] tracking-tighter">
                                            {correctCount} / {totalQ} 맞춤!
                                        </h1>
                                        
                                        {/* 획득 경험치 표시 */}
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <div className="px-6 py-2 rounded-full bg-[#FFB433]/10 border-2 border-[#FFB433]/15 flex items-center gap-2 shadow-sm">
                                                <span className="text-xl">⭐</span>
                                                <span className="text-body-lg font-black text-[#FFB433]">+{correctCount * 5} XP 획득</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 하단 버튼 */}
                                    <div className="w-full flex flex-col gap-3 mt-4">
                                        {isSequence && (
                                            <button
                                                onClick={() => { onStudySheetComplete?.(item.id); onNext(); }}
                                                className="w-full py-5 rounded-[2rem] bg-[#7C83FF] text-white font-extrabold text-body-lg shadow-xl shadow-[#C3C6FF] active:scale-95 transition-all border-b-4 border-[#4A51D4]"
                                            >
                                                {isLast ? '전체 학습 완료! →' : '다음 한자로 →'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { onStudySheetComplete?.(item.id); onBack(); }}
                                            className="w-full py-5 rounded-[2rem] bg-[#F8FAF9] text-[#AEB7C5] font-extrabold text-body-lg active:scale-95 transition-all border-b-4 border-[#E9EDF2]"
                                        >
                                            학습 종료하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
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
const HanjaCard = ({ item, isLocked, onClick }) => {
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
            className="minimal-card-studio !rounded-3xl group relative w-full flex flex-col items-center justify-center p-8 bg-white border-[#E9EDF2] hover:border-[#7C83FF] hover:shadow-xl hover:shadow-[#C3C6FF]/40 active:scale-95 transition-all duration-300 !min-h-[200px]"
        >
            <div className="w-20 h-20 mb-4 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
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
                    className="w-[80%] h-[80%] object-contain relative z-20 drop-shadow-sm"
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
const Flashcard = ({ item, onFlip, shouldBlink }) => {
    const { t } = useLang();
    const [flipped, setFlipped] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleFlip = () => {
        const nextFlipped = !flipped;
        setFlipped(nextFlipped);
        if (nextFlipped) {
            if (onFlip) onFlip(item.id);
            playCardSound(item);
        }
    };

    const handleSpeak = (e) => {
        e.stopPropagation();
        setIsSpeaking(true);
        playCardSound(item, () => setIsSpeaking(false));
    };

    return (
        <div className="w-full max-w-[320px] mx-auto h-full min-h-[260px] max-h-[400px] relative flashcard-perspective group" onClick={handleFlip}>
            <div className={`relative w-full h-full transition-all duration-700 flashcard-preserve-3d ${flipped ? 'flashcard-face-back' : ''}`}>
                
                {/* ── FRONT ── */}
                <div className="absolute inset-0 flashcard-backface-hidden flashcard-face-front bg-white rounded-[3rem] border-[6px] border-white shadow-2xl flex flex-col items-center px-6 pt-10 pb-10 overflow-hidden">

                    {/* 이미지 영역 — 카드 상단 40px 아래서 시작, 남은 공간 채움 */}
                    <div className="w-full flex-1 min-h-0 flex items-center justify-center px-2 relative">
                        <div className="absolute inset-0 bg-[#F8FAF9] rounded-[1.5rem] opacity-40 shadow-inner" />
                        <img
                            src={`/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.webp`}
                            onError={e => {
                                if (e.target.src.endsWith('.webp')) e.target.src = `/assets/images/hanja_all/${item.id}_${encodeURIComponent(item.hanja)}.svg`;
                                else e.target.src = '/assets/images/hanja_placeholder.webp';
                            }}
                            className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500"
                            alt={item.hanja}
                        />
                    </div>

                    {/* 이미지 → 한자: 48px */}
                    <div className="h-12 shrink-0" />

                    {/* 한자 */}
                    <span className="text-display-res font-extrabold text-[#5D544F] tracking-tighter drop-shadow-sm shrink-0 leading-none">{item.hanja}</span>

                    {/* 한자 → TAP TO LEARN: 24px */}
                    <div className="h-6 shrink-0" />

                    {/* TAP TO LEARN — 카드 하단 40px 위에서 끝 */}
                    <span className={`text-xs-res font-extrabold uppercase tracking-[0.2em] shrink-0 transition-all ${shouldBlink ? 'text-rose-500' : 'text-[#4A51D4]'}`}>
                        {t('tapToLearn')}
                    </span>

                </div>

                {/* ── BACK ── */}
                <div className="absolute inset-0 flashcard-backface-hidden flashcard-face-back bg-[#F5F3FF] rounded-[3rem] border-[6px] border-white shadow-2xl flex flex-col items-center justify-center p-10 gap-2 overflow-hidden">
                    <span className="text-h3-res font-extrabold text-[#AEB7C5] tracking-tighter uppercase mb-2">{item.hanja}</span>
                    <div className="w-12 h-1 bg-[#C3C6FF]/50 rounded-full mb-6" />
                    <span className="text-h1-res font-extrabold text-[#4A51D4] tracking-tight uppercase drop-shadow-sm break-keep">{item.sound}</span>
                    <span className="text-h3-res font-extrabold text-[#5B677A] tracking-tight uppercase text-center break-keep">{item.meaning}</span>
                    
                    <button
                        onClick={handleSpeak}
                        className={`w-12 h-12 mt-6 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-xl border-4 border-white ${isSpeaking ? 'bg-[#7C83FF] text-white' : 'bg-[#F8FAF9] text-slate-200'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

// ─── 메인 FlashcardScreen ──────────────────────────────────────────────────
const FlashcardScreen = ({ onBack, onCardFlip, onWriteHanja, onMarkCorrect, onMarkWrong, onMarkWordWrong, hanjaFilter, onStageClear, unlockedHanjaIds, onHanjaAcquired, userXp, selectedCharacter, onStudySheetComplete }) => {
    const { t } = useLang();
    const [viewMode, setViewMode] = useState('grade');
    const [gradeFilter, setGradeFilter] = useState('8급');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORIES[0] || '');
    const [phase, setPhase] = useState(hanjaFilter ? 'list' : 'select');
    const [studyItem, setStudyItem] = useState(null); // 학습지 열린 한자
    const [showExitModal, setShowExitModal] = useState(false);
    
    // 백업 스타일 싱글 카드 모드용 상태
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [hasFlipped, setHasFlipped] = useState(false);
    const [shouldBlink, setShouldBlink] = useState(false);

    const handleExitConfirm = () => {
        setShowExitModal(false);
        if (phase === 'list' && !hanjaFilter) {
            setPhase('select');
        } else {
            onBack();
        }
    };

    const characterAvatar = useMemo(() => getRankDetails(userXp || 0, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const totalDays = getTotalDays();
    const bonus = getLevelTestBonus();

    const unlockedIds = useMemo(() => {
        if (unlockedHanjaIds && unlockedHanjaIds.length > 0) {
            return new Set(unlockedHanjaIds);
        }
        const ids = new Set();
        for (let i = 0; i < Math.min(totalDays, DAILY_CURRICULUM.length); i++) {
            for (const h of DAILY_CURRICULUM[i].hanja) {
                if (h.id !== null) ids.add(h.id);
            }
        }
        if (bonus > 0) {
            const sorted = [...HANJA_DATA].sort((a, b) => a.id - b.id);
            for (let i = 0; i < Math.min(bonus, sorted.length); i++) ids.add(sorted[i].id);
        }
        return ids;
    }, [totalDays, bonus, unlockedHanjaIds]);

    const unlockedGrades = useMemo(() => {
        const s = new Set(['전체']);
        for (const h of HANJA_DATA) { if (unlockedIds.has(h.id)) s.add(h.grade); }
        return s;
    }, [unlockedIds]);

    const categories = useMemo(() => {
        const cats = [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))];
        // Define visual properties for categories
        const metadata = {
            '자연': { icon: '🌱', color: '#10b981' },
            '사람': { icon: '👤', color: '#7C83FF' },
            '숫자': { icon: '🔢', color: '#FFB433' },
            '방향': { icon: '🧭', color: '#ec4899' },
            '크기': { icon: '📏', color: '#8b5cf6' },
            '기타': { icon: '✨', color: '#94a3b8' },
        };
        return cats.map(name => ({
            name,
            ...(metadata[name] || metadata['기타']),
            total: HANJA_DATA.filter(h => h.category === name).length,
            unlocked: HANJA_DATA.filter(h => h.category === name && unlockedIds.has(h.id)).length
        }));
    }, [unlockedIds]);

    const currentItems = useMemo(() => {
        if (hanjaFilter && hanjaFilter.length > 0) return HANJA_DATA.filter(h => hanjaFilter.includes(h.id));
        let items;
        if (viewMode === 'grade') {
            items = gradeFilter === '전체' ? HANJA_DATA : HANJA_DATA.filter(h => h.grade === gradeFilter);
        } else {
            items = HANJA_DATA.filter(h => h.category === categoryFilter);
        }
        return [...items].sort((a, b) => {
            const aU = unlockedIds.has(a.id);
            const bU = unlockedIds.has(b.id);
            if (aU !== bU) return aU ? -1 : 1;
            const aO = CURRICULUM_ORDER.get(a.id) ?? 999999;
            const bO = CURRICULUM_ORDER.get(b.id) ?? 999999;
            return aO - bO;
        });
    }, [viewMode, gradeFilter, categoryFilter, hanjaFilter, unlockedIds]);

    const isUnlocked = (item) => hanjaFilter ? true : unlockedIds.has(item.id);

    const handleCardClick = (item) => {
        if (onCardFlip) onCardFlip(item.id);
        setStudyItem(item);
    };

    const handleNext = () => {
        if (!hasFlipped && hanjaFilter) {
            setShouldBlink(true);
            setTimeout(() => setShouldBlink(false), 1400);
            return;
        }
        if (currentIndex < currentItems.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setHasFlipped(false);
                setIsTransitioning(false);
            }, 300);
        } else if (onStageClear) {
            onStageClear();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => prev - 1);
                setHasFlipped(false);
                setIsTransitioning(false);
            }, 300);
        }
    };

    const unlockedInView = currentItems.filter(isUnlocked).length;

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
                onStudySheetComplete={onStudySheetComplete}
            />
        )}
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-5">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={(phase === 'list' || (hanjaFilter && hanjaFilter.length > 0)) ? () => setShowExitModal(true) : onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-black text-[#5B677A]">
                        <span>{(phase === 'list' || (hanjaFilter && hanjaFilter.length > 0)) ? '✕' : '←'}</span>
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">한자 학습지</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>카드를 뒤집어 문제를 풀고 XP를 쌓아보세요</p>
                    </div>
                    <div className="flex items-center justify-end w-11">
                        {hanjaFilter && (
                            <span className="text-[#7C83FF] opacity-60 text-sm font-bold whitespace-nowrap">{currentIndex + 1}/{currentItems.length}</span>
                        )}
                    </div>
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
                            onStudySheetComplete={onStudySheetComplete}
                        />
                    </div>
                ) : (
                    /* ── 기본 그리드 모드 (학습 센터) ── */
                    <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5 flex-1 min-h-0 overflow-y-auto">
                        {phase === 'select' && (
                            <div className="flex flex-col items-center w-full animate-in fade-in duration-500 pb-10">
                                {/* 탭 */}
                                <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-8 shadow-inner">
                                    <button onClick={() => setViewMode('grade')}
                                        className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#5B677A]'}`}>
                                        급수별
                                    </button>
                                    <button onClick={() => setViewMode('topic')}
                                        className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#5B677A]'}`}>
                                        주제별
                                    </button>
                                </div>

                                {/* 컨텐츠 */}
                                {viewMode === 'grade' ? (
                                    <GradeGrid selected={gradeFilter} onSelect={setGradeFilter} lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))} />
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        {CATEGORIES.map(cat => (
                                            <TopicCard key={cat} name={cat} imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                                count={`${HANJA_DATA.filter(h => h.category === cat).length}개`} isSelected={categoryFilter === cat} onClick={() => setCategoryFilter(cat)}
                                                locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))} />
                                        ))}
                                    </div>
                                )}

                                {/* 캐릭터 */}
                                <div className="flex flex-col items-center mt-10 mb-6 relative">
                                    <div className="absolute top-4 left-[60%] z-20">
                                        <div className="px-5 py-2 rounded-2xl shadow-xl border border-white relative bg-white/90 backdrop-blur-md">
                                            <span className="text-body font-bold text-[#5B677A] whitespace-nowrap break-keep">준비됐어!</span>
                                            <div className="absolute -bottom-1.5 left-3 w-4 h-4 rotate-45 bg-white border-r border-b border-white" />
                                        </div>
                                    </div>
                                    <div className="relative z-10 w-36 h-36 flex items-center justify-center mt-10">
                                        <img src={characterAvatar} className="w-full h-full object-contain drop-shadow-2xl" alt="avatar" />
                                    </div>
                                    <div className="w-40 h-4 bg-slate-400/20 blur-lg rounded-[100%] scale-x-125 -mt-6" />
                                </div>

                                {/* 시작 버튼 */}
                                <div className="w-full max-w-sm px-4 pb-4 mt-2">
                                    <button onClick={() => setPhase('list')}
                                        className="w-full py-5 rounded-[2rem] font-bold text-h3 text-white transition-all active:scale-95 shadow-xl shadow-[#FF9B73]/20/50 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                                        style={{ backgroundColor: '#FF9B73', borderBottom: '6px solid #E0735A' }}>
                                        <span>공부 시작!</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {phase === 'list' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {currentItems.map(item => (
                                    <HanjaCard key={item.id} item={item} isLocked={!isUnlocked(item)} onClick={() => handleCardClick(item)} />
                                ))}
                            </div>
                        )}
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
                            <button
                                onClick={() => setShowExitModal(false)}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                            >
                                계속 공부하기
                            </button>
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
        </div>
    );
};

export default FlashcardScreen;