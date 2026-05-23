import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HANJA_DATA from '../hanja_unified.json';
import { useLang } from '../LangContext.jsx';
import GradeGrid, { TopicCard } from './GradeGrid.jsx';
import { getRankDetails, getCharacterImage } from '../utils/rankUtils.js';
import { buildSessionPlan, buildHanjaStage, getSRSWeightedPool } from '../utils/learningPool.js';
import { GRADES, CATEGORY_IMAGES } from '../constants/hanjaConstants.js';
import { useUnlockedHanja } from '../hooks/useUnlockedHanja.js';
import { playSound } from '../utils/playSound.js';

const wordReadingMap = {};
HANJA_DATA.forEach(h => {
    (h.words || []).forEach(w => {
        if (w.word && w.reading) wordReadingMap[w.word] = w.reading;
    });
});

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

const SentenceQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onMarkWordWrong, onWordCorrect, onStageClear, onWordSeen, onGoToReview, srsData, masteryData, userLevel, userXp, selectedCharacter, contentPool, unlockedHanjaIds, currentDayHanjaIds, seenHanjaIds, mainSeenHanjaIds, seenWordIds }) => {
    const { t } = useLang();

    // ── 선택 상태 ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grade'); // 'grade' | 'topic'
    const categories = useMemo(() => [...new Set(HANJA_DATA.map(h => h.category).filter(Boolean))], []);

    const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');
    const [selectedGrade, setSelectedGrade] = useState('전체');

    const characterAvatar = useMemo(() => getRankDetails(userXp, selectedCharacter).avatar, [userXp, selectedCharacter]);

    const { unlockedIds, unlockedGrades } = useUnlockedHanja(unlockedHanjaIds);

    // ── 퀴즈 진행 상태 ────────────────────────────────────────────────────
    const [started, setStarted] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const handleExitConfirm = () => {
        setShowExitModal(false);
        if (contentPool) {
            onBack();
        } else {
            setStarted(false);
        }
    };
    const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'feedback' | 'result'
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0); // stale 클로저 방지: handleNext에서 항상 최신값 사용
    const [totalAnswered, setTotalAnswered] = useState(0);
    const totalAnsweredRef = useRef(0); // stale 클로저 방지
    const [wrongAttempts, setWrongAttempts] = useState([]);
    const wrongMarkedRef = useRef(false); // 문제당 오답 기록 최초 1회만
    const [isCorrectSelected, setIsCorrectSelected] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [combo, setCombo] = useState(0);
    const [showXPPopup, setShowXPPopup] = useState(false);
    const [popupCombo, setPopupCombo] = useState(1);
    const [xpAnimKey, setXpAnimKey] = useState(0);
    const [isWordCardFlipped, setIsWordCardFlipped] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const stageClearArgsRef = useRef(null); // 결과 화면 표시 후 "돌아가기" 시점에 onStageClear로 전달할 데이터
    const shownWordsRef = useRef([]); // 이번 세션에서 출제된 단어 목록

    // ── 현재 선택된 한자 풀 ────────────────────────────────────────────────
    const activeHanjaSet = useMemo(() => {
        if (contentPool) {
            const allIds = new Set([...(contentPool.main?.hanjaIds || []), ...(contentPool.review?.hanjaIds || [])]);
            return HANJA_DATA.filter(h => allIds.has(h.id));
        }
        if (viewMode === 'grade') {
            if (selectedGrade === '전체') return HANJA_DATA.filter(h => unlockedIds.has(h.id));
            if (selectedGrade === '기타') return HANJA_DATA.filter(h => (!h.grade || h.grade === '' || h.grade === '기타' || h.grade === 'NON') && unlockedIds.has(h.id));
            return HANJA_DATA.filter(h => h.grade === selectedGrade && unlockedIds.has(h.id));
        }
        return HANJA_DATA.filter(h => h.category === selectedCategory && unlockedIds.has(h.id));
    }, [viewMode, selectedGrade, selectedCategory, contentPool, unlockedIds]);

    const reviewQueueRef = useRef([]);
    const normalQueueRef = useRef([]);
    const lastHanjaIdRef = useRef(null);
    const queuesReadyRef = useRef(false);

    const sessionPlan = useMemo(() => {
        const base = activeHanjaSet.filter(h => h.words && h.words.length > 0);
        return buildSessionPlan(base, srsData, masteryData, contentPool ? null : currentDayHanjaIds, seenHanjaIds?.length > 0 ? seenHanjaIds : null);
        // 큐는 여기서 초기화하지 않음 — srsData/masteryData 변경마다 리셋되는 버그 방지
    }, [activeHanjaSet, srsData, masteryData, userLevel, contentPool, currentDayHanjaIds]);

    // 메인화면 모드: 미출제 오늘 한자 7개 + SRS 복습 3개 = 10문제 고정 큐
    const buildMainQueue10 = () => {
        if (!currentDayHanjaIds?.length) return null;
        const seenSet = new Set(mainSeenHanjaIds || []);
        const todaySet = new Set(currentDayHanjaIds);
        const srsSeenIds = new Set(Object.keys(srsData || {}).map(Number));
        const withWords = activeHanjaSet.filter(h => h.words?.length > 0);

        const todayHanja = withWords.filter(h => todaySet.has(h.id));
        const unseenToday = todayHanja.filter(h => !seenSet.has(h.id)).sort(() => Math.random() - 0.5);
        const seenToday = todayHanja.filter(h => seenSet.has(h.id)).sort(() => Math.random() - 0.5);
        const todayPicked = [...unseenToday, ...seenToday].slice(0, 7);

        const srsHanja = withWords.filter(h => srsSeenIds.has(h.id) && !todaySet.has(h.id));
        const srsPicked = getSRSWeightedPool(srsHanja, srsData, masteryData, userLevel, 3);

        return [...todayPicked, ...srsPicked];
    };

    const initQueues = useCallback((overridePlan) => {
        const plan = overridePlan || sessionPlan;
        reviewQueueRef.current = [...plan.reviewQueue];
        normalQueueRef.current = [...plan.normalPool].sort(() => 0.5 - Math.random());
        lastHanjaIdRef.current = null;
        queuesReadyRef.current = true;
    }, [sessionPlan]);

    const initQueuesRef = useRef(null);
    useEffect(() => { initQueuesRef.current = initQueues; });
    const startQuizRef = useRef(null);
    useEffect(() => { startQuizRef.current = startQuiz; });
    useEffect(() => {
        if (contentPool != null && gameState !== 'playing' && gameState !== 'result') {
            startQuizRef.current?.();
        }
    }, [contentPool]);

    const pickNextFromPool = useCallback(() => {
        if (normalQueueRef.current.length === 0) return null;
        const next = normalQueueRef.current.shift();
        lastHanjaIdRef.current = next?.id ?? null;
        return next;
    }, []);

    // ── 문제 생성 ──────────────────────────────────────────────────────────
    const generateQuiz = useCallback(() => {
        if (activeHanjaSet.length === 0) return;

        const hasWordPool = sessionPlan.normalPool.length > 0 || reviewQueueRef.current.length > 0;

        if (!hasWordPool) {
            // 단어 없는 경우 단순 한자 뜻/음 퀴즈
            const randomHanja = activeHanjaSet[Math.floor(Math.random() * activeHanjaSet.length)];
            const correct = randomHanja.meaning + ' ' + randomHanja.sound;
            const distractors = HANJA_DATA.filter(h => h.id !== randomHanja.id)
                .sort(() => 0.5 - Math.random()).slice(0, 3).map(h => h.meaning + ' ' + h.sound);
            setCurrentQuiz({ type: 'simple', char: randomHanja.hanja, answer: correct, meaning: randomHanja.meaning, sound: randomHanja.sound, _hanjaId: randomHanja.id });
            setOptions([...distractors, correct].sort(() => 0.5 - Math.random()));
        } else {
            // 복습 큐 우선 소진, 이후 셔플 큐에서 순환
            let selectedHanja;
            if (reviewQueueRef.current.length > 0) {
                selectedHanja = reviewQueueRef.current.shift();
                lastHanjaIdRef.current = selectedHanja?.id ?? null;
            } else {
                selectedHanja = pickNextFromPool();
            }
            if (!selectedHanja) {
                stageClearArgsRef.current = [scoreRef.current, totalAnsweredRef.current, [...shownWordsRef.current]];
                setGameState('result');
                return;
            }
            const validWords = selectedHanja.words.filter(w => w.word && w.meaning);
            const seenSet = seenWordIds?.length > 0 ? new Set(seenWordIds) : null;
            const allWordsSeen = seenSet && validWords.every(w => seenSet.has(w.id));
            const wordPool = (!seenSet || allWordsSeen) ? validWords : validWords.filter(w => !seenSet.has(w.id));
            const targetWord = wordPool[Math.floor(Math.random() * wordPool.length)] ?? validWords[0];
            if (targetWord?.id != null && !shownWordsRef.current.includes(targetWord.id)) {
                shownWordsRef.current = [...shownWordsRef.current, targetWord.id];
                onWordSeen?.(targetWord.id);
            }
            const allWords = HANJA_DATA.flatMap(h => (h.words || []).map(w => w.word));
            const distractors = [];
            while (distractors.length < 3) {
                const rw = allWords[Math.floor(Math.random() * allWords.length)];
                if (rw !== targetWord.word && !distractors.includes(rw)) distractors.push(rw);
            }
            setCurrentQuiz({ type: 'sentence', char: selectedHanja.hanja, target: targetWord, sentence: targetWord.example || `다음 한자어 '${targetWord.word}'의 뜻은?`, _hanjaId: selectedHanja.id });
            setOptions([...distractors, targetWord.word].sort(() => 0.5 - Math.random()));
        }
        setFeedback(null);
        setGameState('playing');
    }, [sessionPlan, activeHanjaSet, pickNextFromPool]);

    // 퀴즈 시작
    const startQuiz = (overridePlan) => {
        let plan = overridePlan;
        if (!plan) {
            if (contentPool) {
                const base = activeHanjaSet.filter(h => h.words?.length > 0);
                const stage = buildHanjaStage(contentPool, base, srsData, masteryData, seenHanjaIds || [], 10);
                if (stage.length > 0) {
                    // stage가 10개 미만이면 normalPool에 재활용 아이템으로 채워 항상 10문제 보장
                    const extras = [];
                    let i = 0;
                    while (stage.length + extras.length < 10) {
                        extras.push(stage[i % stage.length]);
                        i++;
                    }
                    plan = { reviewQueue: [...stage], normalPool: extras };
                }
            } else if (currentDayHanjaIds?.length > 0) {
                const queue = buildMainQueue10();
                if (queue?.length > 0) plan = { reviewQueue: queue, normalPool: [] };
            }
        }
        initQueues(plan);
        shownWordsRef.current = [];
        setScore(0); scoreRef.current = 0;
        setTotalAnswered(0); totalAnsweredRef.current = 0;
        setCombo(0);
        setCurrentQuiz(null); setFeedback(null);
        setStarted(true);
        setGameState('playing');
    };

    useEffect(() => {
        if (started && gameState === 'playing' && !currentQuiz) {
            generateQuiz();
        }
    }, [started, gameState, currentQuiz, generateQuiz]);

    const handleAnswer = (selected) => {
        if (gameState !== 'playing' || !currentQuiz || isCorrectSelected || wrongAttempts.includes(selected)) return;

        const correctAnswer = currentQuiz.type === 'sentence'
            ? currentQuiz.target.word
            : currentQuiz.answer;
        const isCorrect = selected === correctAnswer;

        if (isCorrect) {
            const newCombo = combo + 1;
            setIsCorrectSelected(true);
            setFeedback({ isCorrect: true, selected });
            totalAnsweredRef.current += 1;
            setTotalAnswered(totalAnsweredRef.current);
            scoreRef.current += 1;
            setScore(scoreRef.current);
            setCombo(newCombo);
            setPopupCombo(newCombo);
            if (onHanjaAcquired) {
                setShowXPPopup(false);
                setTimeout(() => {
                    setShowXPPopup(true);
                    setXpAnimKey(k => k + 1);
                    setTimeout(() => setShowXPPopup(false), 1500);
                }, 0);
                onHanjaAcquired(null, 10);
            }
            playSound('correct');
            const hanjaId = currentQuiz._hanjaId || null;
            if (onMarkCorrect && hanjaId) onMarkCorrect(hanjaId);
            if (currentQuiz.type === 'sentence' && currentQuiz.target?.id != null) onWordCorrect?.(currentQuiz.target.id);
            setGameState('feedback');
        } else {
            setWrongAttempts(prev => [...prev, selected]);
            setCombo(0); playSound('wrong');
            if (!wrongMarkedRef.current) {
                wrongMarkedRef.current = true;
                const hanjaId = currentQuiz._hanjaId || null;
                if (currentQuiz.type === 'sentence' && onMarkWordWrong && currentQuiz.target) {
                    onMarkWordWrong(currentQuiz.target.id, hanjaId, currentQuiz.target.reading, currentQuiz.target.meaning, currentQuiz.target.word);
                } else if (onMarkWrong && hanjaId) {
                    onMarkWrong(hanjaId);
                }
            }
        }
    };

    const handleNext = () => {
        window.speechSynthesis?.cancel();
        setIsWordCardFlipped(false);
        setIsSpeaking(false);
        const poolExhausted = reviewQueueRef.current.length === 0 && normalQueueRef.current.length === 0;
        if (totalAnsweredRef.current >= 10 || poolExhausted) {
            stageClearArgsRef.current = [scoreRef.current, totalAnsweredRef.current, [...shownWordsRef.current]];
            setGameState('result');
        } else {
            wrongMarkedRef.current = false;
            generateQuiz();
            setWrongAttempts([]);
            setIsCorrectSelected(false);
            setFeedback(null);
        }
    };

    const handleSpeak = (e) => {
        e?.stopPropagation();
        const reading = currentQuiz?.target ? wordReadingMap[currentQuiz.target.word] || currentQuiz.target.reading || currentQuiz.target.word : '';
        if (!reading) return;
        setIsSpeaking(true);
        speakKorean(reading, () => setIsSpeaking(false));
    };

    // ── 결과 화면 ──────────────────────────────────────────────────────────
    if (started && gameState === 'result') {
        const isClear = score >= 10 * 0.7;
        const wrongCount = 10 - score;

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300"
                style={{ background: isClear ? 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' : 'linear-gradient(180deg, #FDEAEA 0%, #FFF0F0 100%)' }}
            >
                <div className="w-full max-w-sm flex flex-col items-center result-card-container overflow-hidden">
                    <div className="pt-6 pb-10 px-6 flex flex-col items-center gap-7 w-full relative">

                        {/* 캐릭터 아래 백그라운드 글로우 추가 */}
                        <div className="absolute top-[28px] w-[140px] h-[140px] rounded-full blur-xl z-0" style={{ backgroundColor: 'rgba(255,255,255,0.65)' }} />

                        {/* 아이콘 */}
                        <img
                            src={isClear ? getCharacterImage(selectedCharacter, 'success') : getCharacterImage(selectedCharacter, 'failure')}
                            alt={isClear ? "clear" : "fail"}
                            className="w-[176px] h-[176px] object-contain relative z-10 mt-4"
                            style={{ filter: 'drop-shadow(0 12px 24px rgba(120,130,160,0.16))' }}
                        />

                        {/* 텍스트 */}
                        <div className="text-center flex flex-col gap-2 relative z-10 -mt-5">
                            <span className="text-xs-res font-extrabold text-[#AEB7C5]">
                                {isClear ? '정말 멋진 결과예요!' : '아쉬운 결과네요...'}
                            </span>
                            <h1 className="text-h2-res font-black leading-snug" style={{
                                color: isClear ? '#FF9B73' : '#FF6B6B',
                                letterSpacing: '-0.5px',
                                textShadow: isClear ? '0 2px 10px rgba(255,160,120,0.16)' : 'none'
                            }}>
                                {isClear ? '와우! 참 잘했어요!' : <>괜찮아요,<br />다시 도전해봐요!</>}
                            </h1>
                            <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                {isClear
                                    ? <>총 10문제 중 {score}문제를 맞혔어요!<span className="text-[0.85em] inline-block ml-1">🔥</span></>
                                    : '조금만 더 노력하면 성공할 수 있어요!'}
                            </p>
                        </div>

                        {/* 버튼 2단 */}
                        <div className="w-full flex flex-col gap-3 relative z-10">
                            <button
                                onClick={() => { setCurrentQuiz(null); setScore(0); setTotalAnswered(0); setCombo(0); setGameState('playing'); }}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg retry-quiz-button"
                            >
                                다시 풀기
                            </button>
                            <button
                                onClick={() => {
                                    if (stageClearArgsRef.current) {
                                        onStageClear?.(...stageClearArgsRef.current);
                                        stageClearArgsRef.current = null;
                                    }
                                    onBack();
                                }}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-body-lg active:scale-95 transition-all shadow-sm back-quiz-button"
                            >
                                돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── 퀴즈 진행 화면 ────────────────────────────────────────────────────
    if (started && currentQuiz) {
        const currentAnswer = currentQuiz?.type === 'sentence' ? currentQuiz?.target?.word : currentQuiz?.answer;
        const word = currentQuiz?.target?.word || '';
        const reading = wordReadingMap[word] || currentQuiz?.target?.reading || word;
        const meaning = currentQuiz?.target?.meaning || '';

        return (
            <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F8FAF9' }}>
                <style>{`
                    @keyframes xpFloat {
                        0%   { opacity: 0; transform: scale(0.6) translateY(16px); }
                        28%  { opacity: 1; transform: scale(1.1) translateY(-6px); }
                        40%  { opacity: 1; transform: scale(1) translateY(0); }
                        68%  { opacity: 1; transform: scale(1) translateY(0); }
                        100% { opacity: 0; transform: translateY(-28px); }
                    }
                `}</style>

                {/* XP 팝업 오버레이 */}
                {showXPPopup && (
                    <div
                        key={xpAnimKey}
                        className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]"
                        style={{ animation: 'xpFloat 1.5s ease-in-out forwards', paddingBottom: '120px' }}
                    >
                        <div className="flex flex-col items-center gap-2">
                            {popupCombo > 1 && (
                                <div
                                    className="px-4 py-1.5 rounded-full font-extrabold text-white text-sm"
                                    style={{ backgroundColor: '#4A51D4', boxShadow: '0 4px 12px rgba(74,81,212,0.45)' }}
                                >
                                    🔥 {popupCombo}x 콤보!
                                </div>
                            )}
                            <div
                                className="px-7 py-3 rounded-full font-extrabold text-xl"
                                style={{ backgroundColor: 'rgba(255,180,51,0.12)', color: '#A07800', border: '2px solid #FFB433', boxShadow: '0 8px 28px rgba(255,215,0,0.5)' }}
                            >
                                ⭐ +10 XP
                            </div>
                        </div>
                    </div>
                )}

                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                        <button onClick={started ? () => setShowExitModal(true) : onBack}
                            className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-black text-[#5B677A]">
                            <span>{started ? '✕' : '←'}</span>
                        </button>
                        <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                            <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">문장 퀴즈</h2>
                            <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>빈칸에 알맞은 한자를 선택하세요</p>
                        </div>
                        <div className="flex items-center justify-end w-11">
                            <span className="text-[#AEB7C5] text-sm font-bold whitespace-nowrap">{Math.min(totalAnswered + 1, 10)}/10</span>
                        </div>
                    </div>
                    <div className="w-full h-[10px] bg-[#F4F7F8] rounded-full mt-3 relative px-1 mx-auto max-w-[90%]">
                        <div
                            className="h-full transition-all duration-700 rounded-full bg-[#7C83FF] relative"
                            style={{ width: `${(Math.min(totalAnswered + 1, 10) / 10) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-xl border-2 border-[#7C83FF] flex items-center justify-center overflow-hidden z-10 transition-all duration-700">
                                <img src={characterAvatar} className="w-7 h-7 object-contain" alt="progress-pawn" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto pb-6">
                    <div className="w-full max-w-xl mx-auto px-4 pt-5 flex flex-col gap-5">

                        {/* 문제 카드 (플립) */}
                        <div
                            className="relative w-full aspect-[16/10]"
                            style={{ perspective: '2000px' }}
                            onClick={() => {
                                if (isCorrectSelected && currentQuiz?.type === 'sentence') {
                                    setIsWordCardFlipped(f => !f);
                                    if (!isWordCardFlipped) handleSpeak();
                                }
                            }}
                        >
                            <div
                                className={`relative w-full h-full transition-all duration-700 ${isCorrectSelected ? 'cursor-pointer shadow-2xl' : ''} rounded-[4rem]`}
                                style={{
                                    transform: isWordCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    transformStyle: 'preserve-3d',
                                    WebkitTransformStyle: 'preserve-3d',
                                }}
                            >
                                {/* 앞면: 빈칸 문장 */}
                                <div
                                    className="absolute inset-0 bg-white rounded-[2.5rem] border-[10px] border-white flex flex-col items-center justify-center px-8 overflow-hidden shadow-xl"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isWordCardFlipped ? 0 : 1 }}
                                >
                                    <p className="text-3xl sm:text-[2.6rem] font-bold leading-[1.8] text-center text-[#5B677A]/90 break-keep">
                                        {currentQuiz?.type === 'sentence' && currentQuiz?.sentence?.includes('(') ? (
                                            <>
                                                {currentQuiz.sentence.split('(')[0]}
                                                <span
                                                    className={`inline-flex items-center justify-center min-w-[120px] rounded-2xl transition-all duration-300 mx-2 py-0.5 ${feedback
                                                            ? (feedback.isCorrect ? 'bg-[#7C83FF]/10 border-2 border-[#7C83FF] shadow-sm' : 'bg-rose-50 border-2 border-rose-400 shadow-sm')
                                                            : 'bg-[#F8FAF9] border-2 border-dashed border-[#7C83FF]/30 shadow-inner'
                                                        }`}
                                                    style={{ verticalAlign: 'baseline' }}
                                                >
                                                    <span
                                                        className="font-bold text-3xl sm:text-[2.6rem]"
                                                        style={{
                                                            color: feedback ? (feedback.isCorrect ? '#7C83FF' : '#E05C5C') : '#C3C6FF'
                                                        }}
                                                    >
                                                        {feedback ? currentQuiz.target.word : '?'}
                                                    </span>
                                                </span>
                                                {currentQuiz.sentence.split(')')[1]}
                                            </>
                                        ) : (
                                            <span className="text-7xl font-black">{currentQuiz?.char}</span>
                                        )}
                                    </p>
                                    {isCorrectSelected && !isWordCardFlipped && currentQuiz?.type === 'sentence' && (
                                        <div className="mt-6 px-8 py-2.5 rounded-full font-black text-sm bg-[#F8FAF9] text-[#AEB7C5] uppercase tracking-[0.4em] border-2 border-[#E9EDF2]/50 animate-bounce">
                                            더 알아보기
                                        </div>
                                    )}
                                </div>

                                {/* 뒷면: 단어 정보 */}
                                <div
                                    className="absolute inset-0 bg-white rounded-[2.5rem] border-[10px] border-white flex flex-col items-center justify-between px-3 py-6 shadow-xl"
                                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', zIndex: isWordCardFlipped ? 1 : 0 }}
                                >
                                    <div className="flex flex-row items-baseline gap-3">
                                        <span className="text-5xl sm:text-[4.5rem] font-black text-[#4F56D9] tracking-tighter leading-none" style={{ textShadow: '0 0 10px rgba(79,86,217,0.10)' }}>
                                            {reading}
                                        </span>
                                        <span className="text-xl sm:text-2xl font-bold text-[#AEB7C5] tracking-widest">
                                            ({word})
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSpeak}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-xl border-2 border-white ${isSpeaking ? 'bg-[#7C83FF] text-white' : 'bg-[#F8FAF9] text-slate-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </button>
                                    <div className="w-full flex flex-col items-start text-left">
                                        <p className="text-body-lg-res font-medium text-[#5B677A] leading-relaxed break-keep tracking-normal">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#7C83FF]/10 text-[#7C83FF] text-sm font-black mr-3 shadow-sm border border-[#7C83FF]/20 transform -translate-y-0.5">
                                                의미
                                            </span>
                                            {meaning}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 선택지 */}
                        <div className="grid grid-cols-1 gap-2.5 w-full">
                            {options.map((opt, i) => {
                                const isWrong = wrongAttempts.includes(opt);
                                const isCorrect = isCorrectSelected && opt === currentAnswer;
                                return (
                                    <button
                                        key={i}
                                        disabled={isCorrectSelected}
                                        onClick={() => handleAnswer(opt)}
                                        className={`py-2.5 px-6 rounded-[1.6rem] font-bold text-h3-res border-2 transition-all flex justify-between items-center break-keep relative active:translate-y-[4px] active:border-b-0 ${isCorrect
                                                ? 'bg-[#F2F3FF] border-[#7C83FF] border-b-4 border-b-[#7C83FF] text-[#4F56D9] -translate-y-[4px]'
                                                : isWrong
                                                    ? 'bg-white border-[#FFA88D] border-b-4 border-b-[#FFA88D] text-[#FF8D72] -translate-y-[4px]'
                                                    : isCorrectSelected
                                                        ? 'bg-white border-[#E9EDF2] text-[#AEB7C5] opacity-60'
                                                        : 'bg-white border-[#E9EDF2] border-b-4 border-b-slate-200 text-[#5D544F] -translate-y-[4px] hover:border-[#7C83FF]'
                                            }`}
                                        style={{ boxShadow: '0 10px 16px rgba(120,130,160,0.10)' }}
                                    >
                                        <span className="text-left w-full">{opt}</span>
                                        {isCorrect && <span className="text-[#7C83FF] shrink-0 ml-2">✓</span>}
                                        {isWrong && <span className="text-[#FF8D72] shrink-0 ml-2">✕</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 네비게이션 버튼 */}
                        {isCorrectSelected && (
                            <div className="w-full flex gap-5 animate-in fade-in slide-in-from-top-4 duration-500">
                                <button
                                    disabled
                                    className="flex-1 py-3 rounded-[1.8rem] bg-white font-bold text-h3-res text-slate-200 border-2 border-[#E9EDF2]"
                                >
                                    ‹ 이전
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] py-3 rounded-[1.8rem] bg-[#7278F2] font-bold text-h3-res text-white shadow-2xl shadow-[rgba(124,131,255,0.18)] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {totalAnswered >= 10 ? '결과 보기 ›' : '다음 ›'}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    }

    // ── 선택 화면 (급수/주제별 탭 + 시작 버튼) ────────────────────────────
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden" style={{ backgroundColor: '#F7FAF9' }}>
            {/* 헤더 */}
            <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-[3rem] p-4 px-6 min-h-[72px] shadow-md border border-white w-full">
                    <button onClick={onBack}
                        className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all w-11 h-11 font-bold text-[#AEB7C5]">
                        <span>←</span>
                    </button>
                    <div className="flex flex-col items-center min-w-0 flex-1 px-2">
                        <h2 className="text-h3 font-bold text-[#5B677A] m-0 break-keep">문장 퀴즈</h2>
                        <p className="text-xs font-bold mt-0.5 text-center leading-tight break-keep" style={{ color: '#969CEB' }}>빈칸에 알맞은 한자를 선택하세요</p>
                    </div>
                    <div className="w-11" />
                </div>
            </div>

            {/* 바디 */}
            <div className="flex-1 overflow-y-auto pb-6">
                <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-6 pt-5">

                    {/* 탭 */}
                    <div className="flex bg-[#F4F7F8]/40 p-1.5 rounded-full border border-[#E9EDF2] w-full mb-4 shadow-inner">
                        <button
                            onClick={() => setViewMode('grade')}
                            className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'grade' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                        >
                            급수별
                        </button>
                        <button
                            onClick={() => setViewMode('topic')}
                            className={`flex-1 px-8 py-3 rounded-full font-bold text-h3 transition-all ${viewMode === 'topic' ? 'bg-white shadow-md text-[#5B677A]' : 'text-[#AEB7C5]'}`}
                        >
                            주제별
                        </button>
                    </div>

                    {/* 급수별 선택 */}
                    {viewMode === 'grade' && (
                        <GradeGrid
                            selected={selectedGrade}
                            onSelect={g => setSelectedGrade(g)}
                            lockedGrades={GRADES.filter(g => g !== '전체' && !unlockedGrades.has(g))}
                        />
                    )}

                    {/* 주제 선택 */}
                    {viewMode === 'topic' && (
                        <div className="grid grid-cols-2 gap-4 w-full">
                            {categories.map(cat => (
                                <TopicCard
                                    key={cat}
                                    name={cat}
                                    imgSrc={CATEGORY_IMAGES[cat] ? `/assets/images/hanja_all/${CATEGORY_IMAGES[cat]}` : null}
                                    count={`${HANJA_DATA.filter(h => h.category === cat).length}개`}
                                    isSelected={selectedCategory === cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    locked={!HANJA_DATA.some(h => h.category === cat && unlockedIds.has(h.id))}
                                />
                            ))}
                        </div>
                    )}

                    {/* 캐릭터 영역 */}
                    <div className="flex flex-col items-center mt-4 mb-5 relative">
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

                    {/* 게임 시작 버튼 */}
                    <div className="w-full max-w-sm px-4 pb-4 -mt-2.5">
                        <button
                            onClick={() => startQuiz()}
                            className="w-full py-5 rounded-[2rem] font-bold text-h3 text-white transition-all active:scale-95 shadow-[0_8px_24px_rgba(255,168,141,0.35)] flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none"
                            style={{
                                background: 'linear-gradient(135deg, #FFA88D 0%, #FF8D72 100%)',
                                borderBottom: '6px solid #E0735A'
                            }}
                        >
                            <span>퀴즈 시작!</span>
                        </button>
                    </div>
                </div>
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
                                정말 퀴즈를 중단할까요? 🥺
                            </h2>
                            <p className="text-xs-res font-bold leading-relaxed break-keep mt-1" style={{ color: '#A5AFBF', lineHeight: '1.4' }}>
                                지금 나가면 진행 중인 퀴즈의 학습 진행 상황이 저장되지 않아요. 계속 끝까지 풀어볼까요?
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

export default SentenceQuizScreen;
