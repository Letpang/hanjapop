const RankUpCharacter = ({ details }) => (
  <div className="relative z-10" style={{ animation: 'rank-float 3s ease-in-out infinite' }}>
    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
      <div
        className="w-16 h-full bg-white/40 blur-sm"
        style={{ animation: 'rank-shine 2.5s ease-in-out 0.5s infinite' }}
      />
    </div>
    <img
      src={details.avatar}
      alt="evolved"
      className="w-52 h-52 object-contain drop-shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

export default RankUpCharacter;
