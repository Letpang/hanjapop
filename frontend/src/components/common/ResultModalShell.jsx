import { forwardRef } from 'react';
import CtaButton from './CtaButton.jsx';
import { useLang } from '../../hooks/useLang.js';

const ResultModalShell = forwardRef(function ResultModalShell({
    children,
    onBackdropClick,
    className = '',
    cardClassName = '',
    tone = 'clear',
    size = 'sm',
    labelledBy,
}, ref) {
    const { t } = useLang();
    return (
        <div className={`result-modal-overlay result-modal-overlay--${tone} mobile-center-overlay ${className}`}>
            <button
                type="button"
                className="result-modal-backdrop"
                onClick={onBackdropClick}
                aria-label={t('ext_1654')}
                tabIndex={onBackdropClick ? 0 : -1}
            />
            <section
                ref={ref}
                className={`result-modal-shell result-modal-shell--${size} mobile-modal-card ${cardClassName}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </section>
        </div>
    );
});

export const ResultModalHeading = ({ kicker, title, description, id, tone = 'clear', children }) => (
    <header className="result-modal-heading">
        {kicker && <span className="result-subtitle">{kicker}</span>}
        <h1 id={id} className={`result-title result-title--${tone}`}>{title}</h1>
        {description && <p className="result-modal-description">{description}</p>}
        {children}
    </header>
);

export const ResultModalActions = ({ children, className = '' }) => (
    <div className={`result-btn-area result-modal-actions ${className}`}>{children}</div>
);

export const ResultPrimaryButton = ({ children, onClick, theme = 'indigo', disabled = false }) => (
    <CtaButton theme={theme} onClick={onClick} disabled={disabled}>
        <span className="quiz-cta-text">{children}</span>
    </CtaButton>
);

export const ResultSecondaryButton = ({ children, onClick, disabled = false }) => (
    <button type="button" onClick={onClick} disabled={disabled} className="back-quiz-button disabled:opacity-50">{children}</button>
);

export const ResultShareButton = ({ title, subtitle, onClick }) => (
    <button type="button" onClick={onClick} className="result-share-button">
        <span>{title}</span>
        {subtitle && <small>{subtitle}</small>}
    </button>
);

export default ResultModalShell;