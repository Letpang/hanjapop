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
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`hp-cta-button hp-cta-button--${theme} ${className}`}
        >
            {children}
        </button>
    );
};

export default CtaButton;
