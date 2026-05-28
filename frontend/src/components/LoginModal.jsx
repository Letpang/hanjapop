/**
 * LoginModal.jsx
 * 로그인 모달 — iOS는 애플, Android는 구글 버튼 표시
 * 결제 또는 데이터 백업/복원 시 노출
 */

import React, { useState } from 'react';

export default function LoginModal({ onClose, platform, signInWithApple, signInWithGoogle }) {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    const handleApple = async () => {
        setLoading(true); setError(null);
        const result = await signInWithApple();
        setLoading(false);
        if (result.success) onClose?.();
        else setError('애플 로그인에 실패했습니다. 다시 시도해주세요.');
    };

    const handleGoogle = async () => {
        setLoading(true); setError(null);
        const result = await signInWithGoogle();
        setLoading(false);
        if (result.success) onClose?.();
        else setError('구글 로그인에 실패했습니다. 다시 시도해주세요.');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
             style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-md rounded-t-3xl p-8 pb-12"
                 style={{ background: 'var(--card-bg, #fff)' }}>

                {/* 헤더 */}
                <div className="relative flex items-center justify-center mb-6">
                    <h2 className="text-xl font-bold">로그인</h2>
                    <button onClick={onClose} className="absolute right-0 text-2xl text-gray-400">✕</button>
                </div>

                {/* 설명 */}
                <p className="text-sm text-gray-500 mb-8 leading-relaxed text-center">
                    로그인하면 학습 데이터와 구매 내역이<br />
                    기기를 바꿔도 유지됩니다.
                </p>

                {/* 로그인 버튼 */}
                {platform === 'ios' && (
                    <button
                        onClick={handleApple}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-3 font-semibold text-white"
                        style={{ background: '#000', opacity: loading ? 0.6 : 1 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Apple로 로그인
                    </button>
                )}

                {platform === 'android' && (
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-3 font-semibold border"
                        style={{ background: '#fff', borderColor: '#ddd', opacity: loading ? 0.6 : 1 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google로 로그인
                    </button>
                )}

                {platform === 'web' && (
                    <>
                        <button
                            onClick={handleApple}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-3 font-semibold text-white"
                            style={{ background: '#000', opacity: loading ? 0.6 : 1 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            Apple로 로그인
                        </button>
                        <button
                            onClick={handleGoogle}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl mb-3 font-semibold border"
                            style={{ background: '#fff', borderColor: '#ddd', opacity: loading ? 0.6 : 1 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Google로 로그인
                        </button>
                    </>
                )}

                {error && (
                    <p className="text-red-500 text-sm text-center mt-3">{error}</p>
                )}
            </div>
        </div>
    );
}
