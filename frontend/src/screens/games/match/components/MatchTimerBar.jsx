export default function MatchTimerBar({ cards, timeLeft }) {
    const maxTime = Math.max(1, cards.length / 2 * 10);
    const timeFraction = timeLeft / maxTime;
    const isDanger = timeLeft <= 10;
    const isWarning = timeLeft <= 20;

    return (
        <div className="match-game-timer w-full mx-auto flex items-center gap-3 mt-3">
            <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                        width: `${Math.max(0, Math.min(100, timeFraction * 100))}%`,
                        background: isDanger
                            ? 'linear-gradient(90deg, #FF9B73, #FF6B6B)'
                            : isWarning
                                ? 'linear-gradient(90deg, #FFD4CC, #FF9B73)'
                                : 'linear-gradient(90deg, #2ED6C5, #0D9488)',
                        boxShadow: isDanger
                            ? '0 0 8px rgba(255,107,107,0.4)'
                            : isWarning
                                ? '0 0 8px rgba(255,155,115,0.4)'
                                : '0 0 8px rgba(46,214,197,0.4)',
                    }}
                />
            </div>
            <span className={`font-normal min-w-[42px] text-right ${isDanger ? 'text-rose-500 animate-pulse' : 'text-[#8F99AD]'}`}>
                {timeLeft}s
            </span>
        </div>
    );
}
