const ShootGameHud = ({ diffConfig, hp, waveKills, score, themeConfig, onPause, onExit }) => (
    <div className="absolute top-0 left-2 right-2 z-40 safe-top pt-3 flex items-center gap-1.5">
        <div className="h-9 bg-[var(--color-bg-surface)]/90 backdrop-blur-md rounded-2xl px-3 shadow-md border border-[var(--color-border-subtle)]/50 flex items-center gap-1.5 shrink-0">
            {Array.from({ length: diffConfig.hp }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < hp ? 'bg-rose-300' : 'bg-[#F4F7F8]'}`} />
            ))}
        </div>

        <div className="h-9 bg-[var(--color-bg-surface)]/90 backdrop-blur-md rounded-2xl px-3 shadow-md border border-[var(--color-border-subtle)]/50 flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 h-2 bg-[#F4F7F8] rounded-full overflow-hidden">
                <div className="quiz-progress-fill" style={{ width: `${Math.min(100, (waveKills / diffConfig.killsPerWave) * 100)}%`, backgroundColor: themeConfig.accentColor }} />
            </div>
            <span className="text-base font-normal text-[#AEB7C5] tabular-nums whitespace-nowrap">{waveKills}/{diffConfig.killsPerWave}</span>
        </div>

        <div className="h-9 bg-[var(--color-bg-surface)]/90 backdrop-blur-md rounded-2xl px-3 shadow-md border border-[var(--color-border-subtle)]/50 flex items-center justify-center shrink-0 min-w-[2.5rem]">
            <span className="font-normal text-[#AEB7C5] text-base leading-none tabular-nums">{score}</span>
        </div>

        <button onClick={onPause} className="hp-nav-button hp-nav-button--compact shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-400">
                <rect x="5" y="4" width="4" height="16" rx="1.5" />
                <rect x="15" y="4" width="4" height="16" rx="1.5" />
            </svg>
        </button>

        <button onClick={onExit} className="hp-nav-button hp-nav-button--compact shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-slate-400 stroke-[3]">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    </div>
);

export default ShootGameHud;
