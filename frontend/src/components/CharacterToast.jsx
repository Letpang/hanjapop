import { useEffect } from 'react';
import { getRankDetails } from '../utils/rankUtils.js';
import CharacterToastAvatar from './character-toast/CharacterToastAvatar.jsx';
import CharacterToastBubble from './character-toast/CharacterToastBubble.jsx';
import { getStoredXp } from './character-toast/characterToastMessages.js';
import { useCharacterToastMessage } from './character-toast/useCharacterToastMessage.js';

const getToastDuration = ({ isMission, isRankSoon, isRankUp }) => {
    if (isRankUp) return 6000;
    if (isMission || isRankSoon) return 5000;
    return 4000;
};

const CharacterToast = ({ type, selectedCharacter, userXp, nextRankAvatar, nearRankUp = false, onDismiss, onAction }) => {
    const xp = userXp ?? getStoredXp();
    const avatar = getRankDetails(xp, selectedCharacter).avatar;
    const isMission  = type === 'mission_complete';
    const isRankUp   = type === 'rank_up';
    const isRankSoon = type === 'rank_soon';
    const { message, isTypeB } = useCharacterToastMessage(type, nearRankUp);

    useEffect(() => {
        const timer = setTimeout(onDismiss, getToastDuration({ isMission, isRankSoon, isRankUp }));
        return () => clearTimeout(timer);
    }, [onDismiss, isMission, isRankUp, isRankSoon]);

    return (
        <div
            className="fixed top-1/2 left-1/2 z-[200] flex items-start gap-3.5 animate-in fade-in duration-400 w-[calc(100%-2.5rem)] sm:w-full"
            style={{ transform: 'translate(-50%, -50%)', maxWidth: 'min(92vw, 400px)' }}
            onClick={onDismiss}
        >
            <CharacterToastAvatar avatar={avatar} />
            <CharacterToastBubble
                isMission={isMission}
                isRankSoon={isRankSoon}
                isRankUp={isRankUp}
                isTypeB={isTypeB}
                message={message}
                nextRankAvatar={nextRankAvatar}
                onAction={onAction}
                onDismiss={onDismiss}
            />
        </div>
    );
};

export default CharacterToast;
