const DailyFlashcardProgress = ({ currentIndex, flippedSet, total }) => (
  <div className="flex gap-2 justify-center mb-2">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`daily-progress-dot rounded-full transition-all duration-300 ${flippedSet.has(i) ? 'is-flipped' : i === currentIndex ? 'is-current' : ''}`}
        style={{
          width: i === currentIndex ? '24px' : '10px',
          height: '10px',
        }}
      />
    ))}
  </div>
);

export default DailyFlashcardProgress;
