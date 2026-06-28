const CharacterToastAvatar = ({ avatar }) => (
  <div
    className="shrink-0 w-16 h-16 rounded-full bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
    style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.12))' }}
  >
    <img src={avatar} alt="character" className="w-full h-full object-contain p-1" />
  </div>
);

export default CharacterToastAvatar;
