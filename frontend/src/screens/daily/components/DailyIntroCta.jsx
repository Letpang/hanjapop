import CtaButton from '../../../components/common/CtaButton.jsx';

const DailyIntroCta = ({ buttonContent, onStart }) => (
    <div className="daily-mobile-cta w-full max-w-sm shrink-0 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        <CtaButton theme="coral" onClick={onStart}>
            <div className="flex flex-col items-center justify-center gap-1.5 w-full py-1">
                <div className="daily-cta-title font-normal text-white leading-tight drop-shadow-md flex items-center justify-center gap-2">
                    <span>{buttonContent.title}</span>
                    <span className="text-[1.55rem] translate-y-[1px]">›</span>
                </div>
                <div className="daily-cta-subtitle font-normal text-white/90 text-center">
                    {buttonContent.subtitle}
                </div>
            </div>
        </CtaButton>
    </div>
);

export default DailyIntroCta;
