import { useEffect, useRef, useState } from 'react';

const SCREEN_MUSIC_MAP = {
    'menu': '/assets/music/main_menu.mp3',
    'flashcard': '/assets/music/flashcard.mp3',
    'matchGame': '/assets/music/match_game.mp3',
    'shootGame': '/assets/music/monster_defense.mp3',
    'writing': '/assets/music/writing.mp3',
    'stickerBook': '/assets/music/sticker_book.mp3',
};

const BackgroundMusic = ({ currentScreen }) => {
    const audioRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        const handleFirstInteraction = () => {
            setHasInteracted(true);
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };

        const handleVisibilityChange = () => {
            if (!audioRef.current || !hasInteracted || isMuted) return;
            if (document.visibilityState === 'hidden') {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.log("Resume error:", e));
            }
        };

        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('touchstart', handleFirstInteraction);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [hasInteracted, isMuted]);

    useEffect(() => {
        if (!audioRef.current || !hasInteracted) return;

        const nextTrack = SCREEN_MUSIC_MAP[currentScreen] || SCREEN_MUSIC_MAP['menu'];

        if (isMuted) {
            if (!audioRef.current.paused) audioRef.current.pause();
            return;
        }

        if (!audioRef.current.src.endsWith(nextTrack)) {
            audioRef.current.pause();
            audioRef.current.src = nextTrack;
            audioRef.current.load();
            audioRef.current.play().catch(e => console.log("Play error:", e));
        } else if (audioRef.current.paused) {
            audioRef.current.play().catch(e => console.log("Play error:", e));
        }
    }, [currentScreen, hasInteracted, isMuted]);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
    };

    return (
        <div
            className={`fixed z-[9999] pointer-events-auto ${currentScreen === 'shootGame' ? 'right-4' : 'left-6 bottom-24'}`}
            style={currentScreen === 'shootGame' ? { bottom: 'calc(env(safe-area-inset-bottom) + 220px)' } : {}}
        >
            <audio ref={audioRef} loop />
            <button 
                onClick={toggleMute}
                className="bg-white hover:bg-slate-50 p-3 sm:p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-slate-100 transition-all active:scale-90 group"
                title={isMuted ? "소리 켜기" : "소리 끄기"}
            >
                {isMuted ? (
                    <svg className="w-5 h-5 sm:w-7 sm:h-7 text-slate-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default BackgroundMusic;
