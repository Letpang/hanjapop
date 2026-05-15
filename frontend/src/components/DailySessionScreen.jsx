import { useState, useEffect, useMemo } from 'react';
import DAILY_CURRICULUM from '../data/dailyCurriculum.js';
import HANJA_DATA from '../hanja_unified.json';
import FlashcardScreen from './FlashcardScreen.jsx';
import ShootGameScreen from './ShootGameScreen.jsx';
import MatchGameScreen from './MatchGameScreen.jsx';
import WordQuizScreen from './WordQuizScreen.jsx';
import SentenceQuizScreen from './SentenceQuizScreen.jsx';
import WritingScreen from './WritingScreen.jsx';

const getTodayDayNumber = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('total_activity_stats') || '{}');
        return Math.min(Math.max(saved.totalDays || 1, 1), 123);
    } catch { return 1; }
};

const isSessionDoneToday = () => {
    try {
        const data = JSON.parse(localStorage.getItem('daily_session') || '{}');
        return data.date === new Date().toISOString().slice(0, 10) && data.done;
    } catch { return false; }
};

const markSessionDone = () => {
    try {
        localStorage.setItem('daily_session', JSON.stringify({
            date: new Date().toISOString().slice(0, 10),
            done: true,
        }));
    } catch {}
};

// SRS에서 복습 대상 7개 뽑기
const getSrsReviewIds = (srsData, todayIds, count = 7) => {
    try {
        const now = Date.now();
        const due = Object.entries(srsData || {})
            .filter(([id, d]) => !todayIds.includes(Number(id)) && d.nextReview && d.nextReview <= now)
            .sort((a, b) => a[1].nextReview - b[1].nextReview)
            .slice(0, count)
            .map(([id]) => Number(id));
        return due;
    } catch { return []; }
};

