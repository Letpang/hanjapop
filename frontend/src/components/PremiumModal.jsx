import React, { useState } from 'react';
import { openCheckout } from '../utils/paymentUtils.js';
import { useRevenueCat } from '../hooks/useRevenueCat.js';
import { getPlatform } from '../hooks/useAuth.js';
import { fetchUnlockedPack } from '../lib/supabase.js';

const PACKS = [
    {
        id: 'pack1',
        title: '기초 팩',
        subtitle: '18~51단계',
        desc: '34단계 · 약 34일 분량',
        price: '₩9,900',
        color: '#7C83FF',
        bg: '#F5F5FF',
        badge: null,
    },
    {
        id: 'pack2',
        title: '심화 팩',
        subtitle: '52~124단계',
        desc: '73단계 · 약 73일 분량',
        price: '₩13,900',
        color: '#FF9B73',
        bg: '#FFF7F3',
        badge: null,
    },
    {
        id: 'fullpack',
        title: '전체 팩',
        subtitle: '18~124단계 전체',
        desc: '107단계 · 약 4개월 분량 · ₩23,800 → ₩19,900',
        price: '₩19,900',
        color: '#2ED6C5',
        bg: '#F0FEFA',
        badge: 'BEST',
    },
];

export default function PremiumModal({ user, onClose, onShowLogin, onPurchaseSuccess }) {
    const [selected, setSelected] = useState('fullpack');
    const [errorMsg, setErrorMsg] = useState('');
    const [verifying, setVerifying] = useState(false);
    const { initialized, loading, purchasePackage, restorePurchases } = useRevenueCat({ enabled: !!user });
    const isNative = getPlatform() !== 'web';

    const verifyServerEntitlement = async (expectedPack) => {
        setVerifying(true);
        try {
            for (let attempt = 0; attempt < 10; attempt += 1) {
                const serverPack = await fetchUnlockedPack();
                if (serverPack === expectedPack || serverPack === 3) return serverPack;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            return 0;
        } finally {
            setVerifying(false);
        }
    };

    const handleBuy = async () => {
        setErrorMsg('');
        if (!user) {
            onShowLogin?.();
            return;
        }
        if (isNative) {
            // 네이티브(iOS/Android): RevenueCat 인앱결제
            if (!initialized) {
                setErrorMsg('결제 시스템 준비 중입니다. 잠시 후 다시 시도해 주세요.');
                return;
            }
            const result = await purchasePackage(selected);
            if (result.success && result.pack > 0) {
                const verifiedPack = await verifyServerEntitlement(result.pack);
                if (verifiedPack > 0) {
                    onPurchaseSuccess?.(verifiedPack);
                    onClose();
                } else {
                    setErrorMsg('결제는 완료됐지만 서버 확인 중입니다. 잠시 후 다시 확인해 주세요.');
                }
            } else if (!result.cancelled) {
                setErrorMsg('결제 중 오류가 발생했습니다. 다시 시도해 주세요.');
            }
        } else {
            const result = await openCheckout(selected, user.email || '');
            if (!result.success) onShowLogin?.();
        }
    };

    const handleRestore = async () => {
        setErrorMsg('');
        if (!user) {
            onShowLogin?.();
            return;
        }
        if (!isNative) return;
        const result = await restorePurchases();
        if (result.success && result.pack > 0) {
            const verifiedPack = await verifyServerEntitlement(result.pack);
            if (verifiedPack > 0) {
                onPurchaseSuccess?.(verifiedPack);
                onClose();
            } else {
                setErrorMsg('구매 내역을 확인했지만 서버 반영 중입니다. 잠시 후 다시 시도해 주세요.');
            }
        } else if (result.success && result.pack === 0) {
            setErrorMsg('복원할 구매 내역이 없습니다.');
        } else {
            setErrorMsg('복원 중 오류가 발생했습니다.');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center modal-dim"
            onClick={onClose}
        >
            <div
                className="premium-modal-card mobile-bottom-sheet w-full max-w-md rounded-t-[32px] pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
                style={{ background: '#FFFFFF' }}
                onClick={e => e.stopPropagation()}
            >
                {/* 핸들 */}
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 rounded-full bg-gray-200" />
                </div>

                {/* 헤더 */}
                <div className="px-6 pt-3 pb-4 text-center">
                    <h2 className="text-2xl font-medium text-gray-800 tracking-tight">단계 잠금 해제</h2>
                    <p className="text-sm font-normal text-slate-400 mt-1">일회성 구매 · 광고 없이 평생 이용 · 기기 복원 가능</p>
                </div>

                <div className="px-5 mb-5 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#2ED6C5] via-[#7C83FF] to-[#FF9B73] opacity-25 blur-xl rounded-full scale-y-[0.8]" />
                    <div
                        className="rounded-2xl p-[2px] relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #2ED6C5 0%, #7C83FF 50%, #FF9B73 100%)' }}
                    >
                        {/* Shimmer overlay on the gradient border */}
                        <div className="absolute inset-0 bg-white/20" />
                        
                        <div className="premium-widget-card relative rounded-[14px] px-4 py-3.5 flex items-center gap-3.5 h-full"
                             style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                             
                            {/* Icon Container */}
                            <div className="w-14 h-14 rounded-[1rem] bg-gradient-to-br from-[#F5F7FA] to-[#E9EEF5] flex flex-col items-center justify-center shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_2px_8px_rgba(124,131,255,0.15)] border border-white/60 relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/50" />
                                <div className="text-[20px] leading-none font-medium text-[#7C83FF] z-10 drop-shadow-sm">學</div>
                                <div className="mt-1.5 flex gap-[3px] z-10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ED6C5] shadow-sm" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C83FF] shadow-sm" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF9B73] shadow-sm" />
                                </div>
                            </div>
                            
                            <div className="min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gradient-to-r from-[#7C83FF] to-[#FF9B73] text-white tracking-widest shadow-[0_2px_4px_rgba(124,131,255,0.3)]">NEW</span>
                                    <div className="text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-tight">
                                        프리미엄 홈 위젯 포함
                                    </div>
                                </div>
                                <div className="text-[12px] font-normal text-slate-500 dark:text-slate-300 leading-snug break-keep mt-0.5">
                                    앱을 켜지 않고 홈 화면에서 현재 탐험 중인 한자를 확인해요!
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 팩 선택 */}
                <div className="px-5 flex flex-col gap-3 mb-5">
                    {PACKS.map(pack => {
                        const isSel = selected === pack.id;
                        return (
                            <button
                                key={pack.id}
                                onClick={() => setSelected(pack.id)}
                                className={`premium-pack-option w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] text-left relative ${isSel ? 'is-selected' : ''}`}
                                style={{
                                    background: isSel ? pack.bg : '#F8F9FA',
                                    border: isSel ? `2px solid ${pack.color}` : '2px solid transparent',
                                }}
                            >
                                {/* 라디오 */}
                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                                    style={{ borderColor: isSel ? pack.color : '#CBD5E1' }}>
                                    {isSel && <div className="w-2.5 h-2.5 rounded-full" style={{ background: pack.color }} />}
                                </div>
                                {/* 텍스트 */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-normal text-[15px] text-slate-800 dark:text-slate-100">{pack.title}</span>
                                        <span className="text-[12px] font-normal" style={{ color: pack.color }}>{pack.subtitle}</span>
                                        {pack.badge && (
                                            <span className="text-[10px] font-normal text-white px-2 py-0.5 rounded-full" style={{ background: pack.color }}>
                                                {pack.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[12px] text-slate-400 dark:text-slate-300 font-normal mt-0.5">{pack.desc}</div>
                                </div>
                                {/* 가격 */}
                                <div className="text-[15px] font-normal shrink-0" style={{ color: pack.color }}>
                                    {pack.price}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 에러 메시지 */}
                {errorMsg && (
                    <p className="px-6 mb-3 text-center text-[13px] text-red-500 font-normal">{errorMsg}</p>
                )}

                {/* CTA */}
                <div className="px-6">
                    <button
                        onClick={handleBuy}
                        disabled={loading || verifying}
                        className="w-full py-4 rounded-full font-normal text-white text-[17px] shadow-[0_8px_20px_rgba(46,214,197,0.25)] transition-transform active:scale-[0.98] disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #2ED6C5, #0D9488)' }}
                    >
                        {verifying ? '결제 확인 중...' : loading ? '처리 중...' : `${PACKS.find(p => p.id === selected)?.price} · 지금 구매하기`}
                    </button>

                    {/* 네이티브: 구매 복원 / 웹: 로그인 복원 */}
                    {isNative ? (
                        <button
                            onClick={handleRestore}
                            disabled={loading || verifying}
                            className="w-full py-3 mt-1 text-[13px] text-gray-400 font-normal disabled:opacity-60"
                        >
                            이미 구매했어요 → 구매 복원하기
                        </button>
                    ) : (
                        <button
                            onClick={onShowLogin}
                            className="w-full py-3 mt-1 text-[13px] text-gray-400 font-normal"
                        >
                            이미 구매했어요 → 로그인으로 복원
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full py-2 text-[13px] text-gray-300 font-normal"
                    >
                        나중에 하기
                    </button>
                </div>
            </div>
        </div>
    );
}
