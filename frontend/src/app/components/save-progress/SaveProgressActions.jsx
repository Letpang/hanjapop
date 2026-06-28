import { AppleIcon, GoogleIcon, KakaoIcon } from '../../../components/login-modal/SocialIcons.jsx';
import { useLang } from '../../../hooks/useLang.js';

const SaveProgressButton = ({ children, icon, onClick, style, tone = 'dark' }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-normal text-base active:scale-95 transition-all ${tone === 'light' ? 'border text-slate-700' : tone === 'kakao' ? 'text-[#191919]' : 'text-white'}`}
    style={style}
  >
    {icon}
    {children}
  </button>
);

const SaveProgressActions = ({ onApple, onGoogle, onKakao, onSkip, platform }) => {
  const { t } = useLang();
  return (
    <div className="w-full max-w-xs flex flex-col gap-3">
      {(platform === 'ios' || platform === 'web') && (
        <SaveProgressButton
          icon={<AppleIcon />}
          onClick={onApple}
          style={{ background: '#111', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
        >
          {t('ext_3190')}
        </SaveProgressButton>
      )}
      {(platform === 'android' || platform === 'web') && (
        <SaveProgressButton
          icon={<GoogleIcon />}
          onClick={onGoogle}
          style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          tone="light"
        >
          {t('ext_3191')}
        </SaveProgressButton>
      )}
      <SaveProgressButton
        icon={<KakaoIcon />}
        onClick={onKakao}
        style={{ background: '#FEE500', boxShadow: '0 4px 16px rgba(254,229,0,0.4)' }}
        tone="kakao"
      >
        {t('ext_3192')}
      </SaveProgressButton>
      <button
        onClick={onSkip}
        className="w-full py-3 rounded-2xl font-normal text-slate-400 text-base active:scale-95 transition-all"
      >
        {t('ext_3193')}
      </button>
    </div>
  );
};

export default SaveProgressActions;
