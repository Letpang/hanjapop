const JourneyTrack = () => (
  <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="opacity-80 drop-shadow-lg">
      <defs>
        <filter id="track-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M 50,0 Q 80,12 50,25 T 50,50 Q 20,62 50,75 T 50,100"
        fill="none"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="8"
        vectorEffect="non-scaling-stroke"
        filter="url(#track-glow)"
      />
      <path
        d="M 50,0 Q 80,12 50,25 T 50,50 Q 20,62 50,75 T 50,100"
        fill="none"
        stroke="rgba(46, 214, 197, 0.5)"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  </div>
);

export default JourneyTrack;
