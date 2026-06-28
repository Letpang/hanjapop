const nodeStyles = {
  locked: {
    bg: 'bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0]',
    shadow: 'shadow-[inset_0_-6px_0_rgba(148,163,184,0.4),0_8px_16px_rgba(0,0,0,0.05)] border-[var(--color-border-subtle)]',
    ring: 'ring-4 ring-[#E2E8F0]/40',
  },
  done: {
    bg: 'bg-gradient-to-br from-[#E0F2FE] to-[#7DD3FC]',
    shadow: 'shadow-[inset_0_-8px_0_rgba(2,132,199,0.3),0_12px_24px_rgba(56,189,248,0.3)] border-[var(--color-border-subtle)]',
    ring: 'ring-4 ring-[#38bdf8]/40',
  },
  active: {
    bg: 'bg-gradient-to-br from-[#A7F3D0] to-[#10B981]',
    shadow: 'shadow-[inset_0_-8px_0_rgba(4,120,87,0.3),0_16px_32px_rgba(16,185,129,0.4)] border-[var(--color-border-subtle)]',
    ring: 'ring-4 ring-[#10B981]/40',
  },
};

const getNodeStyle = (status) => {
  if (status === 'locked') return nodeStyles.locked;
  if (status === 'done') return nodeStyles.done;
  return nodeStyles.active;
};

const GameNodeButton = ({ status, icon }) => {
  const isLocked = status === 'locked';
  const style = getNodeStyle(status);

  return (
    <div className={`absolute inset-0 overflow-hidden rounded-[2.5rem] border-[4px] transition-all duration-300 ${style.bg} ${style.shadow} ${style.ring}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-[2.5rem] bg-gradient-to-b from-white/70 to-transparent" />
      {icon && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-3.5">
          <img
            src={icon}
            className={`h-full w-full object-contain transition-all ${isLocked ? 'grayscale opacity-40 mix-blend-multiply' : 'scale-110 drop-shadow-[0_6px_8px_rgba(0,0,0,0.25)]'}`}
            alt=""
          />
        </div>
      )}
    </div>
  );
};

export default GameNodeButton;
