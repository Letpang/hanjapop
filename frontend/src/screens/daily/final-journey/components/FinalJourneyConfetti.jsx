import { FINAL_JOURNEY_CONFETTI } from '../finalJourneyData.js';

const FinalJourneyConfetti = () => (
  <div className="final-journey-confetti" aria-hidden="true">
    {FINAL_JOURNEY_CONFETTI.map((piece) => (
      <span
        key={piece.id}
        className="final-journey-confetti-piece"
        style={{
          '--confetti-left': piece.left,
          '--confetti-delay': piece.delay,
          '--confetti-duration': piece.duration,
          '--confetti-rotate': piece.rotate,
          '--confetti-color': piece.color,
        }}
      />
    ))}
  </div>
);

export default FinalJourneyConfetti;
