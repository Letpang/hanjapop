import { useEffect } from 'react';
import { getRankDetails, levelToImageRank, getLevel } from '../utils/rankUtils.js';

const RANK_LABELS = {
    2: '2단계 진화',
    3: '3단계 진화',
    4: '4단계 진화',
    5: '최종 진화',
};

const RANK_COLORS = {
    2: { from: '#A5A9F8', to: '#6B72EF', glow: 'rgba(100,108,240,0.35)' },
    3: { from: '#2ED6C5', to: '#0D9488', glow: 'rgba(46,214,197,0.35)' },
    4: { from: '#FFB393', to: '#FF6B6B', glow: 'rgba(255,107,107,0.35)' },
    5: { from: '#FFD700', to: '#FF9B73', glow: 'rgba(255,215,0,0.4)' },
};

const RankUpModal = ({ selectedCharacter, userXp, onClose }) => {
    const level = getLevel(userXp);
    const imageRank = levelToImageRank(level);
    const details = getRankDetails(userXp, selectedCharacter);
    const colors = RANK_COLORS[imageRank] || RANK_COLORS[2];
    const rankLabel = RANK_LABELS[imageRank] || '진화';

    useEffect(() => {
        const t = setTimeout(onClose, 8000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center animate-in fade-in duration-500"
            style={{ background: `linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 60%, #fff 100%)` }}
            onClick={onClose}
        >
            <style>{`
                @keyframes rank-float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50%       { transform: translateY(-14px) scale(1.03); }
                }
                @keyframes rank-glow-pulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50%       { opacity: 1;   transform: scale(1.12); }
                }
                @keyframes rank-shine {
                    0%   { transform: translateX(-120%) rotate(25deg); }
                    100% { transform: translateX(320%) rotate(25deg); }
                }
                @keyframes rank-star {
                    0%   { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; }
                    30%  { opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(1.2) rotate(var(--rot)); opacity: 0; }
                }
            `}</style>

            {/* 별 파티클 */}
            {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute w-2 h-2 rounded-full pointer-events-none"
                    style={{
                        background: i % 2 === 0 ? colors.from : colors.to,
                        top: `${30 + Math.sin(i * 45 * Math.PI / 180) * 25}%`,
                        left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 30}%`,
                        '--tx': `${(Math.random() - 0.5) * 80}px`,
                        '--ty': `${(Math.random() - 0.5) * 80}px`,
                        '--rot': `${Math.random() * 360}deg`,
                        animation: `rank-star 1.5s ease-out ${i * 0.15}s both`,
                    }}
                />
            ))}

            {/* 글로우 원 */}
            <div className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{
                    background: colors.glow,
                    animation: 'rank-glow-pulse 2s ease-in-out infinite',
                }}
            />

            {/* 캐릭터 이미지 */}
            <div className="relative z-10" style={{ animation: 'rank-float 3s ease-in-out infinite' }}>
                {/* 이미지 뒤 광택 */}
                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                    <div className="w-16 h-full bg-white/40 blur-sm"
                        style={{ animation: 'rank-shine 2.5s ease-in-out 0.5s infinite' }}
                    />
                </div>
                <img
                    src={details.avatar}
                    alt="evolved"
                    className="w-52 h-52 object-contain drop-shadow-2xl"
                    onClick={e => e.stopPropagation()}
                />
            </div>

            {/* 텍스트 */}
            <div className="relative z-10 mt-6 flex flex-col items-center gap-2 text-center px-6">
                <span className="text-xs font-black tracking-[0.2em] uppercase"
                    style={{ color: colors.to }}>
                    {rankLabel}
                </span>
                <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-800">
                    축하해요!
                </h1>
                <p className="text-base font-extrabold text-slate-500 mt-1">
                    <span className="font-black" style={{ color: colors.to }}>{details.name}</span>이(가)<br/>
                    <span className="font-black text-slate-700">{details.rankName}</span> 단계로 진화했어요!
                </p>
            </div>

            {/* 확인 버튼 */}
            <button
                onClick={onClose}
                className="relative z-10 mt-10 px-12 py-4 rounded-full font-black text-white text-lg active:scale-95 transition-all"
                style={{
                    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                    boxShadow: `0 8px 24px ${colors.glow}`,
                }}
            >
                확인
            </button>

            <p className="relative z-10 mt-4 text-xs text-slate-400 font-semibold">
                화면을 터치해도 닫힙니다
            </p>
        </div>
    );
};

export default RankUpModal;
