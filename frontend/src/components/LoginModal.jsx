import LoginButton from './login-modal/LoginButton.jsx';
import { AppleIcon, GoogleIcon, KakaoIcon } from './login-modal/SocialIcons.jsx';
import { useLoginActions } from './login-modal/useLoginActions.js';
import { useLang } from '../hooks/useLang.js';

export default function LoginModal({ onClose, platform, signInWithApple, signInWithGoogle, signInWithKakao }) {
    const { error, handleApple, handleGoogle, handleKakao, loading } = useLoginActions({
        onClose,
        signInWithApple,
        signInWithGoogle,
        signInWithKakao,
    });
    const { t } = useLang();

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
             style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="login-modal-card mobile-bottom-sheet w-full max-w-md rounded-t-3xl p-8 pb-12"
                 style={{ background: 'var(--card-bg, #fff)' }}>

                {/* 헤더 */}
                <div className="relative flex items-center justify-center mb-6">
                    <h2 className="text-xl font-medium">{t('ext_1066')}</h2>
                    <button onClick={onClose} className="absolute right-0 text-2xl text-gray-400">✕</button>
                </div>

                <p className="text-sm text-gray-500 mb-8 leading-relaxed text-center">
                    {t('ext_2788')}<br />
                    {t('ext_1964')}<br />
                    <span className="mt-2 inline-block text-base text-indigo-400">
                        {t('ext_3014')}
                    </span>
                </p>

                {(platform === 'ios' || platform === 'web') && (
                    <LoginButton
                        disabled={loading}
                        icon={<AppleIcon />}
                        label={t('ext_1741')}
                        onClick={handleApple}
                        variant="dark"
                    />
                )}

                {(platform === 'android' || platform === 'web') && (
                    <LoginButton
                        disabled={loading}
                        icon={<GoogleIcon />}
                        label={t('ext_1789')}
                        onClick={handleGoogle}
                    />
                )}

                <LoginButton
                    disabled={loading}
                    icon={<KakaoIcon />}
                    label={t('ext_1653')}
                    onClick={handleKakao}
                    variant="kakao"
                />

                {error && (
                    <p className="text-red-500 text-sm text-center mt-3">{error}</p>
                )}
            </div>
        </div>
    );
}