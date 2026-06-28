const QuizStudyScreenFrame = ({ children, header, isActive = false }) => (
    <div className={`quiz-study-screen w-full min-h-[100dvh] flex flex-col max-w-screen-xl mx-auto ${isActive ? 'bg-[#F8FAF9] dark:bg-slate-900' : ''}`}>
        {header}

        <div className="quiz-study-body flex-1 min-h-0 flex flex-col pb-3">
            <div className="quiz-study-inner flex-1 min-h-0 w-full max-w-2xl mx-auto px-3 flex flex-col items-center gap-3 sm:gap-4 pt-2 sm:pt-3">
                {children}
            </div>
        </div>
    </div>
);

export default QuizStudyScreenFrame;
