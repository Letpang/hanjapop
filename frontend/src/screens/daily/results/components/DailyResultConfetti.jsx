import { RESULT_CONFETTI } from '../dailyResultData.js';

const DailyResultConfetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-55">
    {RESULT_CONFETTI.map((piece, index) => (
      <div key={index} style={{ position: 'absolute', left: piece.left, top: piece.top, rotate: `${piece.r}deg` }}>
        <div
          style={{
            width: `${piece.w}px`,
            height: `${piece.h}px`,
            backgroundColor: piece.color,
            borderRadius: '2px',
            animation: `confetti-drift ${piece.dur} ${piece.del} ease-in-out infinite alternate`,
          }}
        />
      </div>
    ))}
  </div>
);

export default DailyResultConfetti;
