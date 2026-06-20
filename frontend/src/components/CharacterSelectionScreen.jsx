import { useState, useRef } from 'react';
import { getCharacterScale } from '../utils/rankUtils.js';

const CHARACTERS = [
    {
        id: 'garae',
        name: '가래뭉치',
        image: '/assets/images/characters/garae/rank_1.webp',
        finalImage: '/assets/images/characters/garae/rank_5.webp',
        color: '#FF9EBB',
        glow: 'rgba(255,107,157,0.6)',
        desc: '용감하고 명랑해요 — 언제나 제일 먼저 손을 들어요! 🍡',
    },
    {
        id: 'jeolmi',
        name: '절미뭉치',
        image: '/assets/images/characters/jeolmi/rank_1.webp',
        finalImage: '/assets/images/characters/jeolmi/rank_5.webp',
        color: '#FFB870',
        glow: 'rgba(255,160,80,0.6)',
        desc: '다정하고 호기심이 많아요 — 반짝이는 스티커를 좋아해요!',
    },
    {
        id: 'chapssal',
        name: '찹쌀뭉치',
        image: '/assets/images/characters/chapssal/rank_1.webp',
        finalImage: '/assets/images/characters/chapssal/rank_5.webp',
        color: '#82E0AA',
        glow: 'rgba(100,200,80,0.6)',
        desc: '목표를 세우면 멈추지 않아요!',
        cardTranslateY: '-18%',
    },
    {
        id: 'muzi',
        name: '무지뭉치',
        image: '/assets/images/characters/muzi/rank_1.webp',
        finalImage: '/assets/images/characters/muzi/rank_5.webp',
        color: '#D291BC',
        glow: 'rgba(180,120,200,0.6)',
        desc: '무지개처럼 다양한 매력을 가졌어요!',
    },
];

const hasFinalConsonant = (str) => {
    if (!str) return false;
    const code = str.charCodeAt(str.length - 1) - 0xAC00;
    return code >= 0 && code % 28 !== 0;
};

