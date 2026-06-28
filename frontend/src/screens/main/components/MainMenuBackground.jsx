const MainMenuBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[#E0F7FA]/40 via-[#F1F8E9]/40 to-[#E0F7FA]/40" />
    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full" style={{ background: '#2ED6C5', filter: 'blur(100px)', opacity: 0.15 }} />
    <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full" style={{ background: '#7C83FF', filter: 'blur(100px)', opacity: 0.12 }} />
    <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full" style={{ background: '#FF9B73', filter: 'blur(110px)', opacity: 0.15 }} />
  </div>
);

export default MainMenuBackground;
