import { createFileRoute } from '@tanstack/react-router'

/**
 * POST /api/pix/create
 * Proxy para a API PIX Duttyfy. Recebe payload do frontend, encaminha para
 * o gateway Duttyfy (URL criptografada em DUTTYFY_PIX_URL_ENCRYPTED) e
 * persiste a transação em pix_transactions.
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

          const gatewayUrl = process.env.DUTTYFY_PIX_URL_ENCRYPTED
          if (!gatewayUrl) {
            return new Response(JSON.stringify({ error: 'PIX gateway not configured' }), {
              status: 500, headers: { 'Content-Type': 'application/json' },
            })
          }

          // Encaminha para Duttyfy
          const upstream = await fetch(gatewayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: body.amount,
              description: body.description ?? 'Havan',
              customer: body.customer ?? {},
              item: body.item ?? { title: 'Havan', price: body.amount, quantity: 1 },
              paymentMethod: body.paymentMethod ?? 'PIX',
              utm: body.utm ?? '',
            }),
          })

          const text = await upstream.text()
          let result: any
          try { result = JSON.parse(text) } catch { result = { raw: text } }

          if (!upstream.ok) {
            console.error(`Duttyfy PIX create failed [${upstream.status}]: ${text}`)
            return new Response(JSON.stringify({ error: 'PIX provider error', status: upstream.status, body: result }), {
              status: 502, headers: { 'Content-Type': 'application/json' },
            })
          }

          // Persistir transação
          if (result.transactionId) {
            const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
            await supabaseAdmin.from('pix_transactions').insert({
              transaction_id: result.transactionId,
              amount: body.amount,
              product: body.product ?? body.description ?? 'unknown',
              customer_name: body.customer?.name ?? null,
              customer_cpf: body.customer?.document ?? null,
              utm: body.utm ?? null,
              status: 'PENDING',
              pix_code: result.pixCode ?? null,
            })
          }

          return new Response(JSON.stringify(result), {
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
