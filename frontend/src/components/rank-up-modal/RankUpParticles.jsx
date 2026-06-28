const RankUpParticles = ({ colors }) => (
  <>
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 rounded-full pointer-events-none"
        style={{
          background: i % 2 === 0 ? colors.from : colors.to,
          top: `${30 + Math.sin(i * 45 * Math.PI / 180) * 25}%`,
          left: `${50 + Math.cos(i * 45 * Math.PI / 180) * 30}%`,
          '--tx': `${(Math.random() - 0.5) * 80}px`,
          '--ty': `${(Math.random() - 0.5) * 80}px`,
          '--rot': `${Math.random() * 360}deg`,
          animation: `rank-star 1.5s ease-out ${i * 0.15}s both`,
        }}
      />
    ))}

    <div
      className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none"
      style={{
        background: colors.glow,
        animation: 'rank-glow-pulse 2s ease-in-out infinite',
      }}
    />
  </>
);

export default RankUpParticles;
