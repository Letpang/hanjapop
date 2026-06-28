import ResultModalShell, {
    ResultModalActions,
    ResultModalHeading,
    ResultPrimaryButton,
    ResultSecondaryButton,
} from './common/ResultModalShell.jsx';
import { useLang } from '../hooks/useLang.js';

const AccountDataChoiceModal = ({
    previousProvider,
    currentProvider,
    localXp,
    onUsePreviousLogin,
    onContinueWithoutLink,
    busy = false,
}) => {
    const { t } = useLang();
    const providerLabels = { kakao: t('ext_937'), google: 'Google', apple: 'Apple', email: t('ext_1472') };
    const previousLabel = providerLabels[previousProvider] || t('ext_1549');
    const currentLabel = providerLabels[currentProvider] || t('ext_1550');
    const hasPreviousProvider = Boolean(previousProvider);
    const xpDisplay = typeof localXp === 'number' && localXp > 0
        ? `${t('ext_2665')}: ${localXp.toLocaleString('ko-KR')} XP`
        : null;

    return (
        <ResultModalShell labelledBy="account-data-choice-title" tone="dim">
            <div className="flex flex-col items-center gap-5">
                <ResultModalHeading
                    id="account-data-choice-title"
                    kicker={t('ext_1652')}
                    title={hasPreviousProvider ? t('ext_2583', { previousLabel }) : t('ext_1963')}
                    description={hasPreviousProvider
                        ? t('ext_2761', { previousLabel })
                        : t('ext_2665')}
                />

                <div className="w-full rounded-[1.35rem] bg-slate-50 px-4 py-3 text-center text-base leading-relaxed text-slate-500 shadow-inner">
                    {xpDisplay && <p className="font-semibold text-indigo-600 mb-1">{xpDisplay}</p>}
                    {t('ext_2841')}<br />{t('ext_2328')}
                </div>

                <ResultModalActions>
                    {hasPreviousProvider && (
                        <ResultPrimaryButton onClick={onUsePreviousLogin} disabled={busy}>
                            {t('ext_2555', { previousLabel })}
                        </ResultPrimaryButton>
                    )}
                    <button
                        type="button"
                        onClick={onContinueWithoutLink}
                        disabled={busy}
                        className="w-full py-3 text-base font-medium text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                    >
                        {t('ext_2737')}
                    </button>
                </ResultModalActions>
            </div>
        </ResultModalShell>
    );
};

export default AccountDataChoiceModal;
