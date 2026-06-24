import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRODUCT_TO_PACK: Record<string, number> = {
    'com.soujinne.hanjaexplorer.pack1': 1,
    'com.soujinne.hanjaexplorer.pack2': 2,
    'com.soujinne.hanjaexplorer.fullpack': 3,
}

const REFERRAL_FULLPACK_20_PRODUCT_ID = Deno.env.get('RC_REFERRAL_FULLPACK_20_PRODUCT_ID') ?? Deno.env.get('RC_REFERRAL_FULLPACK_PRODUCT_ID') ?? ''
const REFERRAL_FULLPACK_50_PRODUCT_ID = Deno.env.get('RC_REFERRAL_FULLPACK_50_PRODUCT_ID') ?? ''
if (REFERRAL_FULLPACK_20_PRODUCT_ID) PRODUCT_TO_PACK[REFERRAL_FULLPACK_20_PRODUCT_ID] = 3
if (REFERRAL_FULLPACK_50_PRODUCT_ID) PRODUCT_TO_PACK[REFERRAL_FULLPACK_50_PRODUCT_ID] = 3

const REVOKE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION'])

function constantTimeEqual(left: string, right: string): boolean {
    const encoder = new TextEncoder()
    const a = encoder.encode(left)
    const b = encoder.encode(right)
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i]
    return diff === 0
}

function packFromEvent(event: any): number {
    const entitlements = Array.isArray(event.entitlement_ids) ? event.entitlement_ids : []
    if (entitlements.includes('fullpack')) return 3
    if (entitlements.includes('pack2')) return 2
    if (entitlements.includes('pack1')) return 1
    const productId = String(event.product_id ?? '').split(':')[0]
    return PRODUCT_TO_PACK[productId] ?? 0
}

function accountCandidates(event: any): string[] {
    return [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])]
        .filter((value): value is string => typeof value === 'string')
        .filter(value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

Deno.serve(async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') ?? ''
    const actualAuth = req.headers.get('Authorization') ?? ''
    if (!expectedAuth || !constantTimeEqual(actualAuth, expectedAuth)) {
        return new Response('Unauthorized', { status: 401 })
    }

    let payload: any
    try {
        payload = await req.json()
    } catch {
        return new Response('Invalid JSON', { status: 400 })
    }

    const event = payload.event ?? {}
    const eventId = String(event.id ?? '')
    const eventType = String(event.type ?? '')
    if (!eventId || !eventType) return new Response('Invalid event', { status: 400 })
    if (eventType === 'TEST') return new Response('OK - test', { status: 200 })

    const pack = packFromEvent(event)
    if (!pack) return new Response('OK - unrelated product', { status: 200 })

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let accountId: string | null = null
    for (const candidate of accountCandidates(event)) {
        const { data } = await supabase
            .from('app_accounts')
            .select('id')
            .eq('id', candidate)
            .maybeSingle()
        if (data?.id) {
            accountId = data.id
            break
        }
    }

    if (!accountId) return new Response('Unknown account', { status: 400 })

    const transactionId = String(
        event.original_transaction_id ?? event.transaction_id ?? eventId,
    )
    const purchasedAt = event.purchased_at_ms
        ? new Date(Number(event.purchased_at_ms)).toISOString()
        : new Date().toISOString()

    const { error } = await supabase.rpc('record_verified_purchase', {
        p_provider: 'revenuecat',
        p_event_id: eventId,
        p_event_type: eventType,
        p_transaction_id: transactionId,
        p_account_id: accountId,
        p_pack: pack,
        p_status: REVOKE_EVENTS.has(eventType) ? 'revoked' : 'active',
        p_purchased_at: purchasedAt,
        p_event_at: event.event_timestamp_ms
            ? new Date(Number(event.event_timestamp_ms)).toISOString()
            : purchasedAt,
    })

    if (error) {
        console.error('Purchase ledger update failed:', error)
        return new Response('Database error', { status: 500 })
    }

    return new Response('OK', { status: 200 })
})
