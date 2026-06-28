const QuizProgressBar = ({ current, total, answered = false, completing = false, avatar, fillColor }) => {
    const pct = completing ? 100 : ((current + (answered ? 1 : 0)) / total) * 100;
    return (
        <div className="quiz-progress-track">
            <div
                className="quiz-progress-fill"
                style={{ '--progress': `${pct}%`, ...(fillColor ? { backgroundColor: fillColor } : {}) }}
            />
            {avatar && (
                <div className="quiz-progress-avatar" style={{
                    left: `calc(${pct}% - (${pct / 100} * 2.25rem))`,
                    right: 'auto',
                    transform: 'translateY(-50%)',
                }}>
                    <img src={avatar} className="w-full h-full object-contain" alt="progress-pawn" />
                </div>
            )}
        </div>
    );
};

export default QuizProgressBar;
