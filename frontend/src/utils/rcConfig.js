/**
 * RevenueCat 설정
 *
 * 설정 방법:
 *   1. RevenueCat 대시보드 → 프로젝트 → API Keys 에서 iOS/Android 키 복사
 *   2. 아래 RC_API_KEY_IOS / RC_API_KEY_ANDROID 에 붙여넣기
 *
 *   3. Play Console + App Store Connect에서 인앱상품(비소모성) 등록
 *      - 상품 ID는 아래 RC_PRODUCT_IDS 값과 동일해야 함
 *
 *   4. RevenueCat 대시보드 → Products → 각 상품 추가
 *   5. RevenueCat 대시보드 → Entitlements → pack1 / pack2 / fullpack 생성
 *      → 각 entitlement에 해당 product 연결
 *   6. RevenueCat 대시보드 → Offerings → Default offering 생성
 *      → 3개 package 추가 (identifier는 RC_PRODUCT_IDS 값과 동일)
 */

// ── API 키 ────────────────────────────────────────────────────────────────
// RevenueCat 대시보드 > API Keys > iOS / Android SDK Key
export const RC_API_KEY_IOS     = 'appl_pNzDkEyCUTMxnvWJuQzrpYocFeN';
export const RC_API_KEY_ANDROID = 'goog_WZvGTzxNuyrupdLpaCxoIUZyqgF';

// ── 상품 ID ───────────────────────────────────────────────────────────────
// Play Console / App Store Connect에 등록하는 상품 ID와 동일해야 함
export const RC_PRODUCT_IDS = {
    pack1:    'com.soujinne.hanjaexplorer.pack1',     // ₩9,900  기초 팩 (18~51단계)
    pack2:    'com.soujinne.hanjaexplorer.pack2',     // ₩13,900 심화 팩 (52~124단계)
    fullpack: 'com.soujinne.hanjaexplorer.fullpack',  // ₩19,900 전체 팩 (18~124단계)
};

export const RC_REFERRAL_PRODUCT_IDS = {
    fullpack20: String(import.meta.env.VITE_RC_REFERRAL_FULLPACK_20_PRODUCT_ID || import.meta.env.VITE_RC_REFERRAL_FULLPACK_PRODUCT_ID || '').trim(),
    fullpack50: String(import.meta.env.VITE_RC_REFERRAL_FULLPACK_50_PRODUCT_ID || '').trim(),
};

// ── Entitlement ID ────────────────────────────────────────────────────────
// RevenueCat 대시보드 > Entitlements에 등록한 ID와 동일해야 함
export const RC_ENTITLEMENTS = {
    pack1:    'pack1',
    pack2:    'pack2',
    fullpack: 'fullpack',
};

// entitlement active 상태 → unlocked_pack 숫자 변환
export const entitlementsToPack = (activeEntitlements) => {
    if (activeEntitlements[RC_ENTITLEMENTS.fullpack]) return 3;
    if (activeEntitlements[RC_ENTITLEMENTS.pack2])    return 2;
    if (activeEntitlements[RC_ENTITLEMENTS.pack1])    return 1;
    return 0;
};
