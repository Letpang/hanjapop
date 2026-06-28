const JourneyFloatingClouds = () => (
  <div className="pointer-events-none fixed inset-0 z-0 w-full overflow-hidden opacity-50">
    <div className="absolute -left-10 top-10 text-[60px] opacity-80" style={{ animation: 'cloud-drift 20s ease-in-out infinite' }}>☁️</div>

    <div className="absolute -right-10 top-1/2 flex items-center justify-center opacity-70" style={{ animation: 'cloud-drift 25s ease-in-out infinite reverse' }}>
      <img src="/assets/images/icons/cute_monster.webp" alt="hidden monster" className="absolute z-0 h-16 w-16 drop-shadow-md" style={{ animation: 'peek-monster 12s ease-in-out infinite' }} />
      <span className="relative z-10 text-[80px]">☁️</span>
    </div>

    <div className="absolute bottom-20 left-10 text-[50px] opacity-70" style={{ animation: 'cloud-drift 18s ease-in-out infinite 2s' }}>☁️</div>
  </div>
);

export default JourneyFloatingClouds;
