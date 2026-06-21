import { useEffect, useRef, useState } from 'react';
import { getRankDetails, levelToImageRank, getLevel } from '../utils/rankUtils.js';
import { shareImageToKakao } from '../utils/kakaoShare.js';
import ResultModalShell, {
    ResultModalActions,
    ResultModalHeading,
    ResultPrimaryButton,
    ResultShareButton,
} from './common/ResultModalShell.jsx';

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

    const timerRef = useRef(null);
    const modalRef = useRef(null);
    const [shareStatus, setShareStatus] = useState('');

    useEffect(() => {
        timerRef.current = setTimeout(onClose, 8000);
        return () => clearTimeout(timerRef.current);
    }, [onClose]);

    const handleShare = async () => {
        clearTimeout(timerRef.current);
        setShareStatus('화면 캡처 중...');
        try {
            let file = null;
            if (modalRef.current) {
                const { default: html2canvas } = await import('html2canvas');
                const canvas = await html2canvas(modalRef.current, { scale: 2, useCORS: true, backgroundColor: null });
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
                if (blob) file = new File([blob], 'hanjapop-rankup.png', { type: 'image/png' });
            }
            setShareStatus('카카오톡 연결 중...');
            await shareImageToKakao({
                file,
                title: `${details.name}이(가) ${details.rankName} 단계로 진화했어요!`,
                description: `한자팝 ${rankLabel} 달성`,
                fallbackText: `한자팝 ${rankLabel}!\n${details.name}이(가) ${details.rankName} 단계로 진화했어요!`,
            });
            setShareStatus('카카오톡 공유를 열었어요');
        } catch (error) {
            if (error?.name === 'AbortError' || /cancel|close|canceled/i.test(String(error?.message || error))) {
                setShareStatus(''); return;
            }
            setShareStatus('공유에 실패했어요.');
        }
        setTimeout(() => setShareStatus(''), 3500);
    };

    return (
        <ResultModalShell
            ref={modalRef}
            className="rank-up-overlay"
            cardClassName="flex flex-col items-center overflow-hidden"
            onBackdropClick={onClose}
            labelledBy="rank-up-title"
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
            <ResultModalHeading
                id="rank-up-title"
                kicker={rankLabel}
                title="축하해요!"
                description={<>
                    <span className="font-normal" style={{ color: colors.to }}>{details.name}</span>이(가)<br/>
                    <span className="font-normal text-slate-700 dark:text-slate-100">{details.rankName}</span> 단계로 진화했어요!
                </>}
            />

            {/* 버튼 영역 */}
            <ResultModalActions className="relative z-10 mt-6">
                <ResultShareButton
                    onClick={handleShare}
                    title="카카오톡으로 자랑하기"
                    subtitle={`${rankLabel}을 친구에게 공유해요`}
                />
                {shareStatus && <p className="text-[11px] text-slate-400">{shareStatus}</p>}
                <ResultPrimaryButton onClick={onClose}>확인</ResultPrimaryButton>
            </ResultModalActions>

            <p className="relative z-10 mt-3 text-xs text-slate-400 font-normal">
                화면을 터치해도 닫힙니다
            </p>
        </ResultModalShell>
    );
};

export default RankUpModal;
