import { useState } from 'react';
import WordQuizScreen from './WordQuizScreen.jsx';
import SentenceQuizScreen from './SentenceQuizScreen.jsx';

const CombinedQuizScreen = ({ onBack, onHanjaAcquired, onMarkCorrect, onMarkWrong, onWordCorrect }) => {
    const [mode, setMode] = useState('select'); // 'select' | 'word' | 'sentence'

    if (mode === 'word') {
        return (
            <WordQuizScreen
                onBack={() => setMode('select')}
                onHanjaAcquired={onHanjaAcquired}
                onMarkCorrect={onMarkCorrect}
                onMarkWrong={onMarkWrong}
                onWordCorrect={onWordCorrect}
            />
        );
    }

    if (mode === 'sentence') {
        return (
            <SentenceQuizScreen
                onBack={() => setMode('select')}
                onHanjaAcquired={onHanjaAcquired}
                onMarkCorrect={onMarkCorrect}
                onMarkWrong={onMarkWrong}
            />
        );
    }

    // 선택 화면
    return (
        <div className="w-full h-[100dvh] flex flex-col max-w-screen-xl mx-auto overflow-hidden">
            <div className="w-full px-4 shrink-0 safe-top">
                <div className="w-full flex justify-between items-center clay-panel p-4 sm:p-6 px-6 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-700">
                    <button
                        onClick={onBack}
                        className="text-slate-600 dark:text-slate-200 font-black bg-white/60 dark:bg-slate-800/60 px-5 py-2.5 rounded-2xl border-2 border-white/50 shadow-md active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl">←</span>
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-700 dark:text-white tracking-tight premium-text-shadow text-center flex-1 px-4">
                        단어&문장 퀴즈
                    </h1>
                    <div className="w-[60px]" />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                <p className="text-slate-400 font-bold text-base text-center">풀고 싶은 퀴즈를 선택하세요</p>

                <button
                    onClick={() => setMode('word')}
                    className="w-full max-w-sm clay-panel rounded-[2.5rem] p-8 bg-white dark:bg-slate-800 border-4 border-white flex items-center gap-6 active:scale-95 transition-all hover:-translate-y-1"
                >
                    <div className="w-16 h-16 rounded-[1.5rem] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-4xl shrink-0">🎯</div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-slate-700 dark:text-white text-xl">단어 퀴즈</span>
                        <span className="text-slate-400 text-sm mt-1">한자어를 보고 뜻 고르기</span>
                    </div>
                    <span className="ml-auto text-slate-300 text-3xl">›</span>
                </button>

                <button
                    onClick={() => setMode('sentence')}
                    className="w-full max-w-sm clay-panel rounded-[2.5rem] p-8 bg-white dark:bg-slate-800 border-4 border-white flex items-center gap-6 active:scale-95 transition-all hover:-translate-y-1"
                >
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-4xl shrink-0">📝</div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-slate-700 dark:text-white text-xl">문장 퀴즈</span>
                        <span className="text-slate-400 text-sm mt-1">문장 속 빈칸에 한자어 넣기</span>
                    </div>
                    <span className="ml-auto text-slate-300 text-3xl">›</span>
                </button>
            </div>
        </div>
    );
};

export default CombinedQuizScreen;
