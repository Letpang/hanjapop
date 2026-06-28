const LoginButton = ({ disabled, icon, label, onClick, variant = 'light' }) => {
  const isDark = variant === 'dark';
  const isKakao = variant === 'kakao';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-3 font-normal ${isDark ? 'text-white' : 'text-[#191919]'} ${variant === 'light' ? 'border text-[#334155]' : ''}`}
      style={{
        background: isDark ? '#000' : isKakao ? '#FEE500' : '#fff',
        borderColor: variant === 'light' ? '#ddd' : undefined,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
};

export default LoginButton;
