export const FINAL_JOURNEY_CONFETTI = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 8) * 0.16}s`,
  duration: `${2.8 + (index % 5) * 0.34}s`,
  rotate: `${(index * 71) % 360}deg`,
  color: ['#FFD76A', '#FF8F73', '#7C83FF', '#2ED6C5', '#FFFFFF'][index % 5],
}));

export const getCompletedDate = () => (
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
);
