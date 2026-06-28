import { useRef, useState } from 'react';
import { CHARACTERS, hasFinalConsonant } from '../characterSelectionData.js';
import { useLang } from '../../../../hooks/useLang.js';

export const useCharacterSelection = ({ onSelect }) => {
    const { t } = useLang();
    const [selected, setSelected] = useState(null);
    const [nickname, setNickname] = useState('');
    const [showInput, setShowInput] = useState(false);
    const nicknameRef = useRef(null);

    const selectedChar = CHARACTERS.find(c => c.id === selected);
    const rawName = selectedChar ? t(selectedChar.name) : '';
    const displayNick = nickname.trim() || rawName;
    const canConfirm = Boolean(selected && nickname.trim().length > 0);
    const confirmText = t(hasFinalConsonant(displayNick) ? 'ext_3211' : 'ext_3212', { name: displayNick });

    const handleConfirm = () => {
        const actualNick = nicknameRef.current ? nicknameRef.current.value.trim() : nickname.trim();
        if (selected && actualNick.length > 0) {
            onSelect(selected, actualNick);
        }
    };

    const handleNicknameKeyDown = (e) => {
        if (e.key === 'Enter' && canConfirm) handleConfirm();
    };

    const handleSelectCharacter = (charId) => {
        setSelected(charId);
        if (!showInput) setShowInput(true);
        setTimeout(() => nicknameRef.current?.focus(), 150);
    };

    return {
        canConfirm,
        characters: CHARACTERS,
        confirmText,
        handleConfirm,
        handleNicknameKeyDown,
        handleSelectCharacter,
        nickname,
        nicknameRef,
        selected,
        selectedChar,
        setNickname,
        showInput,
    };
};
