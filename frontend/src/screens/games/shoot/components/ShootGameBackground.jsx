import { BOKEH_LIGHTS, COSMIC_STARS, FLOATING_PARTICLES } from '../shootGameConstants.js';

const ShootGameBackground = ({ themeConfig }) => (
    <>
        {COSMIC_STARS.map(star => (
            <div
                key={star.id}
                className="absolute pointer-events-none z-0"
                style={{
                    left: star.left,
                    top: star.top,
                    width: `${star.size * 3}px`,
                    height: `${star.size * 3}px`,
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff0f5 40%, #d8f3ff 100%)',
                    clipPath: 'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)',
                    filter: `drop-shadow(0 0 5px rgba(255,255,255,0.9)) drop-shadow(0 0 10px ${themeConfig.accentColor}88)`,
                    willChange: 'transform, opacity',
                    animation: `starSparkle ${star.speed} ease-in-out infinite`,
                    animationDelay: star.delay,
                }}
            />
        ))}

        {BOKEH_LIGHTS.map(b => (
            <div
                key={b.id}
                className="absolute rounded-full pointer-events-none z-0"
                style={{
                    left: b.left,
                    top: b.top,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    background: `radial-gradient(circle, rgba(255,255,255,0.7) 0%, ${themeConfig.accentColor}44 60%, transparent 100%)`,
                    filter: 'blur(4px)',
                    willChange: 'transform, opacity',
                    animation: `driftBokeh ${b.speed} ease-in-out infinite`,
                    animationDelay: b.delay,
                }}
            />
        ))}

        <div
            className="absolute pointer-events-none z-0 rounded-full animate-pulse"
            style={{
                left: '20%', top: '5%',
                width: '320px', height: '320px',
                background: `radial-gradient(circle, ${themeConfig.nebulaColor} 0%, transparent 70%)`,
                filter: 'blur(40px)',
                animationDuration: '5s',
            }}
        />
        <div
            className="absolute pointer-events-none z-0 rounded-full animate-pulse"
            style={{
                left: '55%', top: '10%',
                width: '260px', height: '260px',
                background: `radial-gradient(circle, ${themeConfig.nebulaColor2} 0%, transparent 70%)`,
                filter: 'blur(50px)',
                animationDuration: '7s',
                animationDelay: '2s',
            }}
        />

        <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-0"
            style={{
                height: '180px',
                background: `linear-gradient(0deg, ${themeConfig.bottomGlow} 0%, transparent 100%)`,
            }}
        />

        {FLOATING_PARTICLES.map(p => (
            <div
                key={p.id}
                className="absolute rounded-full pointer-events-none z-0"
                style={{
                    left: p.left,
                    top: p.top,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: themeConfig.accentColor,
                    boxShadow: `0 0 12px ${themeConfig.accentColor}`,
                    animation: `particleDrift ${p.speed} ease-in-out infinite`,
                    animationDelay: p.delay,
                }}
            />
        ))}
    </>
);

export default ShootGameBackground;
