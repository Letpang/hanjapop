import React from 'react';
import ResultModalShell, {
    ResultModalActions,
    ResultModalHeading,
    ResultPrimaryButton,
    ResultSecondaryButton,
} from './common/ResultModalShell.jsx';

const PROVIDER_LABELS = {
    kakao: '카카오',
    google: 'Google',
    apple: 'Apple',
    email: '이전 방식',
};

const AccountDataChoiceModal = ({
    previousProvider,
    currentProvider,
    localXp,
    onUsePreviousLogin,
    onUseCurrentAccount,
    onContinueWithoutLink,
    busy = false,
}) => {
    const previousLabel = PROVIDER_LABELS[previousProvider] || '이전 로그인';
    const currentLabel = PROVIDER_LABELS[currentProvider] || '현재 로그인';
    const hasPreviousProvider = Boolean(previousProvider);
    const xpDisplay = typeof localXp === 'number' && localXp > 0
        ? `이 기기 학습 기록: ${localXp.toLocaleString('ko-KR')} XP`
        : null;

    return (
        <ResultModalShell labelledBy="account-data-choice-title" tone="dim">
            <div className="flex flex-col items-center gap-5">
                <ResultModalHeading
                    id="account-data-choice-title"
                    kicker="학습 기록 보호"
                    title={hasPreviousProvider ? `이전에 ${previousLabel}로 로그인했어요` : '기기에 학습 기록이 있어요'}
                    description={hasPreviousProvider
                        ? `기존 학습 기록을 불러오려면 ${previousLabel}로 계속하세요.`
                        : '이 기기의 기록을 클라우드에 저장할 계정을 선택해 주세요.'}
                />

                <div className="w-full rounded-[1.35rem] bg-slate-50 px-4 py-3 text-center text-[13px] leading-relaxed text-slate-500 shadow-inner">
                    {xpDisplay && <p className="font-semibold text-indigo-600 mb-1">{xpDisplay}</p>}
                    선택하기 전까지 자동 동기화는 멈춰 있어요.<br />아직 어떤 기록도 변경되지 않았습니다.
                </div>

                <ResultModalActions>
                    {hasPreviousProvider && (
                        <ResultPrimaryButton onClick={onUsePreviousLogin} disabled={busy}>
                            {previousLabel}로 기존 기록 불러오기
                        </ResultPrimaryButton>
                    )}
                    <ResultSecondaryButton onClick={onUseCurrentAccount} disabled={busy}>
                        이 기기 기록을 {currentLabel} 계정에 저장하기
                    </ResultSecondaryButton>
                    <button
                        type="button"
                        onClick={onContinueWithoutLink}
                        disabled={busy}
                        className="w-full py-3 text-[14px] font-medium text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                    >
                        저장하지 않고 계속하기
                    </button>
                </ResultModalActions>
            </div>
        </ResultModalShell>
    );
};

export default AccountDataChoiceModal;
