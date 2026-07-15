/**
 * Testes automatizados do fluxo do funil /1 -> checkout,
 * incluindo geração de PIX (Velani) e envio de status para UTMify.
 *
 * Requer o dev server rodando em http://localhost:8080 e os secrets
 * VELANI_*, UTMIFY_API_TOKEN e CPF_API_* configurados no ambiente.
 *
 * Rode com:  bunx vitest run tests/funnel-flow.test.ts
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:8080'
const TEST_CPF = process.env.TEST_CPF ?? '57948135715'

async function j(res: Response) {
  const txt = await res.text()
  try { return JSON.parse(txt) } catch { return { raw: txt } }
}

const UTM_STRING =
  'utm_source=FB&utm_campaign=CVZADA%25201%257C123&utm_medium=cpc&utm_content=criativo%2520A&utm_term=palavra'

describe('Funnel /1 -> checkout -> PIX -> UTMify', () => {
  let transactionId: string | undefined

  beforeAll(async () => {
    // Sanity: dev server responde
    const r = await fetch(`${BASE}/funil/1/index.html`)
    if (!r.ok) throw new Error(`dev server not ready: ${r.status}`)
  })

  it('1. GET /funil/1/index.html serve a página inicial do funil', async () => {
    const res = await fetch(`${BASE}/funil/1/index.html`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html.toLowerCase()).toContain('<html')
  })

  it('2. GET /funil/1/ preserva query string de UTM (redirect friendly)', async () => {
    const res = await fetch(`${BASE}/funil/1/index.html?${UTM_STRING}`)
    expect(res.status).toBe(200)
  })

  it('3. GET /api/cpf/:cpf retorna dados válidos para CPF real', async () => {
    const res = await fetch(`${BASE}/api/cpf/${TEST_CPF}`)
    expect(res.status).toBe(200)
    const body = await j(res)
    expect(body).toBeTruthy()
    // aceita variações comuns do provider
    const name = body?.nome ?? body?.name ?? body?.data?.nome ?? body?.NOME
    expect(typeof name === 'string' && name.length > 2).toBe(true)
  })

  it('4. POST /api/pix/create gera pixCode e transactionId', async () => {
    const res = await fetch(`${BASE}/api/pix/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 3490,
        description: 'Havan - Teste automatizado',
        customer: {
          name: 'Cliente Teste',
          document: TEST_CPF,
          email: 'teste@havan.com.br',
          phone: '11999999999',
        },
        item: { title: 'Kit Havan', price: 3490, quantity: 1 },
        utm: UTM_STRING,
        product: 'front',
      }),
    })
    expect(res.status).toBe(200)
    const body = await j(res)
    expect(body.pixCode).toBeTruthy()
    expect(body.transactionId).toBeTruthy()
    transactionId = body.transactionId
  })

  it('5. POST /api/pix/create rejeita corpo inválido', async () => {
    const res = await fetch(`${BASE}/api/pix/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('6. GET /api/pix/status retorna status para o transactionId gerado', async () => {
    expect(transactionId).toBeTruthy()
    const res = await fetch(
      `${BASE}/api/pix/status?transactionId=${encodeURIComponent(transactionId!)}`,
    )
    expect(res.status).toBe(200)
    const body = await j(res)
    expect(['PENDING', 'COMPLETED', 'FAILED', 'CANCELED']).toContain(body.status)
  })

  it('7. UTMify: sendUtmifyOrder decodifica UTMs e envia payload correto', async () => {
    // Espia fetch para capturar a chamada da UTMify sem depender da rede
    const originalFetch = globalThis.fetch
    const spy = vi.fn(async (url: any, init?: any) => {
      if (String(url).includes('api.utmify.com.br')) {
        return new Response('{"ok":true}', { status: 200 })
      }
      return originalFetch(url, init)
    })
    // @ts-expect-error - override
    globalThis.fetch = spy

    // Garante token para o módulo não pular o envio
    if (!process.env.UTMIFY_API_TOKEN) process.env.UTMIFY_API_TOKEN = 'test-token'

    const { sendUtmifyOrder } = await import('../src/lib/utmify.server')
    await sendUtmifyOrder({
      orderId: 'test-order-1',
      status: 'waiting_payment',
      amountInCents: 3490,
      productTitle: 'Kit Havan',
      productId: 'front',
      customer: {
        name: 'Cliente Teste',
        email: 'teste@havan.com.br',
        phone: '11999999999',
        document: TEST_CPF,
        ip: '127.0.0.1',
      },
      utm: UTM_STRING,
    })

    globalThis.fetch = originalFetch

    const call = spy.mock.calls.find((c) => String(c[0]).includes('api.utmify.com.br'))
    expect(call, 'utmify endpoint deve ser chamado').toBeTruthy()
    const payload = JSON.parse(call![1].body)
    expect(payload.orderId).toBe('test-order-1')
    expect(payload.status).toBe('waiting_payment')
    expect(payload.customer.ip).toBe('127.0.0.1')
    expect(payload.trackingParameters.utm_source).toBe('FB')
    // Double-encoded '%2520' vira espaço apos decode
    expect(payload.trackingParameters.utm_campaign).toBe('CVZADA 1|123')
    expect(payload.trackingParameters.utm_content).toBe('criativo A')
    expect(payload.trackingParameters.utm_medium).toBe('cpc')
    expect(payload.trackingParameters.utm_term).toBe('palavra')
  })

  it('8. UTMify: transição de status waiting_payment -> paid mantém orderId', async () => {
    const originalFetch = globalThis.fetch
    const captured: any[] = []
    const spy = vi.fn(async (url: any, init?: any) => {
      if (String(url).includes('api.utmify.com.br')) {
        captured.push(JSON.parse(init.body))
        return new Response('{"ok":true}', { status: 200 })
      }
      return originalFetch(url, init)
    })
    // @ts-expect-error
    globalThis.fetch = spy

    if (!process.env.UTMIFY_API_TOKEN) process.env.UTMIFY_API_TOKEN = 'test-token'
    const { sendUtmifyOrder } = await import('../src/lib/utmify.server')

    const base = {
      orderId: 'tx-abc-123',
      amountInCents: 3490,
      productTitle: 'Kit Havan',
      productId: 'front',
      customer: { name: 'Cliente', document: TEST_CPF, ip: '1.2.3.4' },
      utm: UTM_STRING,
    }
    await sendUtmifyOrder({ ...base, status: 'waiting_payment' })
    await sendUtmifyOrder({ ...base, status: 'paid', approvedAt: new Date() })

    globalThis.fetch = originalFetch

    expect(captured.length).toBe(2)
    expect(captured[0].orderId).toBe('tx-abc-123')
    expect(captured[0].status).toBe('waiting_payment')
    expect(captured[0].approvedDate).toBeNull()
    expect(captured[1].orderId).toBe('tx-abc-123')
    expect(captured[1].status).toBe('paid')
    expect(captured[1].approvedDate).toBeTruthy()
  })
})
