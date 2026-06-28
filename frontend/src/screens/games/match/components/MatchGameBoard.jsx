import CardItem from './CardItem.jsx';

export default function MatchGameBoard({ backChar, backSrc, cards, onCardClick }) {
    return (
        <div className="match-game-board w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col justify-center">
            <div className={`match-game-grid grid w-full mx-auto px-2 ${
                cards.length <= 4 ? 'grid-cols-2 max-w-sm' : 'grid-cols-2 sm:grid-cols-4 max-w-6xl'
            }`}>
                {cards.map((card) => (
                    <CardItem
                        key={card.uniqueId}
                        card={card}
                        onClick={onCardClick}
                        totalCards={cards.length}
                        backChar={backChar}
                        backSrc={backSrc}
                    />
                ))}
            </div>
        </div>
    );
}
