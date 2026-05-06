import { useEffect } from 'react';
import { getRankDetails } from '../utils/rankUtils.js';

const getStoredXp = () => {
    try { return Number(localStorage.getItem('user_xp') || '0'); } catch { return 0; }
};

const MESSAGES = {
    review_reminder: [
        '틀렸던 한자들이 기다리고 있어요! 같이 복습해봐요 💪',
        '아직 헷갈리는 한자가 있어요. 오늘 같이 잡아볼까요? 🔥',
        '틀렸던 것들, 오늘 다시 도전해봐요! ✨',
    ],
    mission_complete: [
        '오늘 미션 완료! 대단해요, 이 기세로 계속 가봐요! 🎉',
        '모든 미션을 클리어했어요! 오늘 정말 열심히 했군요! 🏆',
        '완벽한 하루예요! 보너스 XP를 드려요! ⭐',
    ],
};

const CharacterToast = ({ type, selectedCharacter, userXp, onDismiss }) => {
    const avatar = getRankDetails(userXp ?? getStoredXp(), selectedCharacter).avatar;
    const msgs = MESSAGES[type] || MESSAGES.review_reminder;
    const message = msgs[Math.floor(Math.random() * msgs.length)];
    const isMission = type === 'mission_complete';

    useEffect(() => {
        const timer = setTimeout(onDismiss, isMission ? 5000 : 4000);
        return () => clearTimeout(timer);
    }, [onDismiss, isMission]);

    return (
        <div
            className="fixed bottom-8 left-1/2 z-[200] flex items-end gap-3 animate-in slide-in-from-bottom-4 fade-in duration-400"
            style={{ transform: 'translateX(-50%)', maxWidth: 'min(90vw, 380px)' }}
            onClick={onDismiss}
        >
            {/* Character avatar */}
            <div className="shrink-0 w-16 h-16 rounded-full bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.18))' }}>
                <img src={avatar} alt="character" className="w-full h-full object-contain p-1" />
            </div>

            {/* Speech bubble */}
            <div
                className="relative rounded-[1.5rem] rounded-bl-sm px-4 py-3 shadow-2xl border-2"
                style={{
                    backgroundColor: isMission ? '#fef9c3' : 'rgba(255,255,255,0.97)',
                    borderColor: isMission ? '#fde68a' : 'rgba(255,255,255,0.9)',
                }}
            >
                {isMission && <div className="text-2xl mb-1">🎉</div>}
                <p className="text-slate-700 font-bold text-sm leading-snug">{message}</p>
                {isMission && (
                    <p className="text-amber-500 font-black text-xs mt-1">+50 보너스 XP 획득!</p>
                )}
            </div>
        </div>
    );
};

export default CharacterToast;
