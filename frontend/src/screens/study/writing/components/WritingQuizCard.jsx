import StrokeOrderModal from './StrokeOrderModal.jsx';
import WritingCanvasStage from './WritingCanvasStage.jsx';
import WritingControls from './WritingControls.jsx';
import WritingToolbar from './WritingToolbar.jsx';
import { useWritingQuizEngine } from '../hooks/useWritingQuizEngine.js';
import { useLang } from '../../../../hooks/useLang.js';

const WritingPromptHeader = ({ hanja }) => (
    <div className="flex flex-row items-center justify-center gap-3 w-full">
        <span className="text-[3.5rem] sm:text-[4rem] font-normal text-[#34383F] dark:text-slate-100 leading-none drop-shadow-sm">
            {hanja.hanja}
        </span>
        <span className="text-[1.1rem] sm:text-[1.25rem] font-normal text-[#7C83FF] tracking-wider bg-[#F2F3FF] px-5 py-1.5 rounded-full shadow-sm whitespace-nowrap">
            {hanja.meaning} {hanja.sound}
        </span>
    </div>
);

const WritingQuizCard = ({ hanja, onWritingComplete, onNextHanja }) => {
    const { t } = useLang();
    const {
        drawingCanvasRef,
        handleColorChange,
        handleHint,
        handleRetry,
        handleStrokeModalClose,
        handleStrokeModalReplay,
        handleWidthChange,
        isAnimCJK,
        isAnimating,
        isComplete,
        isReady,
        mistakeOnStroke,
        noData,
        quizContainerRef,
        replayAnimCjk,
        showStrokeModal,
        strokeColor,
        strokeNumberCanvasRef,
        strokeOrderKey,
        strokeOrderSvg,
        strokeWidth,
    } = useWritingQuizEngine({ hanja, onWritingComplete });

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-3 sm:gap-4 animate-in fade-in duration-500">
            <WritingPromptHeader hanja={hanja} />

            <WritingToolbar
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                onColorChange={handleColorChange}
                onWidthChange={handleWidthChange}
            />

            <WritingCanvasStage
                hanja={hanja}
                isAnimCJK={isAnimCJK}
                isComplete={isComplete}
                isReady={isReady}
                noData={noData}
                mistakeOnStroke={mistakeOnStroke}
                quizContainerRef={quizContainerRef}
                drawingCanvasRef={drawingCanvasRef}
                strokeNumberCanvasRef={strokeNumberCanvasRef}
            />

            <WritingControls
                isComplete={isComplete}
                isAnimCJK={isAnimCJK}
                isAnimating={isAnimating}
                nextLabel={t('ext_279')}
                onGuide={isAnimCJK ? replayAnimCjk : handleHint}
                onManualComplete={onNextHanja}
                onNextHanja={onNextHanja}
                onRetry={handleRetry}
            />

            {showStrokeModal && (
                <StrokeOrderModal
                    hanja={hanja}
                    strokeOrderSvg={strokeOrderSvg}
                    strokeOrderKey={strokeOrderKey}
                    onReplay={handleStrokeModalReplay}
                    onClose={handleStrokeModalClose}
                />
            )}
        </div>
    );
};

export default WritingQuizCard;