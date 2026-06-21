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
import {
    supabase,
    signInWithAppleToken,
    signInWithGoogleToken,
    signInWithKakao as supabaseSignInWithKakao,
    signOut as supabaseSignOut,
} from '../lib/supabase.js';

const getCapacitorPlugin = (name) => window?.Capacitor?.Plugins?.[name] ?? null;

export const getPlatform = () => {
    if (window?.Capacitor?.getPlatform) return window.Capacitor.getPlatform();
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    if (/android/i.test(ua)) return 'android';
    return 'web';
};

export const useAuth = () => {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    // 세션 초기화 + 상태 변경 구독
    // 웹 OAuth 리디렉트 복귀를 포함한 인증 상태만 관리한다.
    // 새 소셜 계정에 기기 데이터를 자동 연결하면 기존 계정과 기록이 갈라질 수 있어
    // 데이터 연결은 사용자가 명시적으로 선택한 뒤 수행한다.
    useEffect(() => {
        if (!supabase) { setLoading(false); return; }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    /** Apple 로그인: 웹은 OAuth 리디렉트, iOS는 네이티브 플러그인 */
    const signInWithApple = useCallback(async () => {
        try {
            if (getPlatform() === 'web') {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'apple',
                    options: { 
                        redirectTo: window.location.origin,
                        queryParams: { prompt: 'login' }
                    },
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
                    options: { 
                        redirectTo: window.location.origin,
                        queryParams: { prompt: 'select_account' }
                    },
                });
                if (error) throw error;
                return { success: true };
            }
            const plugin = getCapacitorPlugin('GoogleAuth');
            if (!plugin) throw new Error('GoogleAuth plugin not available');
            const googleUser = await plugin.signIn();
            const { data, error } = await signInWithGoogleToken(googleUser.authentication.idToken);
            if (error) throw error;
            return { success: true };
        } catch (e) {
            console.error('[useAuth] Google Sign In failed:', e);
            return { success: false, error: e };
        }
    }, []);

    const signInWithKakao = useCallback(async () => {
        try {
            const result = await supabaseSignInWithKakao();
            if (!result.success) throw result.error;
            return { success: true };
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

    return { user, loading, platform: getPlatform(), signInWithApple, signInWithGoogle, signInWithKakao, signOut };
};
