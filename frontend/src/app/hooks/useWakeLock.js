import { useEffect } from 'react';

export function useWakeLock() {
    useEffect(() => {
        if (!('wakeLock' in navigator)) return undefined;

        let wakeLock = null;
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
            } catch {
                wakeLock = null;
            }
        };

        requestWakeLock();
        return () => {
            if (wakeLock) wakeLock.release();
        };
    }, []);
}
