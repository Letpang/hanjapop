/**
 * useAuth.js
 * Apple / Google 소셜 로그인 상태 관리
 *
 * 플랫폼별 로그인 방식:
 *   web     → supabase.auth.signInWithOAuth (리디렉트)
 *   ios     → window.Capacitor.Plugins.SignInWithApple → signInWithIdToken
 *   android → window.Capacitor.Plugins.GoogleAuth     → signInWithIdToken
 *
 * 로그인 성공 시 기존 device_id 데이터를 auth_user_id에 자동 연결
 */

import { useState, useEffect, useCallback } from 'react';
import {
    NATIVE_AUTH_REDIRECT_URL,
    supabase,
    signInWithAppleToken,
    signInWithGoogleToken,
    signInWithKakao as supabaseSignInWithKakao,
    signOut as supabaseSignOut,
    linkAuthToDevice,
    getOAuthRedirectTo,
} from '../lib/supabase.js';

const getCapacitorPlugin = (name) => window?.Capacitor?.Plugins?.[name] ?? null;
const GOOGLE_WEB_CLIENT_ID = '1050279254864-1hgfqf17ve0sc2nlit7kojuace89mond.apps.googleusercontent.com';
let googleAuthReady = false;

export const getPlatform = () => {
    if (window?.Capacitor?.getPlatform) return window.Capacitor.getPlatform();
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    if (/android/i.test(ua)) return 'android';
    return 'web';
};

const applyNativeAuthUrl = async (url, setUser) => {
    if (!url?.startsWith(NATIVE_AUTH_REDIRECT_URL)) return false;
    const parsed = new URL(url);
    const hash = new URLSearchParams((parsed.hash || '').replace(/^#/, ''));
    const errorDescription = parsed.searchParams.get('error_description') || hash.get('error_description');
    if (errorDescription) {
        let displayMsg = errorDescription;
        if (errorDescription.includes('already linked')) {
            displayMsg = '이 소셜 계정은 이미 다른 계정에 연동되어 있습니다. 해당 계정으로 로그인하여 회원 탈퇴 등을 진행한 후 연동해 주세요.';
        }
        alert(displayMsg);
        return false;
    }

    const code = parsed.searchParams.get('code');
    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        setUser(data.session?.user ?? null);
        return true;
    }

    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        if (error) throw error;
        setUser(data.session?.user ?? null);
        return true;
    }
    return false;
};

