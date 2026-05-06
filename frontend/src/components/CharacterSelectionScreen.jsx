import { useState, useRef } from 'react';

const CHARACTERS = [
    {
        id: 'garae',
        name: '가래뭉치',
        image: '/assets/images/characters/mungchi/garae/rank_1.webp',
        finalImage: '/assets/images/characters/mungchi/garae/rank_5.webp',
        color: '#FF9EBB',
        glow: 'rgba(255,107,157,0.55)',
        desc: '용감하고 명랑해요 — 언제나 제일 먼저 손을 들어요! 🍡',
        imageScale: 1,
        translateY: '15px'
    },
    {
        id: 'jeolmi',
        name: '절미뭉치',
        image: '/assets/images/characters/mungchi/jeolmi/rank_1.webp',
        finalImage: '/assets/images/characters/mungchi/jeolmi/rank_5.webp',
        color: '#FFDAC1',
        glow: 'rgba(255,160,80,0.55)',
        desc: '다정하고 호기심이 많아요 — 반짝이는 스티커를 좋아해요! 🌸',
        imageScale: 1,
        translateY: '25px'
    },
    {
        id: 'chapssal',
        name: '찹쌀뭉치',
        image: '/assets/images/characters/mungchi/chapssal/rank_1.webp',
        finalImage: '/assets/images/characters/mungchi/chapssal/rank_5.webp',
        color: '#CAFFBF',
        glow: 'rgba(100,200,80,0.55)',
        desc: '목표를 세우면 멈추지 않아요! 🌿',
        imageScale: 1.45,
        translateY: '10px'
    },
];

