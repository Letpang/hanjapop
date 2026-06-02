/**
 * lemon-webhook/index.ts
 * Lemon Squeezy 결제 완료 웹훅 처리
 *
 * 동작:
 *   order_created (status: paid) 이벤트 수신
 *   → variant_id로 구매한 팩 식별
 *   → custom_data.device_id로 유저 식별
 *   → user_profiles.unlocked_pack 업데이트
 *   → pack1 + pack2 동시 보유 시 자동으로 fullpack(3) 승격
 *
 * 환경 변수 (Supabase 대시보드에서 설정):
 *   LEMON_SIGNING_SECRET      - LS 웹훅 서명 시크릿
 *   SUPABASE_URL              - 자동 주입
 *   SUPABASE_SERVICE_ROLE_KEY - 자동 주입
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// variant_id → unlocked_pack 번호
const VARIANT_TO_PACK: Record<string, number> = {
    '1085100': 1,   // 기초 팩  (18~51단계)  ₩9,900
    '1700393': 2,   // 심화 팩  (52~124단계) ₩13,900
    '1711552': 3,   // 전체 팩  (18~124단계) ₩19,900
}

// pack1 + pack2 동시 보유 → fullpack(3) 승격
function resolvePack(current: number, purchased: number): number {
    const next = Math.max(current, purchased)
    if ((current === 1 && purchased === 2) || (current === 2 && purchased === 1)) return 3
    return next
}

// ── 서명 검증 ────────────────────────────────────────────────────────────────

function hexToUint8Array(hex: string): Uint8Array {
    const pairs = hex.match(/[\da-f]{2}/gi) ?? []
    return new Uint8Array(pairs.map(h => parseInt(h, 16)))
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
    const secret = Deno.env.get('LEMON_SIGNING_SECRET') ?? ''
    if (!secret) return false
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    )
    const sigBytes = hexToUint8Array(signature)
    return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body))
}

// ── 메인 핸들러 ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    const body = await req.text()
    const signature = req.headers.get('X-Signature') ?? ''

    const isValid = await verifySignature(body, signature)
    if (!isValid) {
        console.error('Invalid webhook signature')
        return new Response('Unauthorized', { status: 401 })
    }

    let payload: any
    try {
        payload = JSON.parse(body)
    } catch {
        return new Response('Invalid JSON', { status: 400 })
    }

    const eventName = payload.meta?.event_name
    const status = payload.data?.attributes?.status

    console.log(`Webhook received: ${eventName}, status: ${status}`)

    if (eventName !== 'order_created' || status !== 'paid') {
        return new Response('OK - ignored', { status: 200 })
    }

    // 구매한 팩 식별
    const variantId = String(payload.data?.attributes?.first_order_item?.variant_id ?? '')
    const purchasedPack = VARIANT_TO_PACK[variantId]
    if (!purchasedPack) {
        console.error(`Unknown variant_id: ${variantId}`)
        return new Response(`Unknown variant: ${variantId}`, { status: 400 })
    }

    // 유저 식별
    const deviceId = payload.meta?.custom_data?.device_id
    if (!deviceId) {
        console.error('No device_id in custom_data')
        return new Response('Missing device_id', { status: 400 })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 기존 팩 조회 후 승격 처리
    const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('unlocked_pack')
        .eq('device_id', deviceId)
        .single()

    if (fetchError) {
        console.error('Fetch error:', fetchError)
        return new Response('DB fetch error', { status: 500 })
    }

    const currentPack = profile?.unlocked_pack ?? 0
    const newPack = resolvePack(currentPack, purchasedPack)

    const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
            unlocked_pack: newPack,
            is_premium: true,
            updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId)

    if (updateError) {
        console.error('Update error:', updateError)
        return new Response('DB update error', { status: 500 })
    }

    console.log(`✅ Pack updated: device=${deviceId}, variant=${variantId}, ${currentPack} → ${newPack}`)
    return new Response('OK', { status: 200 })
})
