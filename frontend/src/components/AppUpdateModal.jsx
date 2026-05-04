import { useLang } from '../LangContext.jsx';

export default function AppUpdateModal({ currentVersion, latestVersion, storeUrl }) {
  const { t } = useLang();

  const handleUpdate = () => {
    if (storeUrl) {
      window.location.href = storeUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-[85%] max-w-sm flex flex-col items-center text-center shadow-2xl">
        <div className="mb-6 mx-auto w-20 h-20">
          <img
            src="/assets/images/characters/dokkaebi.svg"
            alt="Update Character"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">{t('updateTitle')}</h2>
        <p className="text-gray-600 text-sm font-medium mb-1 leading-relaxed whitespace-pre-line">
          {t('updateBody')}
        </p>

        <hr className="w-full my-4 border-gray-100" />

        <div className="flex flex-col gap-2 text-gray-500 mb-6 text-sm font-semibold w-full px-4">
          <div className="flex justify-between">
            <span>{t('currentVersion')}</span>
            <span>V.{currentVersion}</span>
          </div>
          <div className="flex justify-between text-gray-800">
            <span>{t('latestVersion')}</span>
            <span>V.{latestVersion}</span>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          className="w-full bg-[#fde047] hover:bg-[#facc15] text-gray-800 font-bold py-3.5 rounded-xl shadow-md transition-all text-[15px]"
        >
          {t('updateBtn')}
        </button>
      </div>
    </div>
  );
}
