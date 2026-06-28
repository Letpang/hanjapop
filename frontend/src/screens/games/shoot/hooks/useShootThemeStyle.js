import { useEffect } from 'react';

export function useShootThemeStyle(themeConfig) {
    useEffect(() => {
        const el = document.getElementById('shoot-game-theme-style') || (() => {
            const style = document.createElement('style');
            style.id = 'shoot-game-theme-style';
            document.head.appendChild(style);
            return style;
        })();

        el.textContent = `
            .shoot-game-theme-container {
                background: ${themeConfig.animBg};
                background-size: 400% 400%;
                animation: bgShift 12s ease infinite, hueShift 20s linear infinite;
            }
            .shoot-game-theme-container.result-active {
                animation: bgShift 12s ease infinite;
                filter: none !important;
            }
            @keyframes bgShift {
                0%   { background-position: 0% 50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            @keyframes hueShift {
                0%   { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            @keyframes starSparkle {
                0%, 100% { opacity: 0.25; transform: translateY(0px) scale(0.6) rotate(0deg); }
                50%      { opacity: 1;    transform: translateY(-6px) scale(1.15) rotate(15deg); }
            }
            @keyframes driftBokeh {
                0%, 100% { opacity: 0.15; transform: translate(0, 0) scale(1); }
                50%      { opacity: 0.55; transform: translate(8px, -12px) scale(1.2); }
            }
            @keyframes particleDrift {
                0%   { opacity: 0; transform: translateY(0px) scale(0.5); }
                12%  { opacity: 0.6; }
                80%  { opacity: 0.35; }
                100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
            }
        `;

        return () => { el.textContent = ''; };
    }, [themeConfig]);
}
