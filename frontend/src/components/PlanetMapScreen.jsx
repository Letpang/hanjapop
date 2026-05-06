const PLANETS = [
    {
        id: 1,
        grade: '8급',
        label: '8급',
        sub: '50자',
        color: '#7EC8E3',
        glow: '#a8e6f0',
        emoji: '🌏',
        maxStage: 10,
        x: 45,
        y: 74,
    },
    {
        id: 2,
        grade: '7급-1',
        label: '7급-1',
        sub: '50자',
        color: '#FFB347',
        glow: '#ffd580',
        emoji: '🪐',
        maxStage: 20,
        x: 68,
        y: 50,
    },
    {
        id: 3,
        grade: '7급-2',
        label: '7급-2',
        sub: '50자',
        color: '#C3A6FF',
        glow: '#e0d0ff',
        emoji: '💫',
        maxStage: 30,
        x: 48,
        y: 20,
    },
    {
        id: 4,
        grade: '6급-1',
        label: '6급-1',
        sub: '50자',
        color: '#FFB3BA',
        glow: '#ffdae0',
        emoji: '👾',
        maxStage: 40,
        x: 18,
        y: 30,
    },
    {
        id: 5,
        grade: '6급-2',
        label: '6급-2',
        sub: '50자',
        color: '#BAFFC9',
        glow: '#d5ffe0',
        emoji: '🛰️',
        maxStage: 50,
        x: 22,
        y: 56,
    },
    {
        id: 6,
        grade: '6급-3',
        label: '6급-3',
        sub: '50자',
        color: '#BAE1FF',
        glow: '#d5f0ff',
        emoji: '🛸',
        maxStage: 60,
        x: 72,
        y: 30,
    },
];

const PlanetMapScreen = ({ onBack, onSelectPlanet, activePlanet, unlockedStages }) => {
    const isPlanetUnlocked = (planet) => {
        if (planet.locked) return false;
        return true; // 8급, 7급-1, 7급-2는 이미 locked가 아니므로 항상 열려 있음
    };

    const getPlanetProgress = (planet) => {
        if (planet.locked) return 0;
        const startStage = (planet.id - 1) * 10 + 1;
        const endStage = planet.id * 10;
        const cleared = unlockedStages.filter(s => s >= startStage && s <= endStage).length;
        return Math.round((cleared / 10) * 100);
    };

    return (
        <div className="fixed inset-0 flex flex-col">
            {/* 배경 이미지 */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/assets/images/backgrounds/planet_map_bg.webp)' }}
            />
            <div className="absolute inset-0 bg-purple-900/10" />

            {/* 뒤로가기 버튼 */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-20 bg-white/80 backdrop-blur-sm text-slate-700 font-black px-4 py-2 rounded-2xl border-2 border-white shadow-lg active:scale-95 transition-all"
                style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
            >
                ← 메뉴
            </button>

            {/* 행성들 */}
            <div className="absolute inset-0 z-10">
                {PLANETS.map((planet) => {
                    const unlocked = isPlanetUnlocked(planet);
                    const isActive = activePlanet === planet.id;
                    const progress = getPlanetProgress(planet);

                    return (
                        <button
                            key={planet.id}
                            onClick={() => unlocked && onSelectPlanet(planet.id)}
                            className="absolute flex flex-col items-center gap-1 transition-all duration-300"
                            style={{
                                left: `${planet.x}%`,
                                top: `${planet.y}%`,
                                transform: 'translate(-50%, -50%)',
                                cursor: unlocked ? 'pointer' : 'default',
                            }}
                        >
                            {/* 행성 원 */}
                            <div
                                className="relative flex items-center justify-center rounded-full transition-all duration-300"
                                style={{
                                    width: 72,
                                    height: 72,
                                    background: unlocked
                                        ? `radial-gradient(circle at 35% 35%, white 0%, ${planet.color} 60%)`
                                        : 'radial-gradient(circle at 35% 35%, #e0e0e0 0%, #999 60%)',
                                    boxShadow: isActive
                                        ? `0 0 0 4px white, 0 0 20px ${planet.glow}, 0 0 40px ${planet.glow}`
                                        : unlocked
                                        ? `0 0 14px ${planet.glow}, 0 4px 12px rgba(0,0,0,0.2)`
                                        : '0 4px 12px rgba(0,0,0,0.2)',
                                    opacity: unlocked ? 1 : 0.6,
                                    animation: unlocked && !isActive ? 'float 3s ease-in-out infinite' : 'none',
                                    animationDelay: `${planet.id * 0.5}s`,
                                }}
                            >
                                <span className="text-3xl select-none">{planet.emoji}</span>

                                {/* 선택됨 표시 */}
                                {isActive && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-xs font-black shadow-md">
                                        ✓
                                    </div>
                                )}
                            </div>

                            {/* 라벨 */}
                            <div
                                className="text-center px-2 py-1 rounded-xl"
                                style={{
                                    background: 'rgba(255,255,255,0.85)',
                                    backdropFilter: 'blur(4px)',
                                    minWidth: 72,
                                }}
                            >
                                <div className="text-xs font-black text-slate-700 leading-tight">{planet.label}</div>
                                {unlocked && !planet.locked && (
                                    <div className="text-[10px] text-slate-400 font-bold">{progress}% 완료</div>
                                )}
                                {planet.locked && (
                                    <div className="text-[10px] text-slate-400 font-bold">{planet.sub}</div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PlanetMapScreen;
