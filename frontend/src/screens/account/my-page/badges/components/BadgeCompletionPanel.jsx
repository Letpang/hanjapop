import { useLang } from '../../../../../hooks/useLang.js';

const BadgeCompletionPanel = () => {
  const { t } = useLang();

  return (
    <div className="rounded-2xl p-4 border border-amber-200/50 flex flex-col items-center gap-1.5 bg-gradient-to-r from-amber-50/50 to-orange-50/30 text-center dark:from-amber-950/20 dark:to-orange-950/10 dark:border-amber-900/30">
      <span className="font-normal text-base break-keep text-amber-700 dark:text-amber-300">
        {t('ext_2627')}
      </span>
    </div>
  );
};

export default BadgeCompletionPanel;