const CharacterSelectionScreen = ({ onSelect, onBack }) => {
    const [selected, setSelected] = useState(null);
    const [nickname, setNickname] = useState('');
    const nicknameRef = useRef(null);

    const selectedChar = CHARACTERS.find(c => c.id === selected);
    // DOM ref로도 확인하여 React 상태 동기화 문제 방지
    const canConfirm = selected && nickname.trim().length > 0;

    const handleConfirm = () => {
        const actualNick = nicknameRef.current ? nicknameRef.current.value.trim() : nickname.trim();
        if (selected && actualNick.length > 0) {
            onSelect(selected, actualNick);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full z-[100] flex flex-col items-center justify-center aesthetic-space-bg bg-[#f6edff] overflow-hidden">
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 md:gap-12 relative z-50 px-4 pt-10 pb-8 md:pt-14 md:pb-10 md:px-10 max-w-4xl mx-auto">
                {/* Back Button */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="absolute top-4 left-4 md:top-8 md:left-8 clay-button px-4 py-2.5 rounded-2xl flex items-center gap-2 text-slate-600 dark:text-slate-300 font-black active:scale-95 z-[60]"
                    >
                        <span className="text-lg">←</span>
                        <span className="text-sm">뒤로</span>
                    </button>
                )}

                {/* Title */}
                <h2 className="text-2xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-200 premium-text-shadow text-center leading-tight shrink-0 tracking-tight mb-2">
                    함께할 파트너를 선택하세요! ✨
                </h2>

                {/* 닉네임 입력 */}
                <div className="w-full max-w-xs md:max-w-sm shrink-0">
                    <input
                        ref={nicknameRef}
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value.slice(0, 10))}
                        placeholder="나의 이름을 입력하세요 (최대 10자)"
                        maxLength={10}
                        className="w-full rounded-2xl border-4 border-white bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-center text-base md:text-lg px-4 py-3 shadow-md focus:outline-none focus:border-indigo-400 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                </div>

                {/* Cards row */}
                <div className="grid grid-cols-3 gap-3 md:gap-8 w-full items-center py-2 md:py-8">
                    {CHARACTERS.map((char) => {
                        const isSelected = selected === char.id;
                        return (
                            <button
                                key={char.id}
                                onClick={() => setSelected(char.id)}
                                className="group relative flex flex-col items-center justify-center rounded-[2rem] md:rounded-[3rem] transition-all duration-300 active:scale-95 focus:outline-none h-fit"
                                style={{
                                    padding: 'clamp(20px, 5vw, 40px) clamp(8px, 2vw, 24px)',
                                    backgroundColor: isSelected ? char.color + '28' : 'rgba(255,255,255,0.85)',
                                    border: isSelected ? `4px solid ${char.color}` : '4px solid rgba(255,255,255,0.9)',
                                    boxShadow: isSelected
                                        ? `0 0 0 4px ${char.glow}, 0 20px 50px ${char.glow}, 0 8px 20px rgba(0,0,0,0.15)`
                                        : '0 8px 24px rgba(0,0,0,0.10)',
                                    transform: isSelected ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                                    minHeight: 'clamp(280px, 60vh, 500px)'
                                }}
                            >
                                {/* Selected badge */}
                                {isSelected && (
                                    <div
                                        className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-8 h-8 md:w-11 md:h-11 rounded-full flex items-center justify-center font-black text-slate-700 text-sm md:text-lg z-20 border-[3px] border-white shadow-xl"
                                        style={{ backgroundColor: char.color }}
                                    >✓</div>
                                )}

                                {/* 쌀알(아기형) 원형 프레임 */}
                                <div className="flex items-center justify-center z-20 mb-2 md:mb-4">
                                    <div
                                        className="rounded-full border-[3px] md:border-4 border-white dark:border-slate-700 bg-white/90 dark:bg-slate-800 shadow-md overflow-hidden"
                                        style={{
                                            width: 'clamp(36px, 9vw, 64px)',
                                            height: 'clamp(36px, 9vw, 64px)',
                                        }}
                                    >
                                        <img
                                            src={char.image}
                                            alt="starter"
                                            className="w-full h-full object-contain p-1"
                                            style={{ transform: `scale(${char.imageScale})` }}
                                        />
                                    </div>
                                </div>

                                {/* 완성체 메인 이미지 */}
                                <div className="relative w-full flex items-center justify-center" style={{ height: 'clamp(140px, 28vw, 280px)' }}>
                                    <img
                                        src={char.finalImage}
                                        alt={char.name}
                                        className={`object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105`}
                                        style={{ width: '100%', height: '100%', transform: `translateY(${char.translateY})` }}
                                    />
                                </div>

                                {/* Name */}
                                <div className="mt-2 md:mt-4 flex flex-col items-center gap-2 w-full">
                                    <span
                                        className="font-black text-slate-800 dark:text-slate-200 text-center leading-tight tracking-tight break-keep"
                                        style={{ fontSize: 'clamp(10px, 3vw, 20px)' }}
                                    >
                                        {char.name}
                                    </span>
                                    {/* Color bar */}
                                    <div className="w-12 md:w-16 h-1.5 md:h-2 rounded-full" style={{ backgroundColor: char.color }} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile desc */}
                <div className="h-16 flex items-center justify-center shrink-0">
                    {selectedChar ? (
                        <p className="text-sm md:text-lg font-bold text-slate-600 dark:text-slate-300 text-center px-4 animate-in fade-in slide-in-from-bottom-2 duration-300 break-keep">
                            {selectedChar.desc}
                        </p>
                    ) : (
                        <p className="text-sm md:text-lg font-bold text-slate-400 dark:text-slate-500 text-center px-4">
                            가장 마음에 드는 뭉치를 골라보세요!
                        </p>
                    )}
                </div>

                {/* Confirm button */}
                <button
                    onClick={handleConfirm}
                    disabled={!selected}
                    className="shrink-0 w-full max-w-xs md:max-w-md font-black text-lg md:text-2xl rounded-[2rem] border-4 border-white shadow-2xl transition-all duration-300"
                    style={{
                        padding: 'clamp(16px, 3.5vw, 28px) 24px',
                        backgroundColor: canConfirm ? selectedChar.color : '#e2e8f0',
                        color: canConfirm ? '#1e293b' : '#94a3b8',
                        boxShadow: canConfirm
                            ? `0 8px 0 rgba(0,0,0,0.18), 0 16px 40px ${selectedChar.glow}`
                            : 'none',
                        transform: canConfirm ? 'translateY(0)' : 'none',
                        cursor: canConfirm ? 'pointer' : 'not-allowed',
                    }}
                >
                    {canConfirm
                        ? `✨ ${nickname.trim()}의 파트너, ${selectedChar.name}!`
                        : selected ? '이름을 입력해주세요' : '파트너를 선택해주세요'}
                </button>
            </div>
        </div>
    );
};

export default CharacterSelectionScreen;
