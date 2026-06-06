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

const getRankSoonMessage = () => {
    const count = Number(localStorage.getItem(RANK_SOON_COUNTER_KEY) || '0');
    localStorage.setItem(RANK_SOON_COUNTER_KEY, String(count + 1));
    const isTypeB = count % 2 === 1;
    const pool = isTypeB ? RANK_SOON_B : RANK_SOON_A;
    return { message: pool[Math.floor(Math.random() * pool.length)], isTypeB };
};

const CharacterToast = ({ type, selectedCharacter, userXp, nextRankAvatar, onDismiss, onAction }) => {
    const xp = userXp ?? getStoredXp();
    const avatar = getRankDetails(xp, selectedCharacter).avatar;
    const isMission  = type === 'mission_complete';
    const isRankUp   = type === 'rank_up';
    const isRankSoon = type === 'rank_soon';

    const { message, isTypeB } = isRankSoon
        ? getRankSoonMessage()
        : { message: (MESSAGES[type] || MESSAGES.review_reminder)[Math.floor(Math.random() * (MESSAGES[type] || MESSAGES.review_reminder).length)], isTypeB: false };

    useEffect(() => {
        const dur = isRankUp ? 6000 : isMission ? 5000 : isRankSoon ? 5000 : 4000;
        const timer = setTimeout(onDismiss, dur);
        return () => clearTimeout(timer);
    }, [onDismiss, isMission, isRankUp, isRankSoon]);

    return (
        <div
            className="fixed bottom-8 left-1/2 z-[200] flex items-end gap-3.5 animate-in slide-in-from-bottom-4 fade-in duration-400 w-[calc(100%-2.5rem)] sm:w-full"
            style={{ transform: 'translateX(-50%)', maxWidth: 'min(92vw, 400px)' }}
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
                className="relative flex-1 rounded-[1.8rem] rounded-bl-none px-5 py-3.5 shadow-2xl border-4 transition-all duration-300 min-w-0"
                style={{
                    backgroundColor: isRankUp ? 'rgba(255, 248, 230, 0.98)' : isMission ? 'rgba(255, 253, 245, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    borderColor: isRankUp ? '#FF9B73' : isRankSoon ? '#BDB2FF' : isMission ? '#FFD480' : '#2ED6C5',
                    boxShadow: isRankUp
                        ? '0 12px 30px rgba(255, 155, 115, 0.25), 0 4px 10px rgba(0,0,0,0.03)'
                        : isMission
                        ? '0 12px 30px rgba(255, 180, 51, 0.18), 0 4px 10px rgba(0, 0, 0, 0.03)'
                        : '0 12px 30px rgba(46, 214, 197, 0.15), 0 4px 10px rgba(0, 0, 0, 0.03)',
                }}
            >
                <p className="text-slate-700 font-extrabold text-sm leading-snug break-keep whitespace-normal">{message}</p>

                {/* B타입: 다음 단계 미리보기 이미지 */}
                {isRankSoon && isTypeB && nextRankAvatar && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#F5F5FF] border-2 border-[#BDB2FF] overflow-hidden flex items-center justify-center shrink-0">
                            <img src={nextRankAvatar} alt="next rank" className="w-full h-full object-contain p-0.5" />
                        </div>
                        <p className="text-[11px] font-bold text-[#7C83FF]">다음 단계 모습 미리보기</p>
                    </div>
                )}

                {isMission && (
                    <p className="text-[#FF9B73] font-black text-xs mt-1 animate-pulse">+200 보너스 XP 획득!</p>
                )}
                {isRankUp && (
                    <p className="text-[#FF9B73] font-black text-xs mt-1 animate-pulse">새로운 모습으로 진화했어요!</p>
                )}
                {!isMission && !isRankSoon && !isRankUp && onAction && (
                    <div className="mt-2 flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold text-[#AEB7C5]">오답 단어장과 퀴즈를 모두 완료하면 50 XP 획득!</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); onAction(); onDismiss(); }}
                            className="px-4 py-1.5 bg-[#2ED6C5] text-white font-extrabold text-xs rounded-full active:scale-95 transition-transform self-start"
                        >
                            복습하기 →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharacterToast;