// ── Intro Overlay (Floating Modal Style) ───────────────────────────────────
const IntroOverlay = ({ dayNumber, theme, hanja, onStart }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-in fade-in duration-500 pointer-events-none bg-black/5 backdrop-blur-sm">
        <div className="minimal-card-studio w-full max-w-lg p-10 flex flex-col items-center gap-10 pointer-events-auto">
            <div className="flex flex-col items-center gap-4">
                <div className="bg-sky-50 px-6 py-1.5 rounded-xl border border-sky-100">
                    <span className="text-sky-400 text-[10px] md:text-xs font-extrabold tracking-widest uppercase">DAY {dayNumber}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[#5D544F] tracking-tight text-center leading-tight">
                    {theme}
                </h1>
            </div>

            {/* 카드 스택 효과 (하나만 보이게) */}
            <div className="relative w-32 h-40 mb-4">
                <div className="absolute inset-0 bg-white rounded-3xl border-2 border-slate-100 shadow-sm rotate-6 translate-x-2"></div>
                <div className="absolute inset-0 bg-white rounded-3xl border-2 border-slate-100 shadow-md -rotate-3 -translate-x-1"></div>
                <div className="absolute inset-0 bg-white rounded-3xl border-4 border-white shadow-xl flex items-center justify-center">
                    <span className="text-6xl font-extrabold text-indigo-500 drop-shadow-sm">{hanja[0]?.hanja}</span>
                </div>
            </div>

            <p className="text-slate-400 font-bold text-sm text-center px-6">
                오늘 배울 {hanja.length}개의 한자를<br/>하나씩 확인해볼까요?
            </p>

            <button
                onClick={onStart}
                className="pill-button-primary w-full py-5 text-2xl shadow-xl shadow-indigo-100"
            >
                학습 시작하기 →
            </button>
        </div>
    </div>
);

// ── Choice Screen (3D Style) ────────────────────────────────────────────────
const ChoiceScreen = ({ title, optionA, optionB, onChooseA, onChooseB }) => {
    const renderIcon = (icon) => {
        if (typeof icon === 'string' && icon.startsWith('/assets/')) {
            return <img src={icon} alt="icon" className="w-[85%] h-[85%] object-contain drop-shadow-lg" />;
        }
        return <span className="text-6xl">{icon}</span>;
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-12 px-6 bg-[#FDFBF7] z-40">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#5D544F] text-center max-w-md leading-tight tracking-tight break-keep">
                {title}
            </h2>
            <div className="flex gap-6 w-full max-w-2xl">
                <button
                    onClick={onChooseA}
                    className="minimal-card-studio flex-1 flex flex-col items-center gap-6 p-10 active:scale-[0.98] transition-all bg-white"
                >
                    <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                        {renderIcon(optionA.icon)}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-[0.2em]">Battle Mode</span>
                        <span className="text-2xl font-extrabold text-[#5D544F] tracking-tight break-keep">{optionA.label}</span>
                    </div>
                </button>

                <button
                    onClick={onChooseB}
                    className="minimal-card-studio flex-1 flex flex-col items-center gap-6 p-10 active:scale-[0.98] transition-all bg-white"
                >
                    <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-inner">
                        {renderIcon(optionB.icon)}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-[0.2em]">Focus Mode</span>
                        <span className="text-2xl font-extrabold text-[#5D544F] tracking-tight break-keep">{optionB.label}</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

// ── Results Screen (3D Style) ───────────────────────────────────────────────
const ResultsScreen = ({ todayHanja, correctIds, onComplete, onNavigate }) => {
    const total = todayHanja.filter(h => h.id).length;
    const correct = todayHanja.filter(h => correctIds.includes(h.id)).length;
    const wrongHanja = todayHanja.filter(h => h.id && !correctIds.includes(h.id));
    const hasWrong = wrongHanja.length > 0;

    const recommendations = hasWrong
        ? [
            { label: '오답 몬스터 격파', desc: `틀린 한자 ${wrongHanja.length}개 복습`, screen: 'review', color: '#ff9a6c', icon: '/assets/images/icons/icon_monster_glossy.png' },
            { label: '한자 쓰기', desc: '획순으로 완벽하게', screen: 'writing', color: '#FFD3B6', icon: '/assets/images/icons/node_stroke_test.png' },
          ]
        : [
            { label: '단어 퀴즈', desc: '어휘력을 높여봐요', screen: 'wordQuiz', color: '#A0E4FF', icon: '/assets/images/icons/word_quiz_node.png' },
            { label: '몬스터 슈팅', desc: '실력을 더 키워봐요', screen: 'shootGame', color: '#FFADAD', icon: '/assets/images/icons/node_monster_shooting.png' },
          ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-[#FDFBF7] overflow-y-auto">
            <div className="minimal-card-studio w-full max-w-md p-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 my-8">
                <div className="w-28 h-28 minimal-icon-box bg-white border border-slate-100 shadow-inner">
                    <span className="text-6xl text-amber-400 animate-pulse">✦</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-4xl font-extrabold text-[#5D544F] tracking-tight uppercase flex items-center gap-2">
                        <span className="pastel-star-pink">✦</span>
                        학습 완료!
                        <span className="pastel-star-indigo">✦</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">오늘의 여정을 모두 마쳤습니다</p>
                </div>

                <div className="flex gap-4">
                    {todayHanja.map((h, i) => {
                        const ok = correctIds.includes(h.id);
                        return (
                            <div key={i} className={`minimal-card w-20 h-20 flex flex-col items-center justify-center relative !border-slate-100 ${ok ? 'bg-amber-50/50' : 'bg-rose-50/50'}`}>
                                <span className={`text-3xl font-extrabold ${ok ? 'text-amber-500' : 'text-rose-300'}`}>{h.hanja}</span>
                                <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shadow-lg ${ok ? 'bg-amber-400' : 'bg-rose-300'}`}>
                                    {ok ? '✦' : '✦'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 추천 */}
                <div className="w-full flex flex-col gap-3">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] text-center">
                        {hasWrong ? '🔥 이 한자가 약해요 — 지금 바로 복습!' : '🎉 완벽해요! 더 연습해볼까요?'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {recommendations.map((r) => (
                            <button
                                key={r.screen}
                                onClick={() => { onComplete(); onNavigate(r.screen); }}
                                className="rounded-[1.5rem] bg-white border-4 border-white flex flex-col items-start gap-2 p-4 active:scale-95 transition-transform"
                                style={{ boxShadow: `0 6px 20px ${r.color}66` }}
                            >
                                <img src={r.icon} alt={r.label} className="w-9 h-9 object-contain" />
                                <div>
                                    <div className="font-extrabold text-slate-800 text-sm leading-tight">{r.label}</div>
                                    <div className="text-slate-400 font-bold text-xs mt-0.5">{r.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    className="pill-button-primary w-full py-5 text-xl"
                >
                    메인으로 가기 →
                </button>
            </div>
        </div>
    );
};

// ── Main Orchestrator ──────────────────────────────────────────────────────
const DailySessionScreen = ({
    onComplete,
    onNavigate,
    onAdvanceDay,
    currentDay,
    srsData,
    masteryData,
    onMarkCorrect,
    onMarkWrong,
    selectedCharacter,
    updateMissionProgress,
    addTodayStat,
    increment,
    addBonusXp,
    onHanjaAcquired,
}) => {
    const dayNumber = currentDay || getTodayDayNumber();
    const dayData = DAILY_CURRICULUM[dayNumber - 1] || DAILY_CURRICULUM[0];
    const todayHanja = dayData.hanja.filter(h => h.id !== null);

    const todayIds = useMemo(() => todayHanja.map(h => h.id), [dayNumber]);
    const reviewIds = useMemo(() => getSrsReviewIds(srsData, todayIds, 7), [dayNumber]);

    // 게임용 풀: 신규 3 + 복습 최대 7 — 매 렌더마다 새 배열 생성 방지
    const hanjaPool = useMemo(() => [...new Set([...todayIds, ...reviewIds])], [todayIds, reviewIds]);

    const [phase, setPhase] = useState('intro');
    const [writingIdx, setWritingIdx] = useState(0);
    const [correctIds, setCorrectIds] = useState([]);

    const addCorrect = (id) => {
        if (id && !correctIds.includes(id)) setCorrectIds(prev => [...prev, id]);
    };

    const handleWritingComplete = (id, score) => {
        if (score >= 70) addCorrect(id);
        if (id) score >= 70 ? onMarkCorrect(id) : onMarkWrong(id);
        
        // 통계 업데이트
        if (addTodayStat) addTodayStat('writing');
        if (increment) increment('writing');
        if (updateMissionProgress) updateMissionProgress('writing', 1, addBonusXp);

        const next = writingIdx + 1;
        if (next < todayHanja.length) {
            setWritingIdx(next);
        } else {
            markSessionDone();
            if (onAdvanceDay) onAdvanceDay();
            setPhase('results');
        }
    };

    // 단계별 렌더
    if (phase === 'intro') {
        return <IntroOverlay dayNumber={dayNumber} theme={dayData.theme} hanja={todayHanja} onStart={() => setPhase('flashcard')} />;
    }

    if (phase === 'flashcard') {
        return (
            <FlashcardScreen
                onBack={() => setPhase('intro')}
                hanjaFilter={todayIds}
                onStageClear={() => {
                    if (onHanjaAcquired) onHanjaAcquired(null, 50);
                    if (updateMissionProgress) updateMissionProgress('flashcard', 5, addBonusXp);
                    setPhase('gameChoice');
                }}
                onCardFlip={(id) => {
                    if (updateMissionProgress) updateMissionProgress('flashcard', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('flashcard');
                }}
                onWriteHanja={() => {}}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => onMarkWrong(id)}
                onHanjaAcquired={onHanjaAcquired}
            />
        );
    }

    if (phase === 'gameChoice') {
        return (
            <ChoiceScreen
                title={
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex gap-2 text-2xl">
                            <span className="pastel-star-pink">✦</span>
                            <span className="pastel-star-indigo">✦</span>
                            <span className="pastel-star-amber">✦</span>
                        </div>
                        <span>배운 한자들을 확인해볼까요?</span>
                    </div>
                }
                optionA={{ icon: '/assets/images/icons/node_monster_shooting.png', label: '몬스터 슈팅', desc: '배틀을 통해 실력을 확인해요' }}
                optionB={{ icon: '/assets/images/icons/node_memory_game.png', label: '메모리 게임', desc: '차분하게 짝을 맞춰보세요' }}
                onChooseA={() => setPhase('shootGame')}
                onChooseB={() => setPhase('matchGame')}
            />
        );
    }

    if (phase === 'shootGame') {
        return (
            <ShootGameScreen
                onBack={() => setPhase('gameChoice')}
                onGameFinish={() => setPhase('quizChoice')}
                hanjaFilter={hanjaPool}
                selectedCharacter={selectedCharacter}
                onWaveClear={() => {
                    if (updateMissionProgress) updateMissionProgress('shootGame', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('shootGame');
                    if (increment) increment('shootGame');
                }}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => onMarkWrong(id)}
                masteryData={masteryData}
                srsData={srsData}
            />
        );
    }

    if (phase === 'matchGame') {
        return (
            <MatchGameScreen
                onBack={() => setPhase('gameChoice')}
                hanjaFilter={hanjaPool}
                onStageClear={() => {
                    if (updateMissionProgress) updateMissionProgress('matchGame', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('matchGame');
                    if (increment) increment('matchGame');
                    setPhase('quizChoice');
                }}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={() => {}} 
                srsData={srsData}
                masteryData={masteryData}
            />
        );
    }

    if (phase === 'quizChoice') {
        return (
            <ChoiceScreen
                title="얼마나 강해졌는지 시험해볼까?"
                optionA={{ icon: '/assets/images/icons/word_quiz_node.png', label: '단어 퀴즈', desc: '가볍게 단어로 확인!' }}
                optionB={{ icon: '/assets/images/icons/sentence_quiz_node.png', label: '문장 퀴즈', desc: '도전! 문장 속에서 찾기!' }}
                onChooseA={() => setPhase('wordQuiz')}
                onChooseB={() => setPhase('sentenceQuiz')}
            />
        );
    }

    if (phase === 'wordQuiz') {
        return (
            <WordQuizScreen
                onBack={() => setPhase('quizChoice')}
                hanjaFilter={hanjaPool}
                onHanjaAcquired={(id) => addCorrect(id)}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => onMarkWrong(id)}
                srsData={srsData}
                masteryData={masteryData}
                onStageClear={() => {
                    if (updateMissionProgress) updateMissionProgress('wordQuiz', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('wordQuiz');
                    setPhase('writingIntro');
                }}
            />
        );
    }

    if (phase === 'sentenceQuiz') {
        return (
            <SentenceQuizScreen
                onBack={() => setPhase('quizChoice')}
                hanjaFilter={hanjaPool}
                onHanjaAcquired={(id) => addCorrect(id)}
                onMarkCorrect={(id) => { addCorrect(id); onMarkCorrect(id); }}
                onMarkWrong={(id) => onMarkWrong(id)}
                srsData={srsData}
                masteryData={masteryData}
                onStageClear={() => {
                    if (updateMissionProgress) updateMissionProgress('sentenceQuiz', 1, addBonusXp);
                    if (addTodayStat) addTodayStat('sentenceQuiz');
                    setPhase('writingIntro');
                }}
            />
        );
    }

    if (phase === 'writingIntro') {
        const target = todayHanja[writingIdx];
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-in fade-in duration-500" style={{ backgroundColor: '#F8FAFF' }}>
                <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 flex flex-col items-center gap-8" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

                    {/* 3D 펜 이미지 */}
                    <img src="/assets/images/icons/icon_writing_3d.png" className="w-28 h-28 object-contain drop-shadow-lg" alt="writing" />

                    {/* 타이틀 */}
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#3D3530] text-center tracking-tight leading-tight break-keep">
                        이제 직접 써볼 차례야!
                    </h1>

                    {/* 한자 카드 */}
                    <div className="w-full flex flex-col items-center gap-3 px-10 py-8 rounded-[1.8rem]" style={{ backgroundColor: '#F0FDF8', border: '1.5px solid #A7F3D0' }}>
                        <span className="text-8xl font-extrabold leading-none drop-shadow-sm" style={{ color: '#10B981' }}>{target?.hanja}</span>
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-2xl font-extrabold" style={{ color: '#34D399' }}>{target?.sound}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{target?.meaning}</span>
                        </div>
                    </div>

                    {/* 버튼 */}
                    <button
                        onClick={() => setPhase('writing')}
                        className="w-full py-5 rounded-full font-extrabold text-xl text-white transition-all active:scale-95 active:translate-y-0.5"
                        style={{ backgroundColor: '#10B981', borderBottom: '4px solid #059669', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}
                    >
                        써볼게요!
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'writing') {
        const target = todayHanja[writingIdx];
        const hanjaObj = HANJA_DATA.find(h => h.id === target?.id) || null;
        return (
            <WritingScreen
                key={writingIdx}
                onBack={() => setPhase('quizChoice')}
                initialHanja={hanjaObj}
                onWritingComplete={(id, score) => handleWritingComplete(id || target?.id, score)}
            />
        );
    }

    if (phase === 'results') {
        return (
            <ResultsScreen
                todayHanja={todayHanja}
                correctIds={correctIds}
                onComplete={onComplete}
                onNavigate={onNavigate}
            />
        );
    }
};

export { isSessionDoneToday };
export default DailySessionScreen;
