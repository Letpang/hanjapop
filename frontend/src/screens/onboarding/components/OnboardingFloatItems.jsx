const OnboardingFloatItems = ({ items }) => (
  <>
    {items.map((item, index) => (
      <div
        key={index}
        className="absolute pointer-events-none select-none font-bold animate-float"
        style={{
          top: item.top,
          left: item.left,
          right: item.right,
          fontSize: `${item.size}px`,
          color: '#00C7AE',
          opacity: 0.13,
          transform: `rotate(${item.rotate}deg)`,
          animationDuration: item.duration,
          animationDelay: item.delay,
        }}
      >
        {item.char}
      </div>
    ))}
  </>
);

export default OnboardingFloatItems;
