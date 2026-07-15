/**
 * Envio de pedidos direto para a UTMify (API Credentials).
 * Docs: https://docs.utmify.com.br/orders (POST /api-credentials/orders)
 *
 * Chamado do backend em 2 momentos:
 *  1) Ao criar PIX -> status "waiting_payment"
 *  2) Ao confirmar pagamento -> status "paid" (mesmo orderId)
 */

type UtmifyStatus = 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback'

export interface UtmifyOrderInput {
  orderId: string
  status: UtmifyStatus
  amountInCents: number
  productTitle: string
  productId?: string
  customer: {
    name?: string | null
    email?: string | null
    phone?: string | null
    document?: string | null
    ip?: string | null
  }
  utm?: string | null
  createdAt?: Date
  approvedAt?: Date | null
}

function toUtcString(d: Date): string {
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
}

/**
 * Decodifica valor UTM lidando com double/triple encoding e placeholders
 * não-substituídos do Facebook Ads (ex: "{{campaign.name}}").
 */
function normalizeUtmValue(raw: string | null): string | null {
  if (!raw) return null
  let v = raw
  // Decodifica até 3x (cobre casos %2520 -> %20 -> espaço)
  for (let i = 0; i < 3; i++) {
    try {
      const dec = decodeURIComponent(v.replace(/\+/g, ' '))
      if (dec === v) break
      v = dec
    } catch { break }
  }
  v = v.trim()
  if (!v) return null
  // Descarta placeholders do Meta/Ads não substituídos
  if (/^\{\{.*\}\}$/.test(v)) return null
  // Limite defensivo (UTMify aceita valores longos, mas prevenimos abuso)
  if (v.length > 500) v = v.slice(0, 500)
  return v
}

function parseUtm(utm?: string | null) {
  const out: Record<string, string | null> = {
    src: null,
    sck: null,
    utm_source: null,
    utm_campaign: null,
    utm_medium: null,
    utm_content: null,
    utm_term: null,
  }
  if (!utm) return out
  // Remove '?' inicial se vier junto
  const clean = utm.replace(/^\?+/, '')
  try {
    const params = new URLSearchParams(clean)
    for (const k of Object.keys(out)) {
      out[k] = normalizeUtmValue(params.get(k))
    }
  } catch {
    // Fallback: parse manual
    for (const pair of clean.split('&')) {
      const [rawK, rawV = ''] = pair.split('=')
      const k = rawK?.toLowerCase()
      if (k && k in out) out[k] = normalizeUtmValue(rawV)
    }
  }
  return out
}

export async function sendUtmifyOrder(input: UtmifyOrderInput): Promise<void> {
  const token = process.env.UTMIFY_API_TOKEN
  if (!token) {
    console.warn('[utmify] UTMIFY_API_TOKEN not set; skipping order send')
    return
  }

  const created = input.createdAt ?? new Date()
  const approved = input.status === 'paid' ? (input.approvedAt ?? new Date()) : null

  const doc = (input.customer.document ?? '').replace(/\D/g, '') || null

  const payload = {
    orderId: input.orderId,
    platform: 'Havan',
    paymentMethod: 'pix',
    status: input.status,
    createdAt: toUtcString(created),
    approvedDate: approved ? toUtcString(approved) : null,
    refundedAt: null,
    customer: {
      name: input.customer.name || 'Cliente',
      email: input.customer.email || 'cliente@havan.com.br',
      phone: input.customer.phone || null,
      document: doc,
      country: 'BR',
      ip: input.customer.ip || null,
    },
    products: [
      {
        id: input.productId || 'front',
        name: input.productTitle,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: input.amountInCents,
      },
    ],
    trackingParameters: parseUtm(input.utm),
    commission: {
      totalPriceInCents: input.amountInCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: input.amountInCents,
      currency: 'BRL',
    },
    isTest: false,
  }

  try {
    const res = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': token,
      },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    if (!res.ok) {
      console.error(`[utmify] send failed [${res.status}]: ${text.substring(0, 500)}`)
    } else {
      console.log(`[utmify] order ${input.orderId} status=${input.status} sent OK`)
    }
  } catch (err: any) {
    console.error('[utmify] send error:', err?.message ?? err)
  }
}