import { useState, useEffect } from 'react';

// 네이티브 환경에서만 버전 체크 (Capacitor)
const getCapacitor = () => window?.Capacitor ?? null;

export const useVersionCheck = () => {
    const [updateInfo, setUpdateInfo] = useState({
        needsUpdate: false,
        currentVersion: '',
        latestVersion: '',
        storeUrl: '',
    });

    useEffect(() => {
        const check = async () => {
            try {
                const cap = getCapacitor();
                if (!cap?.isNativePlatform?.()) return;

                const { App } = await import('@capacitor/app');
                const appInfo = await App.getInfo();
                const currentVersion = appInfo.version;

                const res = await fetch(`https://letpang.com/version.json?t=${Date.now()}`);
                if (!res.ok) return;
                const data = await res.json();

                const platform = cap.getPlatform();
                const latestVersion = data[platform] || currentVersion;
                const storeUrl = platform === 'ios' ? data.storeUrlIos : data.storeUrlAndroid;

                const isNewer = latestVersion.localeCompare(currentVersion, undefined, {
                    numeric: true, sensitivity: 'base',
                }) > 0;

                if (isNewer && data.forceUpdate) {
                    setUpdateInfo({ needsUpdate: true, currentVersion, latestVersion, storeUrl });
                }
            } catch {
                // 버전 체크 실패는 조용히 무시
            }
        };
        check();
    }, []);

    return updateInfo;
};
