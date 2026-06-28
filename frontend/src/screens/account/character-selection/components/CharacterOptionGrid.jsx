import CharacterOptionCard from './CharacterOptionCard.jsx';

const CharacterOptionGrid = ({ characters, selected, onSelect }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 w-full items-stretch animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
        {characters.map((char, index) => (
            <CharacterOptionCard
                key={char.id}
                char={char}
                index={index}
                isSelected={selected === char.id}
                onSelect={onSelect}
            />
        ))}
    </div>
);

export default CharacterOptionGrid;
