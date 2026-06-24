import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VARIANT_TO_PACK: Record<string, number> = {
    '1763592': 1,
    '1763593': 2,
    '1763594': 3,
}

const REFERRAL_FULLPACK_20_VARIANT_ID = Deno.env.get('LEMON_REFERRAL_FULLPACK_20_VARIANT_ID') ?? Deno.env.get('LEMON_REFERRAL_FULLPACK_VARIANT_ID') ?? ''
const REFERRAL_FULLPACK_50_VARIANT_ID = Deno.env.get('LEMON_REFERRAL_FULLPACK_50_VARIANT_ID') ?? ''
if (REFERRAL_FULLPACK_20_VARIANT_ID) VARIANT_TO_PACK[REFERRAL_FULLPACK_20_VARIANT_ID] = 3
if (REFERRAL_FULLPACK_50_VARIANT_ID) VARIANT_TO_PACK[REFERRAL_FULLPACK_50_VARIANT_ID] = 3

function hexToUint8Array(hex: string): Uint8Array {
    if (!/^[\da-f]{64}$/i.test(hex)) return new Uint8Array()
    const pairs = hex.match(/[\da-f]{2}/gi) ?? []
    return new Uint8Array(pairs.map(h => parseInt(h, 16)))
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
    const secret = Deno.env.get('LEMON_SIGNING_SECRET') ?? ''
    if (!secret) return false
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
    )
    const signatureBytes = hexToUint8Array(signature)
    if (signatureBytes.length !== 32) return false
    return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(body))
}

Deno.serve(async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const body = await req.text()
    if (!await verifySignature(body, req.headers.get('X-Signature') ?? '')) {
        return new Response('Unauthorized', { status: 401 })
    }

    let payload: any
    try {
        payload = JSON.parse(body)
    } catch {
        return new Response('Invalid JSON', { status: 400 })
    }

    const eventName = String(payload.meta?.event_name ?? '')
    if (!['order_created', 'order_refunded'].includes(eventName)) {
        return new Response('OK - ignored', { status: 200 })
    }

    const attributes = payload.data?.attributes ?? {}
    if (eventName === 'order_created' && attributes.status !== 'paid') {
        return new Response('OK - unpaid', { status: 200 })
    }

    const variantId = String(attributes.first_order_item?.variant_id ?? '')
    const pack = VARIANT_TO_PACK[variantId]
    if (!pack) return new Response('Unknown variant', { status: 400 })

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let accountId = payload.meta?.custom_data?.account_id ?? null

    // 배포 전에 생성된 기존 checkout 호환용.
    if (!accountId && payload.meta?.custom_data?.device_id) {
        const { data: legacyProfile } = await supabase
            .from('user_profiles')
            .select('auth_user_id')
            .eq('device_id', payload.meta.custom_data.device_id)
            .maybeSingle()
        if (legacyProfile?.auth_user_id) {
            const { data: identity } = await supabase
                .from('app_account_identities')
                .select('account_id')
                .eq('auth_user_id', legacyProfile.auth_user_id)
                .maybeSingle()
            accountId = identity?.account_id ?? null
        }
    }

    if (!accountId) return new Response('Missing account', { status: 400 })

    const orderId = String(payload.data?.id ?? attributes.identifier ?? '')
    if (!orderId) return new Response('Missing order id', { status: 400 })

    const purchasedAt = attributes.created_at ?? new Date().toISOString()
    const { error } = await supabase.rpc('record_verified_purchase', {
        p_provider: 'lemon',
        p_event_id: `${eventName}:${orderId}`,
        p_event_type: eventName,
        p_transaction_id: orderId,
        p_account_id: accountId,
        p_pack: pack,
        p_status: eventName === 'order_refunded' ? 'refunded' : 'active',
        p_purchased_at: purchasedAt,
        p_event_at: attributes.updated_at ?? purchasedAt,
    })

    if (error) {
        console.error('Purchase ledger update failed:', error)
        return new Response('Database error', { status: 500 })
    }

    const referralOfferId = payload.meta?.custom_data?.referral_offer_id ?? null
    if (eventName === 'order_created' && referralOfferId) {
        const { error: offerError } = await supabase.rpc('consume_referral_offer', {
            p_offer_id: referralOfferId,
        })
        if (offerError) console.error('Referral offer consume failed:', offerError)
    }

    return new Response('OK', { status: 200 })
})
