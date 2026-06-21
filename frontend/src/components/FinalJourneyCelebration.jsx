import { useEffect, useState } from 'react';
import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../utils/rankUtils.js';
import { SK } from '../constants/storageKeys.js';
import { getKakaoShareConfig, shareMasterAchievementToKakao } from '../utils/kakaoShare.js';

const CONFETTI = Array.from({ length: 28 }, (_, index) => ({
    id: index,
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 8) * 0.16}s`,
    duration: `${2.8 + (index % 5) * 0.34}s`,
    rotate: `${(index * 71) % 360}deg`,
    color: ['#FFD76A', '#FF8F73', '#7C83FF', '#2ED6C5', '#FFFFFF'][index % 5],
}));

const playFinalFanfare = () => {
    try {
        if (localStorage.getItem(SK.SFX_ON) === 'false') return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const context = new AudioCtx();
        const start = context.currentTime + 0.04;
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = index === 3 ? 'sine' : 'triangle';
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, start + index * 0.13);
            gain.gain.exponentialRampToValueAtTime(0.12, start + index * 0.13 + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.13 + 0.55);
            oscillator.connect(gain).connect(context.destination);
            oscillator.start(start + index * 0.13);
            oscillator.stop(start + index * 0.13 + 0.6);
        });
        window.setTimeout(() => context.close().catch(() => {}), 1800);
    } catch {
        // 브라우저 자동 재생 제한 시 시각 효과만 유지한다.
    }
};

const loadShareImage = src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

const createMasterShareFile = async ({ characterImage, nickname, hanjaCount, completedDate }) => {
    if (typeof document === 'undefined' || typeof File === 'undefined') return null;
    await document.fonts?.ready;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const background = ctx.createLinearGradient(0, 0, 1080, 1080);
    background.addColorStop(0, '#292A63');
    background.addColorStop(0.52, '#5861C6');
    background.addColorStop(1, '#2C285D');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1080, 1080);

    const glow = ctx.createRadialGradient(540, 260, 10, 540, 260, 360);
    glow.addColorStop(0, 'rgba(255,220,112,0.42)');
    glow.addColorStop(1, 'rgba(255,220,112,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 600);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFE39A';
    ctx.font = '600 30px SUIT, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('HANJAPOP GRAND FINALE', 540, 75);
    ctx.letterSpacing = '0px';

    try {
        const character = await loadShareImage(characterImage);
        const ratio = Math.min(280 / character.width, 280 / character.height);
        const width = character.width * ratio;
        const height = character.height * ratio;
        ctx.drawImage(character, 540 - width / 2, 48 + (280 - height) / 2, width, height);
    } catch {
        // 이미지 로딩에 실패해도 인증서 텍스트는 공유한다.
    }

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '500 36px SUIT, sans-serif';
    ctx.fillText('124일의 탐험을 모두 마쳤어요', 540, 370);
    ctx.fillStyle = '#FFF0A7';
    ctx.font = '700 68px GmarketSans, SUIT, sans-serif';
    ctx.fillText('한자팝 마스터 탄생!', 540, 450);

    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(90, 500, 900, 400, 46);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFE39A';
    ctx.font = '600 28px SUIT, sans-serif';
    ctx.fillText('한자 탐험 완주 인증서', 540, 565);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 62px GmarketSans, SUIT, sans-serif';
    ctx.fillText(nickname || '탐험가', 540, 645);

    const statX = [285, 540, 795];
    const statValues = ['124', String(hanjaCount), '100%'];
    const statLabels = ['단계', '한자', '완주'];
    statX.forEach((x, index) => {
        ctx.fillStyle = '#FFF0A7';
        ctx.font = '700 50px SUIT, sans-serif';
        ctx.fillText(statValues[index], x, 755);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '400 25px SUIT, sans-serif';
        ctx.fillText(statLabels[index], x, 798);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.font = '400 25px SUIT, sans-serif';
    ctx.fillText(`${completedDate} · HANJAPOP`, 540, 865);

    ctx.fillStyle = '#FFE39A';
    ctx.font = '600 34px SUIT, sans-serif';
    ctx.fillText('황금 124 완주 배지 획득', 540, 980);
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = '400 25px SUIT, sans-serif';
    ctx.fillText('한자팝에서 당신의 탐험을 시작해보세요', 540, 1028);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
    return blob ? new File([blob], 'hanjapop-master.png', { type: 'image/png' }) : null;
};

export default function FinalJourneyCelebration({
    selectedCharacter,
    userNickname,
    hanjaCount = 369,
    onComplete,
}) {
    const completedDate = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date());
    const characterImage = getCharacterImage(selectedCharacter, 'success');
    const [claiming, setClaiming] = useState(false);
    const [shareFile, setShareFile] = useState(null);
    const [shareStatus, setShareStatus] = useState('');

    useEffect(() => {
        playFinalFanfare();
    }, []);

    useEffect(() => {
        let active = true;
        createMasterShareFile({ characterImage, nickname: userNickname, hanjaCount, completedDate })
            .then(file => { if (active) setShareFile(file); })
            .catch(() => {});
        return () => { active = false; };
    }, [characterImage, userNickname, hanjaCount, completedDate]);

    const handleShare = async () => {
        const nickname = userNickname || '탐험가';
        const url = getKakaoShareConfig().shareUrl || window.location.origin;
        const text = `${nickname}님이 한자팝 124일 탐험을 완주하고 한자팝 마스터가 되었어요!`;
        setShareStatus('카카오톡 연결 중...');
        try {
            const result = await shareMasterAchievementToKakao({
                file: shareFile,
                nickname,
                hanjaCount,
            });
            setShareStatus(result.imageFallback ? '이미지 없이 카카오톡 공유를 열었어요' : '카카오톡 공유를 열었어요');
        } catch (error) {
            if (error?.name === 'AbortError' || /cancel|close|canceled/i.test(String(error?.message || error))) {
                setShareStatus('');
                return;
            }
            const data = { title: '한자팝 마스터 탄생!', text, url };
            if (shareFile && navigator.canShare?.({ files: [shareFile] })) data.files = [shareFile];
            try {
                if (navigator.share) {
                    await navigator.share(data);
                    setShareStatus(`${error?.message || '카카오 연동 실패'} · 기본 공유로 열었어요`);
                } else {
                    await navigator.clipboard.writeText(`${text}\n${url}`);
                    setShareStatus(`${error?.message || '카카오 연동 실패'} · 공유 문구를 복사했어요`);
                }
            } catch (fallbackError) {
                if (fallbackError?.name === 'AbortError') {
                    setShareStatus('');
                    return;
                }
                setShareStatus(error?.message || '카카오톡 공유를 열 수 없어요.');
            }
        }
        window.setTimeout(() => setShareStatus(''), 4200);
    };

    return (
        <div className="final-journey-screen fixed inset-0 z-[500] overflow-y-auto overflow-x-hidden">
            <div className="final-journey-confetti" aria-hidden="true">
                {CONFETTI.map(piece => (
                    <span
                        key={piece.id}
                        className="final-journey-confetti-piece"
                        style={{
                            '--confetti-left': piece.left,
                            '--confetti-delay': piece.delay,
                            '--confetti-duration': piece.duration,
                            '--confetti-rotate': piece.rotate,
                            '--confetti-color': piece.color,
                        }}
                    />
                ))}
            </div>

            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
                <defs>
                    <filter id="stamp-rough" x="-15%" y="-15%" width="130%" height="130%">
                        <feTurbulence type="turbulence" baseFrequency="0.07" numOctaves="2" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            </svg>

            <main className="final-journey-content">
                <p className="final-journey-kicker">HANJAPOP GRAND FINALE</p>

                <div className="final-journey-character-wrap">
                    <div className="final-journey-halo" />
                    <img
                        src={characterImage}
                        alt="완주를 축하하는 캐릭터"
                        className="final-journey-character"
                        style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
                    />
                    <div className="final-journey-crown" aria-hidden="true">♛</div>
                </div>

                <section className="final-journey-heading">
                    <span>124일의 탐험을 모두 마쳤어요</span>
                    <h1>한자팝 마스터 탄생!</h1>
                    <p>{userNickname || '탐험가'}님, 끝까지 걸어온 오늘을 오래 기억할게요.</p>
                </section>

                <section className="final-journey-rewards" aria-label="완주 보상">
                    <div className="final-journey-badge" aria-hidden="true">
                        <span className="final-journey-badge-crown">★</span>
                        <strong>124</strong>
                        <small>MASTER</small>
                    </div>
                    <div className="final-journey-reward-copy">
                        <span>완주 한정 보상</span>
                        <strong>황금 124 완주 배지</strong>
                        <p>한자팝 마스터 칭호 · 보너스 +1,240 XP</p>
                    </div>
                </section>

                <section className="final-journey-certificate">
                    <p>한자 탐험 완주 인증서</p>
                    <h2>{userNickname || '탐험가'}</h2>
                    <div className="final-journey-certificate-stats">
                        <span><strong>124</strong>단계</span>
                        <span><strong>{hanjaCount}</strong>한자</span>
                        <span><strong>100%</strong>완주</span>
                    </div>
                    <small>{completedDate} · HANJAPOP</small>
                </section>

                <div className="final-journey-actions">
                    <button className="final-journey-action-button final-journey-share" onClick={handleShare}>
                        <span>카카오톡으로 자랑하기</span>
                        <small>완주 인증서를 친구에게 공유해요</small>
                    </button>
                    {shareStatus && <p className="final-journey-share-status" aria-live="polite">{shareStatus}</p>}
                    <button
                        className="final-journey-action-button final-journey-cta"
                        disabled={claiming}
                        onClick={() => {
                            if (claiming) return;
                            setClaiming(true);
                            onComplete?.();
                        }}
                    >
                        <span>{claiming ? '보상 저장 중...' : '마스터 보상 받고 홈으로'}</span>
                        <small>칭호와 배지가 프로필에 영구 보관됩니다</small>
                    </button>
                </div>
            </main>
        </div>
    );
}
