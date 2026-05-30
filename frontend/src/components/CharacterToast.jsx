import { useEffect } from 'react';
import { getRankDetails } from '../utils/rankUtils.js';
import { SK } from '../constants/storageKeys.js';

const getStoredXp = () => {
    try { return Number(localStorage.getItem(SK.USER_XP) || '0'); } catch { return 0; }
};

const MESSAGES = {
    review_reminder: [
        '틀렸던 한자들이 기다리고 있어요! 같이 복습해봐요',
        '틀렸던 것들, 오늘 다시 도전해봐요! ✨',
    ],
    mission_complete: [
        '오늘 미션 완료! 대단해요, 이 기세로 계속 가봐요! 🎉',
        '모든 미션을 클리어했어요! 오늘 정말 열심히 했군요!',
        '완벽한 하루예요! 보너스 XP를 드려요! ⭐',
    ],
};

const CharacterToast = ({ type, selectedCharacter, userXp, onDismiss, onAction }) => {
    const avatar = getRankDetails(userXp ?? getStoredXp(), selectedCharacter).avatar;
    const msgs = MESSAGES[type] || MESSAGES.review_reminder;
    const message = msgs[0];
    const isMission = type === 'mission_complete';

    useEffect(() => {
        const timer = setTimeout(onDismiss, isMission ? 5000 : 4000);
        return () => clearTimeout(timer);
    }, [onDismiss, isMission]);

    return (
        <div
            className="fixed bottom-8 left-1/2 z-[200] flex items-end gap-3.5 animate-in slide-in-from-bottom-4 fade-in duration-400 w-[calc(100%-2.5rem)] sm:w-full"
            style={{ transform: 'translateX(-50%)', maxWidth: 'min(92vw, 400px)' }}
            onClick={onDismiss}
        >
            {/* Character avatar */}
            <div 
                className="shrink-0 w-16 h-16 rounded-full bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center transition-transform hover:scale-105 active:scale-95" 
                style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.12))' }}
            >
                <img src={avatar} alt="character" className="w-full h-full object-contain p-1" />
            </div>

            {/* Speech bubble */}
            <div
                className="relative flex-1 rounded-[1.8rem] rounded-bl-none px-5 py-3.5 shadow-2xl border-4 transition-all duration-300 min-w-0"
                style={{
                    backgroundColor: isMission ? 'rgba(255, 253, 245, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    borderColor: isMission ? '#FFD480' : '#2ED6C5', // Mission: Warm Yellow, Review: Vibrant Mint
                    boxShadow: isMission
                        ? '0 12px 30px rgba(255, 180, 51, 0.18), 0 4px 10px rgba(0, 0, 0, 0.03)'
                        : '0 12px 30px rgba(46, 214, 197, 0.15), 0 4px 10px rgba(0, 0, 0, 0.03)',
                }}
            >
                {isMission && <div className="text-2xl mb-1">🎉</div>}
                <p className="text-slate-700 font-extrabold text-sm leading-snug break-keep whitespace-normal">{message}</p>
                {isMission && (
                    <p className="text-[#FF9B73] font-black text-xs mt-1 animate-pulse">+200 보너스 XP 획득!</p>
                )}
                {!isMission && onAction && (
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
