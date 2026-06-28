import SectionIcon from './SectionIcon.jsx';

const CollapsibleSection = ({ title, count, isOpen, onToggle, children }) => (
  <div className="flex flex-col gap-4">
    <button onClick={onToggle} className="flex w-full items-center justify-between px-1 text-left">
      <div className="flex items-center gap-3">
        <SectionIcon />
        <span className="flashcard-section-title">
          {title}
          {count != null && <span className="flashcard-section-count ml-1 text-[#9AA4B5]">({count})</span>}
        </span>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </button>

    {isOpen && (
      <div className="mt-1 flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
        {children}
      </div>
    )}
  </div>
);

export default CollapsibleSection;
