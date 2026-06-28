const FLOATING_POSITIONS = [
  { left: '4%', top: '8%', rotate: '-2deg' },
  { right: '2%', top: '25%', rotate: '-2deg' },
  { left: '10%', bottom: '2%', rotate: '4deg' },
];

const DailyResultHero = ({ charImg, translateY, scale, todayHanja = [] }) => (
  <div className="relative flex h-[220px] w-full items-center justify-center mt-4 overflow-visible">
    {/* Floating Hanja Cards */}
    {todayHanja.filter(h => h.id).map((hanja, index) => {
      const pos = FLOATING_POSITIONS[index % FLOATING_POSITIONS.length];
      return (
        <div
          key={index}
          className="absolute z-20 transition-all duration-300 hover:scale-110 hanja-reading-col"
          style={{
            ...pos,
            transform: `rotate(${pos.rotate})`
          }}
        >
          <span className="text-[2.4rem] font-normal text-slate-700 leading-none drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">{hanja.hanja}</span>
          <span className="text-[1rem] font-medium text-slate-500 text-center leading-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            {hanja.meaning} {hanja.sound}
          </span>
        </div>
      );
    })}

    <div className="absolute left-1/2 top-1/2 w-[284px] h-[284px] -translate-x-1/2 -translate-y-[43%] bg-[#2ED6C5]/10 rounded-full blur-md z-0" />
    <div className="absolute left-1/2 top-1/2 z-10 w-[284px] -translate-x-1/2 -translate-y-[43%] flex justify-center items-center pointer-events-none">
      <img
        src={charImg}
        alt="great"
        className="activity-result-char drop-shadow-[0_12px_20px_rgba(46,214,197,0.24)]"
        style={{ transform: `translateY(${translateY}) scale(${scale})` }}
        onError={(event) => {
          event.target.src = '/assets/images/characters/default_3d.webp';
        }}
      />
    </div>
  </div>
);

export default DailyResultHero;
