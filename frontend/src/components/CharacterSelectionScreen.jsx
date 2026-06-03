import { useState, useRef } from 'react';

const CHARACTERS = [
    {
        id: 'garae',
        name: '가래뭉치',
        image: '/assets/images/characters/garae/rank_1.webp',
        finalImage: '/assets/images/characters/garae/rank_5.webp',
        color: '#FF9EBB',
        glow: 'rgba(255,107,157,0.55)',
        desc: '용감하고 명랑해요 — 언제나 제일 먼저 손을 들어요! 🍡',
        imageScale: 1,
        translateY: '15px'
    },
    {
        id: 'jeolmi',
        name: '절미뭉치',
        image: '/assets/images/characters/jeolmi/rank_1.webp',
        finalImage: '/assets/images/characters/jeolmi/rank_5.webp',
        color: '#FFDAC1',
        glow: 'rgba(255,160,80,0.55)',
        desc: '다정하고 호기심이 많아요 — 반짝이는 스티커를 좋아해요!',
        imageScale: 1,
        translateY: '25px'
    },
    {
        id: 'chapssal',
        name: '찹쌀뭉치',
        image: '/assets/images/characters/chapssal/rank_1.webp',
        finalImage: '/assets/images/characters/chapssal/rank_5.webp',
        color: '#CAFFBF',
        glow: 'rgba(100,200,80,0.55)',
        desc: '목표를 세우면 멈추지 않아요!',
        imageScale: 1.45,
        translateY: '10px'
    },
    {
        id: 'muzi',
        name: '무지뭉치',
        image: '/assets/images/characters/muzi/rank_1.webp',
        finalImage: '/assets/images/characters/muzi/rank_5.webp',
        color: '#E0BBE4',
        glow: 'rgba(180,120,200,0.55)',
        desc: '무지개처럼 다양한 매력을 가졌어요!',
        imageScale: 1.1,
        translateY: '15px'
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

    // 캐릭터 + 이름 모두 선택되면 자동 진행
    const handleNicknameKeyDown = (e) => {
        if (e.key === 'Enter' && canConfirm) handleConfirm();
    };

    return (
        <div className="fixed inset-0 w-full z-[100] bg-[#F7FAF9] overflow-y-auto">
            <div className="w-full min-h-full flex flex-col items-center justify-center gap-6 md:gap-10 relative z-50 px-4 pt-10 safe-bottom md:px-10 max-w-5xl mx-auto">
                {/* 헤더 */}
                <div className="w-full shrink-0 safe-top pt-4 px-4 mb-2">
                    <div className="quiz-header-card quiz-header-card--wide">
                        {onBack && (
                            <button onClick={onBack}
                                className="flex items-center justify-center bg-white/90 border-2 border-white rounded-2xl shadow-lg active:scale-95 transition-all px-3 py-2 font-black text-[#5B677A] gap-1">
                                ←
                            </button>
                        )}
                        <div className="flex items-center gap-2 overflow-hidden">
                            <h2 className="text-lg font-black text-slate-700 m-0">캐릭터 선택</h2>
                        </div>
                        <div className="w-[60px]" />
                    </div>
                </div>


                {/* 닉네임 입력 */}
                <div className="w-full max-w-xs md:max-w-sm shrink-0">
                    <input
                        ref={nicknameRef}
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value.slice(0, 10))}
                        onKeyDown={handleNicknameKeyDown}
                        placeholder="NAME YOUR CHARACTER"
                        maxLength={10}
                        className="w-full rounded-full border border-[#E9EDF2] bg-white text-[#5D544F] font-medium text-center text-lg px-6 py-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C3C6FF] transition-all placeholder:text-[#AEB7C5]"
                    />
                </div>

                {/* Cards row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full items-center">

                    {CHARACTERS.map((char) => {
                        const isSelected = selected === char.id;
                        return (
                            <button
                                key={char.id}
                                onClick={() => { setSelected(char.id); setTimeout(() => nicknameRef.current?.focus(), 50); }}
                                className={`group relative flex flex-col items-center justify-center rounded-[3rem] transition-all duration-500 active:scale-95 focus:outline-none h-[380px] md:h-[450px] p-8 border ${
                                    isSelected 
                                        ? "bg-white border-[#7C83FF] shadow-2xl shadow-[#C3C6FF]/50 scale-[1.02]" 
                                        : "bg-white/50 border-[#E9EDF2] hover:bg-white hover:border-[#E9EDF2] shadow-sm"
                                }`}
                            >
                                {/* Selected badge */}
                                {isSelected && (
                                    <div
                                        className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-lg z-20 border-4 border-white shadow-xl bg-[#7C83FF] animate-in zoom-in duration-300"
                                    >✓</div>
                                )}

                                {/* 쌀알(아기형) 원형 프레임 */}
                                <div className="flex items-center justify-center z-20 mb-4">
                                    <div className="w-14 h-14 rounded-full border border-[#E9EDF2] bg-[#F8FAF9] flex items-center justify-center overflow-hidden">
                                        <img
                                            src={char.image}
                                            alt="starter"
                                            className="w-full h-full object-contain p-1.5"
                                            style={{ transform: `scale(${char.imageScale})` }}
                                        />
                                    </div>
                                </div>

                                {/* 완성체 메인 이미지 */}
                                <div className="relative w-full flex-1 flex items-center justify-center">
                                    <img
                                        src={char.finalImage}
                                        alt={char.name}
                                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
                                        style={{ transform: `translateY(${char.translateY})` }}
                                    />
                                </div>

                                {/* Name */}
                                <div className="mt-4 flex flex-col items-center gap-2 w-full">
                                    <span className="font-extrabold text-[#5D544F] text-lg tracking-tight uppercase text-center break-keep">
                                        {char.name}
                                    </span>
                                    {/* Color bar */}
                                    <div className="w-10 h-1 rounded-full bg-[#F4F7F8] overflow-hidden">
                                        <div className="h-full w-full" style={{ backgroundColor: char.color }} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile desc */}
                <div className="h-12 flex items-center justify-center shrink-0">
                    {selectedChar ? (
                        <p className="text-sm md:text-base font-bold text-[#AEB7C5] text-center px-4 animate-in fade-in slide-in-from-bottom-2 duration-300 break-keep">
                            {selectedChar.desc}
                        </p>
                    ) : (
                        <p className="text-sm md:text-base font-bold text-[#AEB7C5] text-center px-4 tracking-tight uppercase">
                            Pick Your Partner to Begin
                        </p>
                    )}
                </div>

                {/* Confirm button */}
                <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className={`pill-button-primary w-full max-w-sm py-5 text-xl transition-all duration-500 ${!canConfirm ? "!bg-[#F4F7F8] !text-[#AEB7C5] !cursor-not-allowed shadow-none border-none" : ""}`}
                >
                    {canConfirm
                        ? `START WITH ${nickname.trim()} & ${selectedChar.name}! ✨`
                        : selected ? 'PLEASE ENTER YOUR NAME' : 'PLEASE SELECT A PARTNER'}
                </button>
            </div>
        </div>
    );
};

export default CharacterSelectionScreen;
