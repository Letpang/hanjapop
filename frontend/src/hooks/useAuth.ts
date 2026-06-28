/**
 * useAuth.js
 * Apple / Google 소셜 로그인 상태 관리
 *
 * 플랫폼별 로그인 방식:
 *   web     → supabase.auth.signInWithOAuth (리디렉트)
 *   ios     → window.Capacitor.Plugins.SignInWithApple → signInWithIdToken
 *   android → window.Capacitor.Plugins.GoogleAuth     → signInWithIdToken
 *
 * 기존 device_id 데이터 연결은 계정 선택 확인 후 useCloudSync에서 처리
 */

import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useLang } from './useLang.js';
import {
    supabase,
    signOut as supabaseSignOut,
} from '../lib/supabase.js';
import {
    type AppUser,
    type LangApi,
    type NativeUrlListener,
    applyNativeAuthUrl,
    getAuthErrorDisplayMessage,
    getPlatform,
    linkAuthIdentity,
    signInWithAppleProvider,
    signInWithGoogleProvider,
    signInWithKakaoProvider,
} from './authUtils.js';

export { getPlatform } from './authUtils.js';

export const useAuth = () => {
    const { t } = useLang() as LangApi;
    const [user, setUser]       = useState<AppUser>(null);
    const [loading, setLoading] = useState(true);

    // 세션 초기화 + 상태 변경 구독
    // 웹 OAuth 리디렉트 복귀를 포함한 인증 상태만 관리한다.
    // 새 소셜 계정에 기기 데이터를 자동 연결하면 기존 계정과 기록이 갈라질 수 있어
    // 데이터 연결은 사용자가 명시적으로 선택한 뒤 수행한다.
    useEffect(() => {
        if (!supabase) { setLoading(false); return; }
        let appUrlListener: NativeUrlListener | null = null;

        // Web OAuth error check
        const checkWebAuthError = () => {
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const searchParams = new URLSearchParams(window.location.search);
            const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
            if (errorDescription) {
                alert(getAuthErrorDisplayMessage(errorDescription, t));
                // 에러 파라미터 URL에서 제거 (hash + query string 모두)
                window.history.replaceState(null, '', window.location.pathname);
            }
        };
        checkWebAuthError();

        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
            setUser(session?.user ?? null);
        });

        if (getPlatform() !== 'web') {
            import('@capacitor/app').then(({ App }) => {
                App.getLaunchUrl?.().then(result => {
                    if (!result?.url) return;
                    return applyNativeAuthUrl(result.url, setUser, t);
                }).catch(e => {
                    console.warn('[useAuth] Native launch URL check failed:', e);
                });

                App.addListener('appUrlOpen', async ({ url }: { url: string }) => {
                    try {
                        await applyNativeAuthUrl(url, setUser, t);
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
            return await signInWithAppleProvider();
        } catch (e) {
            console.error('[useAuth] Apple Sign In failed:', e);
            return { success: false, error: e };
        }
    }, []);

    /** Google 로그인: 웹은 OAuth 리디렉트, Android는 네이티브 플러그인 */
    const signInWithGoogle = useCallback(async () => {
        try {
            return await signInWithGoogleProvider();
        } catch (e) {
            console.error('[useAuth] Google Sign In failed:', e);
            return { success: false, error: e };
        }
    }, []);

    const signInWithKakao = useCallback(async () => {
        try {
            return await signInWithKakaoProvider();
        } catch (e) {
            console.error('[useAuth] Kakao Sign In failed:', e);
            return { success: false, error: e };
        }
    }, []);

    const signOut = useCallback(async () => {
        const { error } = await supabaseSignOut();
        if (error) throw error;
        setUser(null);
        return { success: true };
    }, []);

    const linkIdentity = useCallback(async (provider: string) => {
        return linkAuthIdentity(provider, t);
    }, []);

    return { user, loading, platform: getPlatform(), signInWithApple, signInWithGoogle, signInWithKakao, signOut, linkIdentity };
};
