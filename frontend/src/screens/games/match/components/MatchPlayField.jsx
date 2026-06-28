import MatchGameBoard from './MatchGameBoard.jsx';
import MatchTimerBar from './MatchTimerBar.jsx';

const MatchPlayField = ({
    backChar,
    backSrc,
    cards,
    gameState,
    onCardClick,
    timeLeft,
}) => {
    const isPlaying = gameState === 'playing';

    return (
        <div
            className="match-game-body w-full flex-1 min-h-0 flex flex-col justify-between px-5 pt-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
        >
            {isPlaying && (
                <MatchGameBoard
                    backChar={backChar}
                    backSrc={backSrc}
                    cards={cards}
                    onCardClick={onCardClick}
                />
            )}

            {isPlaying && <MatchTimerBar cards={cards} timeLeft={timeLeft} />}
        </div>
    );
};

export default MatchPlayField;
