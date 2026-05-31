import React, { useState } from 'react';
import { openCheckout } from '../utils/paymentUtils.js';

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

export default function PremiumModal({ onClose, onShowLogin }) {
    const [selected, setSelected] = useState('fullpack');

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-t-[32px] pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
                style={{ background: '#FFFFFF' }}
                onClick={e => e.stopPropagation()}
            >
                {/* 핸들 */}
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 rounded-full bg-gray-200" />
                </div>

                {/* 헤더 */}
                <div className="px-6 pt-3 pb-4 text-center">
                    <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">단계 잠금 해제</h2>
                    <p className="text-sm font-semibold text-slate-400 mt-1">일회성 구매 · 광고 없이 평생 이용 · 기기 복원 가능</p>
                </div>

                {/* 팩 선택 */}
                <div className="px-5 flex flex-col gap-3 mb-5">
                    {PACKS.map(pack => {
                        const isSel = selected === pack.id;
                        return (
                            <button
                                key={pack.id}
                                onClick={() => setSelected(pack.id)}
                                className="w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] text-left relative"
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
                                        <span className="font-extrabold text-[15px] text-slate-800">{pack.title}</span>
                                        <span className="text-[12px] font-bold" style={{ color: pack.color }}>{pack.subtitle}</span>
                                        {pack.badge && (
                                            <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full" style={{ background: pack.color }}>
                                                {pack.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[12px] text-slate-400 font-semibold mt-0.5">{pack.desc}</div>
                                </div>
                                {/* 가격 */}
                                <div className="text-[15px] font-extrabold shrink-0" style={{ color: pack.color }}>
                                    {pack.price}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="px-6">
                    <button
                        onClick={() => openCheckout(selected)}
                        className="w-full py-4 rounded-full font-black text-white text-[17px] shadow-[0_8px_20px_rgba(46,214,197,0.25)] transition-transform active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #2ED6C5, #0D9488)' }}
                    >
                        {PACKS.find(p => p.id === selected)?.price} · 지금 구매하기
                    </button>
                    <button
                        onClick={onShowLogin}
                        className="w-full py-3 mt-1 text-[13px] text-gray-400 font-medium"
                    >
                        이미 구매했어요 → 로그인으로 복원
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-[13px] text-gray-300 font-medium"
                    >
                        나중에 하기
                    </button>
                </div>
            </div>
        </div>
    );
}
