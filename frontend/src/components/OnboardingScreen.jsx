/**
 * OnboardingScreen.jsx
 * 첫 실행 시 딱 한 번 보여주는 레벨 테스트 (5문제)
 * - 8급 → 7급 → 6급 순으로 난이도 상승
 * - 맞춘 개수에 따라 시작 급수 자동 설정
 * - 완료 후 localStorage에 'onboarding_done' 저장
 */
import { useState, useEffect } from 'react';
import HANJA_DATA from '../hanja_unified.json';

// ─── 온보딩 문제 세트 (5문제, 8급 위주) ───────────────────────────────────
// 반드시 맞출 수 있는 쉬운 것부터 시작
const ONBOARDING_QUESTIONS = [
    // Q1: 8급 — 一(일, 하나) — 거의 모두 앎
    {
        hanja: '一',
        question: '이 한자의 뜻은 무엇일까요?',
        options: ['하나', '둘', '셋', '넷'],
        answer: '하나',
        grade: '8급',
        hint: '가로 한 획으로 된 한자예요',
    },
    // Q2: 8급 — 山(산) — 모양으로 유추 가능
    {
        hanja: '山',
        question: '이 한자가 나타내는 것은?',
        options: ['강', '산', '바다', '하늘'],
        answer: '산',
        grade: '8급',
        hint: '봉우리 세 개가 보이지 않나요?',
    },
    // Q3: 8급 — 火(화, 불) — 불꽃 모양
    {
        hanja: '火',
        question: '이 한자의 뜻은?',
        options: ['물', '흙', '불', '바람'],
        answer: '불',
        grade: '8급',
        hint: '활활 타오르는 모양이에요',
    },
    // Q4: 7급 — 學(학, 배울) — 조금 어려움
    {
        hanja: '學',
        question: '"학교"의 첫 글자예요. 무슨 뜻일까요?',
        options: ['가르칠', '배울', '읽을', '쓸'],
        answer: '배울',
        grade: '7급',
        hint: '학교(學校)에서 하는 것이에요',
    },
    // Q5: 6급 — 友(우, 벗) — 어려운 편
    {
        hanja: '友',
        question: '이 한자의 뜻은?',
        options: ['적', '벗(친구)', '가족', '선생님'],
        answer: '벗(친구)',
        grade: '6급',
        hint: '친구(親友)에 들어가는 한자예요',
    },
];

// 맞춘 개수 → 시작 급수 매핑
const getStartGrade = (correct) => {
    if (correct <= 1) return '8급';
    if (correct <= 2) return '8급';
    if (correct <= 3) return '7급';
    if (correct <= 4) return '7급';
    return '6급';
};

// 맞춘 개수 → 메시지
const getResultMessage = (correct) => {
    if (correct <= 1) return { emoji: '🌱', title: '한자 입문자예요!', desc: '8급부터 차근차근 시작해봐요. 금방 늘 거예요!' };
    if (correct <= 2) return { emoji: '📖', title: '기초를 알고 있어요!', desc: '8급 한자를 복습하면서 7급으로 올라가봐요.' };
    if (correct <= 3) return { emoji: '⭐', title: '꽤 알고 있네요!', desc: '7급 수준이에요. 조금만 더 하면 6급도 금방이에요!' };
    if (correct <= 4) return { emoji: '🔥', title: '한자를 잘 아네요!', desc: '7급 이상 수준이에요. 6급에 도전해봐요!' };
    return { emoji: '🏆', title: '한자 고수예요!', desc: '6급 수준이에요. 더 높은 급수에 도전해봐요!' };
};

