import CharacterNicknameForm from './character-selection/components/CharacterNicknameForm.jsx';
import CharacterOptionGrid from './character-selection/components/CharacterOptionGrid.jsx';
import CharacterSelectionIntro from './character-selection/components/CharacterSelectionIntro.jsx';
import { useCharacterSelection } from './character-selection/hooks/useCharacterSelection.js';

const CharacterSelectionScreen = ({ onSelect, onBack }) => {
    const selection = useCharacterSelection({ onSelect });

    return (
        <div className="character-selection-screen fixed inset-0 w-full z-[100] bg-animated-gradient overflow-y-auto overflow-x-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent"></div>

            <div className="w-full min-h-full flex flex-col items-center justify-center gap-2.5 md:gap-8 relative z-50 px-4 py-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] md:px-10 max-w-5xl mx-auto">
                <div className="w-full shrink-0 px-2 flex justify-start">
                    {onBack && (
                        <button onClick={onBack} className="hp-nav-button glass-panel !w-12 !h-12 flex items-center justify-center rounded-full text-slate-600 hover:scale-105 active:scale-95 transition-all">
                            ←
                        </button>
                    )}
                </div>

                <CharacterSelectionIntro selectedChar={selection.selectedChar} />

                <CharacterOptionGrid
                    characters={selection.characters}
                    selected={selection.selected}
                    onSelect={selection.handleSelectCharacter}
                />

                <CharacterNicknameForm
                    canConfirm={selection.canConfirm}
                    confirmText={selection.confirmText}
                    nickname={selection.nickname}
                    nicknameRef={selection.nicknameRef}
                    onChange={selection.setNickname}
                    onConfirm={selection.handleConfirm}
                    onKeyDown={selection.handleNicknameKeyDown}
                    showInput={selection.showInput}
                />
            </div>
        </div>
    );
};

export default CharacterSelectionScreen;
