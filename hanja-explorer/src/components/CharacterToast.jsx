import { useEffect } from 'react';
import { getRankDetails } from '../utils/rankUtils.js';
import { SK } from '../constants/storageKeys.js';

const getStoredXp = () => {
    try { return Number(localStorage.getItem(SK.USER_XP) || '0'); } catch { return 0; }
};

// A타입: 현재 감정 (홀수 번째 노출)
const RANK_SOON_A = [
    '뭔가... 몸이 근질근질해요. 곧 변할 것 같아요!',
    '껍질이 갑갑해요. 얼른 새로운 모습이 되고 싶어요!',
    '슬슬 부화하고 싶어지는걸요? 조금만 더 힘내봐요!',
    '이 느낌... 곧 진화할 것 같은 예감이에요!',
    '조금만 더... 조금만 더 하면 될 것 같은데요!',
];

// B타입: 다음 단계 미리보기 (짝수 번째 노출)
const RANK_SOON_B = [
    '다음 단계 모습, 보고 싶지 않으세요?',
    '이렇게 멋진 모습으로 변신할 수 있어요!',
    '조금만 더 하면 새로운 모습을 만날 수 있어요!',
    '다음 단계가 기다리고 있어요. 얼마 안 남았어요!',
    '이 모습으로 변신하면 어떨까요? 함께 달려봐요!',
];

const DAILY_CHEER = [
    '오늘도 한자 공부 하러 왔군요! 같이 달려봐요!',
    '꾸준히 하는 게 최고예요. 오늘도 화이팅!',
    '한 글자씩 쌓이다 보면 어느새 실력이 쑥 올라있을 거예요!',
    '오늘 배운 한자, 평생 기억에 남을 거예요!',
    '천 리 길도 한 걸음부터! 오늘도 한 걸음 내딛어봐요',
    '같이 공부하니까 든든해요. 오늘도 잘 부탁해요!',
];

const MESSAGES = {
    review_reminder: [
        '틀렸던 한자들이 기다리고 있어요! 같이 복습해봐요',
        '틀렸던 것들, 오늘 다시 도전해봐요! ✨',
    ],
    mission_complete: [
        '오늘 미션 완료! 대단해요, 이 기세로 계속 가봐요!',
        '모든 미션을 클리어했어요! 오늘 정말 열심히 했군요!',
        '완벽한 하루예요! 보너스 XP를 드려요! ⭐',
    ],
    rank_up: [
        '짠! 드디어 진화했어요! 새로운 모습이 기대되지 않나요?',
        '레벨업 완료! 이제 더 강해진 모습으로 함께해요!',
        '진화 성공! 앞으로도 같이 달려봐요!',
    ],
};

const RANK_SOON_COUNTER_KEY = 'rank_soon_counter';

const getRankSoonMessage = (nearRankUp = true) => {
    if (!nearRankUp) {
        return { message: DAILY_CHEER[Math.floor(Math.random() * DAILY_CHEER.length)], isTypeB: false };
    }
    const count = Number(localStorage.getItem(RANK_SOON_COUNTER_KEY) || '0');
    localStorage.setItem(RANK_SOON_COUNTER_KEY, String(count + 1));
    const isTypeB = count % 2 === 1;
    const pool = isTypeB ? RANK_SOON_B : RANK_SOON_A;
    return { message: pool[Math.floor(Math.random() * pool.length)], isTypeB };
};

const CharacterToast = ({ type, selectedCharacter, userXp, nextRankAvatar, nearRankUp = false, onDismiss, onAction }) => {
    const xp = userXp ?? getStoredXp();
    const avatar = getRankDetails(xp, selectedCharacter).avatar;
    const isMission  = type === 'mission_complete';
    const isRankUp   = type === 'rank_up';
    const isRankSoon = type === 'rank_soon';

    const { message, isTypeB } = isRankSoon
        ? getRankSoonMessage(nearRankUp)
        : { message: (MESSAGES[type] || MESSAGES.review_reminder)[Math.floor(Math.random() * (MESSAGES[type] || MESSAGES.review_reminder).length)], isTypeB: false };

    useEffect(() => {
        const dur = isRankUp ? 6000 : isMission ? 5000 : isRankSoon ? 5000 : 4000;
        const timer = setTimeout(onDismiss, dur);
        return () => clearTimeout(timer);
    }, [onDismiss, isMission, isRankUp, isRankSoon]);

    return (
        <div
            className="fixed top-1/2 left-1/2 z-[200] flex items-start gap-3.5 animate-in fade-in duration-400 w-[calc(100%-2.5rem)] sm:w-full"
            style={{ transform: 'translate(-50%, -50%)', maxWidth: 'min(92vw, 400px)' }}
            onClick={onDismiss}
        >
            {/* 현재 캐릭터 아바타 */}
            <div
                className="shrink-0 w-16 h-16 rounded-full bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.12))' }}
            >
                <img src={avatar} alt="character" className="w-full h-full object-contain p-1" />
            </div>

            {/* 말풍선 */}
            <div
                className="char-toast-bubble relative flex-1 rounded-[1.8rem] rounded-tl-none px-5 py-3.5 shadow-2xl transition-all duration-300 min-w-0 backdrop-blur-xl"
                style={{
                    '--toast-bg': isRankUp ? 'rgba(30, 27, 75, 0.85)' : isMission ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.85)',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0,0,0,0.15)',
                }}
            >
                <p className="text-white font-normal text-sm leading-snug break-keep whitespace-normal drop-shadow-md">{message}</p>

                {/* B타입: 다음 단계 미리보기 이미지 */}
                {isRankSoon && isTypeB && nextRankAvatar && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800/80 border-2 border-[#A5B4FC] overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                            <img src={nextRankAvatar} alt="next rank" className="w-full h-full object-contain p-0.5" />
                        </div>
                        <p className="text-[11px] font-medium text-[#A5B4FC] drop-shadow-sm">다음 단계 모습 미리보기</p>
                    </div>
                )}

                {isMission && (
                    <p className="text-[#FFB393] font-medium text-xs mt-1 animate-pulse drop-shadow-sm">+200 보너스 XP 획득!</p>
                )}
                {isRankUp && (
                    <p className="text-[#FFB393] font-medium text-xs mt-1 animate-pulse drop-shadow-sm">새로운 모습으로 진화했어요!</p>
                )}
                {!isMission && !isRankSoon && !isRankUp && onAction && (
                    <div className="mt-2 flex flex-col gap-2">
                        <p className="text-[10.5px] font-normal text-slate-300 drop-shadow-sm">오답 단어장과 퀴즈를 모두 완료하면 50 XP 획득!</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); onAction(); onDismiss(); }}
                            className="px-4 py-1.5 bg-gradient-to-r from-[#2ED6C5] to-[#26B2A4] text-white font-medium text-xs rounded-full active:scale-95 transition-transform self-start shadow-lg shadow-[#2ED6C5]/30 hover:shadow-[#2ED6C5]/50"
                        >
                            복습하기 ›
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharacterToast;
