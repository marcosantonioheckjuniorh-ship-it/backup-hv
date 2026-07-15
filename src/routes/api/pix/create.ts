import { createFileRoute } from '@tanstack/react-router'

/**
 * POST /api/pix/create
 * Proxy para a Velani Pagamentos (POST /v1/transactions). Mantém o mesmo
 * contrato de resposta usado pelo funil: { pixCode, transactionId, status }.
 * Chave secreta lida de VELANI_SECRET_KEY (fallback: STRIPE_LIVE_API_KEY).
 * Persiste em pix_transactions.
 */
export const Route = createFileRoute('/api/pix/create')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as {
            amount: number
            description?: string
            customer?: { name?: string; document?: string; email?: string; phone?: string }
            item?: { title?: string; price?: number; quantity?: number }
            paymentMethod?: string
            utm?: string
            product?: string
          }

          const baseUrl = process.env.VELANI_BASE_URL ?? 'https://api.velanipagamentos.com.br/api/v1/api-gateway/v1'
          const secretKey = process.env.VELANI_SECRET_KEY ?? process.env.STRIPE_LIVE_API_KEY
          if (!secretKey) {
            return new Response(JSON.stringify({ error: 'Velani secret key not configured' }), {
              status: 500, headers: { 'Content-Type': 'application/json' },
            })
          }

          // Parse UTM string em várias variantes para maximizar atribuição UTMify/Velani
          const utmSnake: Record<string, string> = {}
          const utmCamel: Record<string, string> = {}
          if (body.utm) {
            try {
              const params = new URLSearchParams(body.utm)
              const map: Array<[string, string]> = [
                ['utm_source', 'utmSource'],
                ['utm_campaign', 'utmCampaign'],
                ['utm_medium', 'utmMedium'],
                ['utm_content', 'utmContent'],
                ['utm_term', 'utmTerm'],
                ['src', 'src'],
                ['sck', 'sck'],
                ['fbclid', 'fbclid'],
                ['gclid', 'gclid'],
              ]
              for (const [snake, camel] of map) {
                const v = params.get(snake)
                if (v) { utmSnake[snake] = v; utmCamel[camel] = v }
              }
            } catch {}
          }

          const cust = body.customer ?? {}
          const docNum = (cust.document ?? '').replace(/\D/g, '')
          const velaniPayload: Record<string, unknown> = {
            paymentMethod: 'pix',
            amount: body.amount,
            description: body.description ?? 'Havan',
            customer: {
              name: cust.name || 'Cliente Havan',
              email: cust.email || 'cliente@havan.com.br',
              phone: cust.phone || '11999999999',
              ...(docNum.length === 11 || docNum.length === 14
                ? { document: { type: docNum.length === 11 ? 'cpf' : 'cnpj', number: docNum } }
                : {}),
            },
            items: [{
              title: body.item?.title ?? body.description ?? 'Havan',
              unitPrice: body.item?.price ?? body.amount,
              quantity: body.item?.quantity ?? 1,
            }],
            ...(body.product ? { externalId: body.product } : {}),
            ...(Object.keys(utmSnake).length
              ? {
                  tracking: { ...utmSnake, ...utmCamel },
                  metadata: { ...utmSnake, ...utmCamel },
                  utm: body.utm,
                  ...utmSnake,
                  ...utmCamel,
                }
              : {}),
          }

          const upstream = await fetch(`${baseUrl}/transactions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': secretKey,
            },
            body: JSON.stringify(velaniPayload),
          })

          const text = await upstream.text()
          let result: any
          try { result = JSON.parse(text) } catch { result = { raw: text } }

          if (!upstream.ok) {
            console.error(`Velani PIX create failed [${upstream.status}]: ${text.substring(0, 500)}`)
            return new Response(JSON.stringify({ error: 'PIX provider error', status: upstream.status, body: result }), {
              status: 502, headers: { 'Content-Type': 'application/json' },
            })
          }

          // Normaliza para o formato esperado pelo funil (Duttyfy-compat)
          const data = result?.data ?? {}
          const normalized = {
            transactionId: data.id,
            pixCode: data.pixQrCode,
            pixQrCodeImage: data.pixQrCodeImage,
            status: (data.status ?? 'pending').toUpperCase() === 'PAID' ? 'COMPLETED' : 'PENDING',
            expiresAt: data.expiresAt,
          }

          if (normalized.transactionId) {
            const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
            await supabaseAdmin.from('pix_transactions').insert({
              transaction_id: normalized.transactionId,
              amount: body.amount,
              product: body.product ?? body.description ?? 'unknown',
              customer_name: body.customer?.name ?? null,
              customer_cpf: body.customer?.document ?? null,
              utm: body.utm ?? null,
              status: 'PENDING',
              pix_code: normalized.pixCode ?? null,
            })
          }

          return new Response(JSON.stringify(normalized), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          })
        } catch (err: any) {
          console.error('PIX create error:', err)
          return new Response(JSON.stringify({ error: err?.message ?? 'unknown' }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
