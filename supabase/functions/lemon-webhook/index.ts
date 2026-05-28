/**
 * lemon-webhook/index.ts
 * Lemon Squeezy 결제 완료 웹훅 처리
 *
 * 동작:
 *   order_created (status: paid) 이벤트 수신
 *   → custom_data.device_id 로 유저 식별
 *   → user_profiles.is_premium = true 업데이트
 *
 * 환경 변수 (Supabase 대시보드에서 설정):
 *   LEMON_SIGNING_SECRET  - LS 웹훅 서명 시크릿
 *   SUPABASE_URL          - 자동 주입
 *   SUPABASE_SERVICE_ROLE_KEY - 자동 주입
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // POST만 허용
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    const body = await req.text()
    const signature = req.headers.get('X-Signature') ?? ''

    // 서명 검증
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

    // order_created + paid 이벤트만 처리
    if (eventName !== 'order_created' || status !== 'paid') {
        return new Response('OK - ignored', { status: 200 })
    }

    // device_id 추출
    const deviceId = payload.meta?.custom_data?.device_id
    if (!deviceId) {
        console.error('No device_id in custom_data')
        return new Response('Missing device_id', { status: 400 })
    }

    // Supabase 업데이트 (service role key 사용 - RLS 우회)
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase
        .from('user_profiles')
        .update({
            is_premium: true,
            updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId)

    if (error) {
        console.error('Supabase update error:', error)
        return new Response('DB error', { status: 500 })
    }

    console.log(`✅ Premium activated for device_id: ${deviceId}`)
    return new Response('OK', { status: 200 })
})