// ─── 문제 카드 ─────────────────────────────────────────────────────────────
const QuestionCard = ({ q, index, total, onAnswer }) => {
    const [selected, setSelected] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const handleSelect = (opt) => {
        if (showFeedback) return;
        setSelected(opt);
        setShowFeedback(true);
        const isCorrect = opt === q.answer;
        setTimeout(() => {
            onAnswer(isCorrect);
            setSelected(null);
            setShowFeedback(false);
        }, 900);
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-300">
            {/* 진행 바 */}
            <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${((index) / total) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-bold text-slate-400 shrink-0">{index + 1}/{total}</span>
            </div>

            {/* 한자 */}
            <div className="w-40 h-40 bg-white dark:bg-slate-800 rounded-[3rem] border-4 border-white shadow-xl flex items-center justify-center">
                <span className="text-8xl font-black text-slate-700 dark:text-white">{q.hanja}</span>
            </div>

            {/* 질문 */}
            <p className="text-xl font-black text-slate-600 dark:text-slate-200 text-center">{q.question}</p>

            {/* 힌트 */}
            <p className="text-sm text-slate-400 font-bold text-center">💡 {q.hint}</p>

            {/* 보기 */}
            <div className="grid grid-cols-2 gap-3 w-full">
                {q.options.map(opt => {
                    let style = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white';
                    if (showFeedback && selected === opt) {
                        style = opt === q.answer
                            ? 'bg-green-400 border-green-300 text-white scale-105'
                            : 'bg-red-400 border-red-300 text-white';
                    } else if (showFeedback && opt === q.answer) {
                        style = 'bg-green-100 border-green-300 text-green-700';
                    }
                    return (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            className={`py-4 rounded-2xl font-black text-lg border-2 transition-all active:scale-95 shadow-sm ${style}`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── 결과 화면 ─────────────────────────────────────────────────────────────
const ResultScreen = ({ correct, total, onComplete }) => {
    const result = getResultMessage(correct);
    const startGrade = getStartGrade(correct);

    return (
        <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-500">
            <div className="text-7xl">{result.emoji}</div>
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-700 dark:text-white mb-2">{result.title}</h2>
                <p className="text-slate-500 dark:text-slate-300 font-bold">{result.desc}</p>
            </div>

            {/* 점수 */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-3xl px-8 py-4 border-2 border-white shadow-lg">
                <span className="text-4xl font-black text-indigo-500">{correct}</span>
                <span className="text-slate-400 font-bold">/ {total} 정답</span>
            </div>

            {/* 시작 급수 */}
            <div className="w-full bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl p-5 border-2 border-indigo-100 dark:border-indigo-800 text-center">
                <p className="text-slate-500 dark:text-slate-300 font-bold text-sm mb-1">추천 시작 급수</p>
                <p className="text-3xl font-black text-indigo-500">{startGrade}</p>
            </div>

            <button
                onClick={() => onComplete(startGrade)}
                className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl shadow-xl active:scale-95 transition-all"
            >
                {startGrade}부터 시작하기! 🚀
            </button>
        </div>
    );
};

// ─── 메인 OnboardingScreen ─────────────────────────────────────────────────
const OnboardingScreen = ({ onComplete }) => {
    const [step, setStep] = useState('intro'); // 'intro' | 'quiz' | 'result'
    const [currentQ, setCurrentQ] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    const handleAnswer = (isCorrect) => {
        const newCorrect = isCorrect ? correctCount + 1 : correctCount;
        if (currentQ + 1 >= ONBOARDING_QUESTIONS.length) {
            setCorrectCount(newCorrect);
            setStep('result');
        } else {
            if (isCorrect) setCorrectCount(c => c + 1);
            setCurrentQ(q => q + 1);
        }
    };

    const handleComplete = (startGrade) => {
        localStorage.setItem('onboarding_done', 'true');
        localStorage.setItem('start_grade', startGrade);
        onComplete(startGrade);
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col items-center justify-center overflow-y-auto">
            <div className="w-full max-w-sm mx-auto px-6 py-12 flex flex-col items-center gap-8">

                {/* 인트로 */}
                {step === 'intro' && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                        <div className="text-6xl">👋</div>
                        <div className="text-center">
                            <h1 className="text-4xl font-black text-slate-700 dark:text-white mb-3">
                                한자팝에 오신 걸<br />환영해요!
                            </h1>
                            <p className="text-slate-500 dark:text-slate-300 font-bold text-lg">
                                먼저 한자 실력을 알아볼게요.<br />
                                딱 5문제만 풀어봐요! 😊
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full bg-white/80 dark:bg-slate-800/80 rounded-3xl p-5 border-2 border-white shadow-md">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⏱️</span>
                                <span className="font-bold text-slate-600 dark:text-slate-200">약 1분이면 끝나요</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🎯</span>
                                <span className="font-bold text-slate-600 dark:text-slate-200">결과에 맞는 급수를 추천해드려요</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✨</span>
                                <span className="font-bold text-slate-600 dark:text-slate-200">틀려도 괜찮아요!</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep('quiz')}
                            className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl shadow-xl active:scale-95 transition-all"
                        >
                            시작하기! 🚀
                        </button>
                        <button
                            onClick={() => handleComplete('8급')}
                            className="text-slate-400 text-sm font-bold underline"
                        >
                            건너뛰기
                        </button>
                    </div>
                )}

                {/* 퀴즈 */}
                {step === 'quiz' && (
                    <QuestionCard
                        key={currentQ}
                        q={ONBOARDING_QUESTIONS[currentQ]}
                        index={currentQ}
                        total={ONBOARDING_QUESTIONS.length}
                        onAnswer={handleAnswer}
                    />
                )}

                {/* 결과 */}
                {step === 'result' && (
                    <ResultScreen
                        correct={correctCount}
                        total={ONBOARDING_QUESTIONS.length}
                        onComplete={handleComplete}
                    />
                )}
            </div>
        </div>
    );
};

export default OnboardingScreen;
