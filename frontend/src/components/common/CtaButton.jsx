import React from 'react';

/**
 * A unified 3D Claymorphism CTA Button component for the entire app.
 * Available themes: 'coral', 'blue', 'mint'
 */
const CtaButton = ({ 
    onClick, 
    children, 
    theme = 'coral', 
    className = '',
    disabled = false 
}) => {
    // Define exact color combinations for each theme
    const themes = {
        coral: {
            outerBg: 'linear-gradient(135deg, #FFB393 0%, #FF6B6B 100%)',
            shadow: '0 12px 24px rgba(255, 107, 107, 0.3), inset 0 -4px 0 rgba(0,0,0,0.1)',
            innerBg: 'bg-[#FF7D6B]/80',
            textColor: 'text-white' // usually text is white inside the CTA
        },
        blue: {
            outerBg: 'linear-gradient(135deg, #9FA5FF 0%, #6168EB 100%)',
            shadow: '0 12px 24px rgba(97, 104, 235, 0.3), inset 0 -4px 0 rgba(0,0,0,0.1)',
            innerBg: 'bg-[#4F56D9]/80',
            textColor: 'text-white'
        },
        mint: {
            outerBg: 'linear-gradient(135deg, #7DD9CC 0%, #0D9488 100%)',
            shadow: '0 12px 24px rgba(46, 214, 197, 0.3), inset 0 -4px 0 rgba(0,0,0,0.1)',
            innerBg: 'bg-[#0D9488]/80',
            textColor: 'text-white'
        }
    };

    const t = themes[theme] || themes.coral;

    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`w-full h-fit relative overflow-hidden transition-all duration-300 rounded-[1.8rem] p-[3px] 
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[30%]' : 'active:scale-[0.97] active:translate-y-1'} 
                ${className}`}
            style={{ 
                background: t.outerBg, 
                boxShadow: t.shadow 
            }}
        >
            {/* Top Glass Highlight */}
            <div className="absolute top-0 inset-x-0 h-[45%] bg-white/20 pointer-events-none rounded-t-[1.6rem]" />
            
            {/* Inner Content Padding & Background */}
            <div className={`${t.innerBg} rounded-[1.6rem] px-5 py-4 ${t.textColor}`}>
                {children}
            </div>
        </button>
    );
};

export default CtaButton;
