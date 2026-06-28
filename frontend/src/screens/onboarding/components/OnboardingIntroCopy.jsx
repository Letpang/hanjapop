import { useLang } from '../../../hooks/useLang.js';

const renderTitle = (title, highlight) => {
  if (!highlight) return title;
  const index = title.indexOf(highlight);
  if (index === -1) return title;

  return (
    <>
      {title.slice(0, index)}
      <span className="text-[#009984] font-bold">{highlight}</span>
      {title.slice(index + highlight.length)}
    </>
  );
};

const OnboardingIntroCopy = ({ slide }) => {
  const { t } = useLang();
  const title = t(slide.title);
  const highlight = t(slide.highlight);
  return (
    <div className="text-center">
      <div className="mb-3 inline-flex items-center rounded-full bg-[#E4F9F6] px-3.5 py-1 text-base font-semibold tracking-[0.12em] text-[#009984]">
        {slide.kicker}
      </div>
      <h1 className="text-h2 font-medium leading-tight tracking-normal text-[#334155] dark:text-slate-100 break-keep">
        {renderTitle(title, highlight)}
      </h1>
      <p className="mt-3 text-body font-medium text-[#445060] dark:text-slate-300 break-keep" style={{ lineHeight: 1.6 }}>
        {t(slide.body)}
      </p>
    </div>
  );
};

export default OnboardingIntroCopy;
