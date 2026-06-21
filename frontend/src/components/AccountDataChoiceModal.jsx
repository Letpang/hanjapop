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
    onUsePreviousLogin,
    onUseCurrentAccount,
    onContinueWithoutLink,
    busy = false,
}) => {
    const previousLabel = PROVIDER_LABELS[previousProvider] || '이전 로그인';
    const currentLabel = PROVIDER_LABELS[currentProvider] || '현재 로그인';
    const hasPreviousProvider = Boolean(previousProvider);

    return (
        <ResultModalShell labelledBy="account-data-choice-title" tone="dim">
            <div className="flex flex-col items-center gap-5">
                <ResultModalHeading
                    id="account-data-choice-title"
                    kicker="학습 기록 보호"
                    title={hasPreviousProvider ? `이전에 ${previousLabel}로 로그인했어요` : '기존 학습 기록이 있어요'}
                    description={hasPreviousProvider
                        ? `기존 학습 기록을 불러오려면 ${previousLabel}로 계속하세요.`
                        : '현재 기기의 기록을 어느 계정에 보관할지 선택해 주세요.'}
                />

                <div className="w-full rounded-[1.35rem] bg-slate-50 px-4 py-3 text-center text-[13px] leading-relaxed text-slate-500 shadow-inner">
                    아직 어느 기록도 삭제하거나 덮어쓰지 않았어요.<br />선택하기 전까지 자동 동기화도 잠시 멈춰둡니다.
                </div>

                <ResultModalActions>
                    {hasPreviousProvider && (
                        <ResultPrimaryButton onClick={onUsePreviousLogin} disabled={busy}>
                            {previousLabel}로 기존 기록 불러오기
                        </ResultPrimaryButton>
                    )}
                    <ResultSecondaryButton onClick={onUseCurrentAccount} disabled={busy}>
                        현재 {currentLabel} 계정에 이 기기 기록 연결하기
                    </ResultSecondaryButton>
                    <button
                        type="button"
                        onClick={onContinueWithoutLink}
                        disabled={busy}
                        className="w-full py-3 text-[14px] font-medium text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                    >
                        연결하지 않고 계속하기
                    </button>
                </ResultModalActions>
            </div>
        </ResultModalShell>
    );
};

export default AccountDataChoiceModal;