const CharacterSelectionScreen = ({ onSelect, onBack }) => {
    const [selected, setSelected] = useState(null);
    const [nickname, setNickname] = useState('');
    const nicknameRef = useRef(null);
    const [showInput, setShowInput] = useState(false);

    const selectedChar = CHARACTERS.find(c => c.id === selected);
    const canConfirm = selected && nickname.trim().length > 0;

    const handleConfirm = () => {
        const actualNick = nicknameRef.current ? nicknameRef.current.value.trim() : nickname.trim();
        if (selected && actualNick.length > 0) {
            onSelect(selected, actualNick);
        }
    };

    const handleNicknameKeyDown = (e) => {
        if (e.key === 'Enter' && canConfirm) handleConfirm();
    };

    const handleSelectCharacter = (charId) => {
        setSelected(charId);
        if (!showInput) {
            setShowInput(true);
        }
        setTimeout(() => nicknameRef.current?.focus(), 150);
    };

    const displayNick = nickname.trim() || (selectedChar ? selectedChar.name : '');

    return (
        <div className="fixed inset-0 w-full z-[100] bg-animated-gradient overflow-y-auto overflow-x-hidden">
            {/* 파티클 효과용 컨테이너 (옵션) */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent"></div>

            <div className="w-full min-h-full flex flex-col items-center justify-start gap-4 md:gap-8 relative z-50 px-4 pt-10 safe-bottom pb-12 md:px-10 max-w-5xl mx-auto">
                {/* 뒤로가기 헤더 */}
                <div className="w-full shrink-0 safe-top pt-2 px-2 flex justify-start">
                    {onBack && (
                        <button onClick={onBack} className="hp-nav-button glass-panel !w-12 !h-12 flex items-center justify-center rounded-full text-slate-600 hover:scale-105 active:scale-95 transition-all">
                            ←
                        </button>
                    )}
                </div>

                {/* 메인 타이틀 */}
                <div className="text-center mt-2 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-h2 md:text-h1 font-medium text-slate-800 tracking-tight text-balance leading-tight">
                        함께 한자를 배울<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C83FF] to-[#FF8D72]">나만의 파트너</span>를 선택하세요!
                    </h1>
                    <p className="mt-3 text-slate-500 text-body">
                        {selectedChar ? selectedChar.desc : '마음에 드는 캐릭터를 터치해 보세요'}
                    </p>
                </div>

                {/* Cards row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full items-stretch animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
                    {CHARACTERS.map((char, idx) => {
                        const isSelected = selected === char.id;
                        return (
                            <button
                                key={char.id}
                                onClick={() => handleSelectCharacter(char.id)}
                                className={`group relative flex flex-col items-center justify-between rounded-[2.5rem] overflow-hidden transition-all duration-500 focus:outline-none h-[280px] md:h-[340px] ${
                                    isSelected
                                        ? "glass-panel scale-[1.03] z-10"
                                        : "glass-panel hover:-translate-y-2 hover:bg-white dark:bg-slate-800/70 opacity-90 hover:opacity-100"
                                }`}
                                style={{
                                    borderColor: isSelected ? char.color : 'rgba(255,255,255,0.9)',
                                    boxShadow: isSelected ? `0 12px 40px ${char.glow}, inset 0 2px 0 rgba(255,255,255,1)` : '',
                                }}
                            >
                                {/* 선택 체크 배지 */}
                                {isSelected && (
                                    <div 
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm z-20 shadow-lg animate-in zoom-in duration-300"
                                        style={{ backgroundColor: char.color }}
                                    >
                                        ✓
                                    </div>
                                )}

                                {/* 메인 캐릭터 이미지 */}
                                <div className="relative flex-1 w-full flex items-center justify-center mt-6">
                                    <div
                                        className={`transition-transform duration-700 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
                                        style={{ transform: `translateY(${char.cardTranslateY ?? '0px'}) scale(${char.cardScale ?? getCharacterScale(char.id, 'rank5')})` }}
                                    >
                                        <img
                                            src={char.finalImage}
                                            alt={char.name}
                                            className={`max-h-[140px] md:max-h-[180px] object-contain drop-shadow-xl ${
                                                isSelected ? "animate-float" : "animate-float-delay"
                                            }`}
                                            style={{ animationDelay: `${idx * 0.2}s` }}
                                        />
                                    </div>
                                </div>

                                {/* 이름 라벨 */}
                                <div className="w-full flex flex-col items-center gap-2 pb-6 pt-2 shrink-0">
                                    <span className={`font-medium text-lg tracking-tight transition-colors duration-300 ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {char.name}
                                    </span>
                                    <div 
                                        className={`h-1.5 rounded-full transition-all duration-500 ${isSelected ? 'w-16' : 'w-8'}`} 
                                        style={{ backgroundColor: char.color }} 
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 닉네임 입력 및 확인 버튼 (Progressive Disclosure) */}
                <div 
                    className={`w-full max-w-md flex flex-col items-center gap-4 mt-4 transition-all duration-700 ease-out ${
                        showInput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
                >
                    <div className="w-full relative group">
                        <input
                            ref={nicknameRef}
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value.slice(0, 10))}
                            onKeyDown={handleNicknameKeyDown}
                            placeholder="캐릭터의 닉네임을 지어주세요"
                            maxLength={10}
                            className="w-full rounded-full glass-panel !bg-white dark:bg-slate-800/80 text-slate-800 font-medium text-center text-lg px-6 py-4 focus:outline-none focus:ring-4 focus:ring-white/50 transition-all placeholder:text-slate-400 placeholder:font-normal"
                        />
                    </div>

                    <button
                        onClick={canConfirm ? handleConfirm : undefined}
                        className={`w-full py-4 rounded-full text-lg font-medium transition-all duration-500 flex items-center justify-center ${
                            canConfirm
                                ? "bg-gradient-to-r from-[#7C83FF] to-[#5a62f5] text-white shadow-[0_8px_24px_rgba(124,131,255,0.4)] hover:shadow-[0_12px_32px_rgba(124,131,255,0.6)] hover:-translate-y-1 active:scale-95"
                                : "glass-panel text-slate-400 cursor-not-allowed"
                        }`}
                    >
                        {canConfirm
                            ? `${displayNick}${hasFinalConsonant(displayNick) ? '이와' : '와'} 함께 시작하기! ✨`
                            : '닉네임을 입력해 주세요'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CharacterSelectionScreen;
