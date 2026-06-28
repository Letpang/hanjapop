import { SK } from '../../../../constants/storageKeys.js';
import { getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';
import { CHARACTERS } from '../settingsData.js';
import { Divider, Section } from './SettingsPrimitives.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const CharacterButton = ({ character, selectedCharacter, onSelect }) => {
  const { t } = useLang();
  const isSelected = selectedCharacter === character.id;

  return (
    <button
      onClick={() => onSelect(character.id)}
      className={`flex min-h-[126px] h-auto flex-col items-center justify-between gap-1.5 rounded-2xl border-2 py-2 px-1 transition-all active:scale-95 ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
          : 'border-slate-100 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50'
      }`}
    >
      <img
        src={character.image}
        alt={t(character.label)}
        className="object-contain"
        style={{
          width: '68px',
          height: '68px',
          transform: `translateY(${getCharacterTranslateY(character.id)}) scale(${getCharacterScale(character.id, 'rank5')})`,
        }}
      />
      <span className={`text-[0.78rem] text-center font-normal px-0.5 leading-tight break-keep ${isSelected ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {t(character.label)}
      </span>
    </button>
  );
};

const ProfileSection = ({
  tempNickname,
  setTempNickname,
  onSaveNickname,
  selectedCharacter,
  setSelectedCharacter,
}) => {
  const { t } = useLang();

  const handleSelectCharacter = (characterId) => {
    setSelectedCharacter(characterId);
    localStorage.setItem(SK.SELECTED_CHARACTER, characterId);
  };

  return (
    <Section title={t('ext_975')} color="#45A081">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-normal text-slate-700 dark:text-slate-200">{t('ext_1625')}</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={tempNickname}
            onChange={event => setTempNickname(event.target.value)}
            placeholder={t('ext_1662')}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-normal text-slate-800 outline-none transition-all focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            onClick={onSaveNickname}
            className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-normal text-white shadow-md transition-all active:scale-95"
          >
            {t('ext_2114')}
          </button>
        </div>
      </div>

      {setSelectedCharacter && (
        <>
          <Divider />
          <div className="flex flex-col gap-3">
            <span className="text-xs font-normal text-slate-700 dark:text-slate-200">{t('ext_1626')}</span>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTERS.map(character => (
                <CharacterButton
                  key={character.id}
                  character={character}
                  selectedCharacter={selectedCharacter}
                  onSelect={handleSelectCharacter}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </Section>
  );
};

export default ProfileSection;