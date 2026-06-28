import SpeakerIcon from './SpeakerIcon.jsx';

const HanjaStudyHero = ({ item, isSpeaking, onSpeak }) => (
  <div className="minimal-card-studio border border-[#E9EDF2] bg-white px-5 py-3 shadow-xl !rounded-[2rem] dark:bg-slate-800">
    <div className="flex flex-col items-center gap-1">
      <div className="hanja-char text-display leading-tight text-[#3C3C3C] drop-shadow-sm dark:text-slate-100">
        {item.hanja}
      </div>
      <div className="mt-2 flex items-baseline gap-4">
        <span className="text-h2 font-normal tracking-normaler text-[#7C83FF]">{item.meaning}</span>
        <span className="text-h2 font-normal tracking-normaler text-[#7C83FF]">{item.sound}</span>
      </div>
      <button
        onClick={onSpeak}
        className={`mt-3 flex h-11 w-11 items-center justify-center rounded-2xl border-2 shadow-sm transition-all active:scale-90 ${
          isSpeaking
            ? 'border-[#7C83FF] bg-[#7C83FF]'
            : 'border-[#E9EDF2] bg-[var(--color-bg-surface)]'
        }`}
      >
        <SpeakerIcon isSpeaking={isSpeaking} />
      </button>
    </div>

    {item.etymology_short && (
      <div className="mt-6 border-t border-[#E9EDF2] pt-6">
        <p className="text-body-lg break-keep text-center font-normal leading-relaxed tracking-normal text-[#3C3C3C] dark:text-slate-100">
          {item.etymology_short}
        </p>
      </div>
    )}
  </div>
);

export default HanjaStudyHero;
