import CtaButton from '../../../../components/common/CtaButton.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const IdiomQuizEmptyState = ({ onBack }) => {
  const { t } = useLang();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAF9] px-6 dark:bg-slate-900"
      style={{ backgroundColor: '#F8FAF9', color: '#334155' }}
    >
      <h2 className="mb-4 text-2xl font-bold">{t('ext_1834')}</h2>
      <p className="text-body mb-8 break-keep text-center">
        {t('ext_3037')}
      </p>
      <CtaButton onClick={onBack}>{t('ext_1068')}</CtaButton>
    </div>
  );
};

export default IdiomQuizEmptyState;