import { useLang } from '../../../../hooks/useLang.js';

const PremiumReviewButton = ({ onClick }) => {
  const { t } = useLang();

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/40 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 hover:shadow-md active:scale-[0.98] transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="font-normal text-indigo-900 tracking-normal text-base">{t('ext_1722')}</span>
      </div>
      <span className="text-base font-normal px-2.5 py-1 rounded-md bg-indigo-600 text-white shadow-sm tracking-widest">PREMIUM</span>
    </button>
  );
};

export default PremiumReviewButton;