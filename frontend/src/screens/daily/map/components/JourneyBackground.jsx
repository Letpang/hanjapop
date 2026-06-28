const CloudLayer = () => (
  <div className="absolute inset-0 overflow-hidden opacity-80">
    <div className="absolute right-[10%] top-[5%] text-[50px] opacity-80" style={{ animation: 'cloud-drift 22s ease-in-out infinite' }}>☁️</div>
    <div className="absolute -left-[10%] top-[45%] flex items-center justify-center opacity-90" style={{ animation: 'cloud-drift 28s ease-in-out infinite reverse' }}>
      <img src="/assets/images/icons/cute_monster.webp" alt="hidden monster" className="absolute z-0 h-16 w-16 drop-shadow-md" style={{ animation: 'peek-monster 14s ease-in-out infinite' }} />
      <span className="relative z-10 text-[70px]">☁️</span>
    </div>
    <div className="absolute bottom-[15%] right-[15%] text-[60px] opacity-70" style={{ animation: 'cloud-drift 19s ease-in-out infinite 2s' }}>☁️</div>
  </div>
);

const JourneyBackground = () => (
  <div className="pointer-events-none fixed inset-0 z-0 ">
    <div className="absolute inset-0 bg-gradient-to-br from-[#E0F7FA]/50 via-[#F1F8E9]/50 to-[#E0F7FA]/50" />
    <CloudLayer />
    <div className="absolute -left-20 -top-20 h-96 w-96 animate-pulse rounded-full bg-[#2ED6C5] opacity-20 blur-[100px] mix-blend-multiply" />
    <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[#7C83FF] opacity-15 blur-[100px] mix-blend-multiply" style={{ animationDelay: '2s' }} />
    <div className="absolute -bottom-20 left-1/3 h-96 w-96 rounded-full bg-[#FF9B73] opacity-20 blur-[120px] mix-blend-multiply" style={{ animationDelay: '4s' }} />
  </div>
);

export default JourneyBackground;
