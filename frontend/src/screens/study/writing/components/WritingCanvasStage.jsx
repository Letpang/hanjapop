import { useLang } from '../../../../hooks/useLang.js';

const WritingCanvasStage = ({
  hanja,
  isAnimCJK,
  isComplete,
  isReady,
  noData,
  mistakeOnStroke,
  quizContainerRef,
  drawingCanvasRef,
  strokeNumberCanvasRef,
}) => {
  const { t } = useLang();

  return (
    <div className={`writing-canvas relative w-full aspect-square max-w-[320px] sm:max-w-[380px] rounded-[3rem] sm:rounded-[4rem] overflow-hidden transition-all duration-500 shadow-2xl ${
      isComplete ? 'border-[8px] border-[#F5A58A] scale-[1.02]' :
      mistakeOnStroke ? 'bg-rose-50 border-[8px] border-rose-100' : 'bg-[var(--color-bg-surface)] border-[8px] border-[#E9EDF2]'
    }`}>
      <div ref={quizContainerRef} className="w-full h-full flex items-center justify-center" />
      {isAnimCJK && <canvas ref={drawingCanvasRef} className="absolute inset-0" style={{ width: '100%', height: '100%', touchAction: 'none' }} />}
      {!isAnimCJK && <canvas ref={strokeNumberCanvasRef} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />}
      {!isReady && !noData && <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-surface)]/60 backdrop-blur-md"><div className="w-10 h-10 border-4 border-[#7C83FF] border-t-transparent rounded-full animate-spin" /></div>}
      {noData && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-bg-surface)]/95"><span className="text-5xl">{hanja.hanja}</span><p className="text-base text-[#8F99AD] text-center px-4">{t('ext_2024')}<br />{t('ext_1736')}</p></div>}
      {isComplete && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg animate-in zoom-in duration-300" style={{ backgroundColor: '#F5A58A' }}>
          <span className="text-white text-base font-normal">{t('ext_1609')}</span>
        </div>
      )}
    </div>
  );
};

export default WritingCanvasStage;