export const useAuth = () => {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    // 세션 초기화 + 상태 변경 구독
    // SIGNED_IN 이벤트 시 device_id 연결도 처리 (웹 OAuth 리디렉트 복귀 포함)
    useEffect(() => {
        if (!supabase) { setLoading(false); return; }
        let appUrlListener = null;

        // Web OAuth error check
        const checkWebAuthError = () => {
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const searchParams = new URLSearchParams(window.location.search);
            const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
            if (errorDescription) {
                let displayMsg = errorDescription;
                if (errorDescription.includes('already linked')) {
                    displayMsg = '이 소셜 계정은 이미 다른 계정에 연동되어 있습니다. 해당 계정으로 로그인하여 회원 탈퇴 등을 진행한 후 연동해 주세요.';
                }
                alert(displayMsg);
                window.location.hash = '';
            }
        };
        checkWebAuthError();

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user ?? null);
            if (event === 'SIGNED_IN' && session?.user) {
                await linkAuthToDevice(session.user.id);
            }
        });

        if (getPlatform() !== 'web') {
            import('@capacitor/app').then(({ App }) => {
                App.getLaunchUrl?.().then(result => {
                    if (!result?.url) return;
                    return applyNativeAuthUrl(result.url, setUser);
                }).catch(e => {
                    console.warn('[useAuth] Native launch URL check failed:', e);
                });

                App.addListener('appUrlOpen', async ({ url }) => {
                    try {
                        await applyNativeAuthUrl(url, setUser);
                    } catch (e) {
                        console.error('[useAuth] Native OAuth callback failed:', e);
                    }
                }).then(listener => { appUrlListener = listener; });
            }).catch(e => {
                console.warn('[useAuth] App URL listener unavailable:', e);
            });
        }

        return () => {
            subscription.unsubscribe();
            appUrlListener?.remove?.();
        };
    }, []);

    /** Apple 로그인: 웹은 OAuth 리디렉트, iOS는 네이티브 플러그인 */
    const signInWithApple = useCallback(async () => {
        try {
            if (getPlatform() === 'web') {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'apple',
                    options: { redirectTo: window.location.origin },
                });
                if (error) throw error;
                return { success: true };
            }
            const plugin = getCapacitorPlugin('SignInWithApple');
            if (!plugin) throw new Error('SignInWithApple plugin not available');
            const { response } = await plugin.authorize({
                clientId: 'com.soujinne.hanjaexplorer',
                redirectURI: 'https://mjcvtcjdlttxpsgieebv.supabase.co/auth/v1/callback',
                scopes: 'email name',
                state: Math.random().toString(36).slice(2),
            });
            const { data, error } = await signInWithAppleToken(response.identityToken);
            if (error) throw error;
            await linkAuthToDevice(data.user.id);
            return { success: true };
        } catch (e) {
            console.error('[useAuth] Apple Sign In failed:', e);
            return { success: false, error: e };
        }
    }, []);

    /** Google 로그인: 웹은 OAuth 리디렉트, Android는 네이티브 플러그인 */
    const signInWithGoogle = useCallback(async () => {
        try {
            if (getPlatform() === 'web') {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin },
                });
                if (error) throw error;
                return { success: true };
            }
            const plugin = getCapacitorPlugin('GoogleAuth');
            if (!plugin) throw new Error('GoogleAuth plugin not available');
            if (!googleAuthReady && plugin.initialize) {
                await plugin.initialize({
                    clientId: GOOGLE_WEB_CLIENT_ID,
                    scopes: ['profile', 'email'],
                    grantOfflineAccess: true,
                });
                googleAuthReady = true;
            }
            const googleUser = await plugin.signIn();
            const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
            if (!idToken) throw new Error('GoogleAuth did not return an idToken');
            const { data, error } = await signInWithGoogleToken(idToken);
            if (error) throw error;
            await linkAuthToDevice(data.user.id);
            return { success: true };
        } catch (e) {
            console.error('[useAuth] Google Sign In failed:', e);
            return { success: false, error: e };
        }
    }, []);

    const signInWithKakao = useCallback(async () => {
        try {
            const isNative = getPlatform() !== 'web';
            const result = await supabaseSignInWithKakao({ skipBrowserRedirect: isNative });
            if (!result.success) throw result.error;
            if (isNative) {
                if (!result.url) throw new Error('Kakao OAuth URL was not returned');
                window.location.href = result.url;
            }
            return { success: true };
        } catch (e) {
            console.error('[useAuth] Kakao Sign In failed:', e);
            return { success: false, error: e };
        }
    }, []);

    const signOut = useCallback(async () => {
        await supabaseSignOut();
        setUser(null);
    }, []);

    const linkIdentity = useCallback(async (provider) => {
        try {
            const isNative = getPlatform() !== 'web';
            const { data, error } = await supabase.auth.linkIdentity({
                provider,
                options: {
                    redirectTo: getOAuthRedirectTo(),
                    skipBrowserRedirect: isNative,
                }
            });
            if (error) throw error;
            if (isNative && data?.url) {
                window.location.href = data.url;
            }
            return { success: true };
        } catch (e) {
            console.error(`[useAuth] linkIdentity failed for ${provider}:`, e);
            alert(`연동 실패: ${e.message || e}`);
            return { success: false, error: e };
        }
    }, []);

    return { user, loading, platform: getPlatform(), signInWithApple, signInWithGoogle, signInWithKakao, signOut, linkIdentity };
};
