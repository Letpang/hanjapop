const RankUpModalStyles = () => (
  <style>{`
    @keyframes rank-float {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%       { transform: translateY(-14px) scale(1.03); }
    }
    @keyframes rank-glow-pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50%       { opacity: 1;   transform: scale(1.12); }
    }
    @keyframes rank-shine {
      0%   { transform: translateX(-120%) rotate(25deg); }
      100% { transform: translateX(320%) rotate(25deg); }
    }
    @keyframes rank-star {
      0%   { transform: translate(0,0) scale(0) rotate(0deg); opacity: 0; }
      30%  { opacity: 1; }
      100% { transform: translate(var(--tx), var(--ty)) scale(1.2) rotate(var(--rot)); opacity: 0; }
    }
  `}</style>
);

export default RankUpModalStyles;
