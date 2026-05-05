const LevelTestScreen = ({ onBack }) => {
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
                        레벨 테스트
                    </h1>
                    <div className="w-[60px]" />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                <div className="text-6xl">🚧</div>
                <div className="clay-panel rounded-[3rem] p-10 bg-white dark:bg-slate-800 border-4 border-white flex flex-col items-center gap-4 text-center max-w-sm w-full">
                    <h2 className="text-2xl font-black text-slate-700 dark:text-white">준비 중이에요</h2>
                    <p className="text-slate-400 font-bold text-sm leading-relaxed">
                        레벨 테스트를 통과하면<br />
                        뭉치 학습지가 더 열려요!<br />
                        곧 공개될 예정이에요 ✨
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="px-10 py-4 rounded-[2rem] bg-indigo-500 text-white font-black text-lg shadow-xl active:scale-95 transition-all"
                >
                    돌아가기
                </button>
            </div>
        </div>
    );
};

export default LevelTestScreen;
