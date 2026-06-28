import { MONSTER_COMPONENTS, IconExplosionBig } from '../../../../components/Icons.jsx';

const CHARACTER_SIZE = {
    garae: 'w-20 h-20',
    jeolmi: 'w-24 h-24',
    chapssal: 'w-24 h-24',
    muzi: 'w-20 h-20',
};

export default function ShootGameArena({
    acquisitions,
    characterAvatar,
    lasers,
    selectedCharacter,
    targetId,
    turretAngle,
    words,
}) {
    const characterSize = CHARACTER_SIZE[selectedCharacter] || 'w-20 h-20';

    return (
        <div className="flex-1 relative overflow-hidden min-h-0">
            <svg className="absolute w-full h-full pointer-events-none z-20">
                {lasers.map(laser => (
                    <g key={laser.id} className="animate-pulse">
                        <line x1={`${laser.shipX}%`} y1={`${laser.shipY}%`} x2={`${laser.targetX}%`} y2={`${laser.targetY}%`} stroke="#FFD1DC" strokeWidth="20" strokeLinecap="round" style={{ filter: 'blur(6px)' }} opacity="0.8" />
                        <line x1={`${laser.shipX}%`} y1={`${laser.shipY}%`} x2={`${laser.targetX}%`} y2={`${laser.targetY}%`} stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
                    </g>
                ))}
            </svg>

            <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 z-30">
                <div className={`${characterSize} transition-transform duration-100 drop-shadow-2xl`} style={{ transform: `rotate(${turretAngle + 90}deg)` }}>
                    <img src={characterAvatar} className="w-full h-full object-contain" alt="" />
                </div>
            </div>

            {words.map(word => {
                const MonsterIcon = MONSTER_COMPONENTS[word.emojiId] || MONSTER_COMPONENTS[0];
                return (
                    <div
                        key={word.id}
                        className={`absolute flex flex-col items-center transition-all duration-300 ${word.state === 'exploding' ? 'opacity-0 scale-150' : (word.id === targetId ? 'scale-110 z-10' : 'scale-100')}`}
                        style={{ left: `${word.x}%`, top: `${word.y}%`, transform: 'translate(-50%, 0)' }}
                    >
                        {word.state === 'exploding' ? (
                            <div className="w-24 h-24 absolute flex items-center justify-center animate-ping opacity-50">
                                <IconExplosionBig />
                            </div>
                        ) : (
                            <div className="quiz-header-title-area">
                                <div className={`w-14 h-14 md:w-20 md:h-20 animate-bounce ${word.isWrongItem ? 'drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'drop-shadow-md'}`}>
                                    <MonsterIcon />
                                </div>
                                <div className={`shoot-target-label hanja-char ${[...word.hanja].length > 4 ? 'shoot-target-label--long' : ''} font-normal text-[#5D544F] flex items-center justify-center rounded-[1.1rem] shadow-[0_6px_14px_rgba(45,88,96,0.10)] border px-2.5 py-1.5 backdrop-blur-sm transition-all duration-300 max-w-[8rem] md:max-w-[10rem] ${
                                    word.isWrongItem
                                        ? 'bg-white/40 border-rose-200/55'
                                        : word.id === targetId
                                            ? 'bg-white/48 border-[#13C8D0]/75 scale-110 shadow-[0_8px_18px_rgba(19,200,208,0.18)]'
                                            : 'bg-white/30 border-white/60'
                                }`}>
                                    <span className="text-center break-keep leading-tight">{word.hanja}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {acquisitions.map(acquisition => (
                <div
                    key={acquisition.id}
                    className="absolute pointer-events-none z-30 animate-float font-normal text-[#FFB433] text-2xl drop-shadow-lg"
                    style={{ left: `${acquisition.x}%`, top: `${acquisition.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    +3 XP ✨
                </div>
            ))}
        </div>
    );
}
