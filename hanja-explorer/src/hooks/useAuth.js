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
    supabase,
    signInWithAppleToken,
    signInWithGoogleToken,
    signInWithKakao as supabaseSignInWithKakao,
    signOut as supabaseSignOut,
    linkAuthToDevice,
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
    // SIGNED_IN 이벤트 시 device_id 연결도 처리 (웹 OAuth 리디렉트 복귀 포함)
    useEffect(() => {
        if (!supabase) { setLoading(false); return; }

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

        return () => subscription.unsubscribe();
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
            const googleUser = await plugin.signIn();
            const { data, error } = await signInWithGoogleToken(googleUser.authentication.idToken);
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
            const result = await supabaseSignInWithKakao();
            if (!result.success) throw result.error;
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

    return { user, loading, platform: getPlatform(), signInWithApple, signInWithGoogle, signInWithKakao, signOut };
};
