import GameNodeButton from './GameNodeButton.jsx';

const BranchOption = ({ node, status, onTap }) => {
  const isDone = status === 'done';
  const isActive = status === 'active';
  const isDisabled = status === 'locked' || status === 'faded';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        disabled={!isActive}
        onClick={isActive ? () => onTap(node.id) : undefined}
        className={`relative flex h-[clamp(120px,30vw,145px)] w-[clamp(120px,30vw,145px)] items-center justify-center bg-transparent transition-all duration-300 ${
          isActive ? 'scale-105 active:scale-95 hover:scale-110' : ''
        }`}
      >
        <GameNodeButton status={status} icon={node.icon} />
        {isDone && (
          <div className="absolute -right-1.5 -top-1.5 z-30 flex h-8 w-8 rotate-12 transform items-center justify-center rounded-full border-2 border-white bg-[#FF9B73] text-base font-normal text-white shadow-lg dark:border-slate-700">
            ✓
          </div>
        )}
      </button>
      <span className={`mt-2 break-keep text-center text-[clamp(17px,4.5vw,21px)] font-normal leading-tight ${isDisabled ? 'text-[#94A3B8]' : isDone ? 'text-[#FF9B73]' : 'text-[#334155] dark:text-slate-200'}`}>
        {node.label}
      </span>
    </div>
  );
};

export default BranchOption;
