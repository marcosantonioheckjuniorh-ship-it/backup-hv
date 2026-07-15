import { createFileRoute } from '@tanstack/react-router'

/**
 * GET /api/pix/status?transactionId=xxx
 * Consulta status na Velani (GET /v1/transactions/:id) e atualiza
 * pix_transactions quando pago. Retorna { status: 'COMPLETED' | 'PENDING' }.
 */
export const Route = createFileRoute('/api/pix/status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const transactionId = url.searchParams.get('transactionId')
          if (!transactionId) {
            return new Response(JSON.stringify({ error: 'transactionId required' }), {
              status: 400, headers: { 'Content-Type': 'application/json' },
            })
          }

          const baseUrl = process.env.VELANI_BASE_URL ?? 'https://api.velanipagamentos.com.br/api/v1/api-gateway/v1'
          const apiKey = process.env.VELANI_SECRET_KEY ?? process.env.STRIPE_LIVE_API_KEY ?? process.env.VELANI_PUBLIC_KEY
          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Velani key not configured' }), {
              status: 500, headers: { 'Content-Type': 'application/json' },
            })
          }

          const upstream = await fetch(`${baseUrl}/transactions/${encodeURIComponent(transactionId)}`, {
            method: 'GET',
            headers: { 'x-api-key': apiKey },
          })

          const text = await upstream.text()
          let result: any
          try { result = JSON.parse(text) } catch { result = { raw: text } }

          if (!upstream.ok) {
            return new Response(JSON.stringify({ error: 'provider error', status: upstream.status, body: result }), {
              status: 502, headers: { 'Content-Type': 'application/json' },
            })
          }

          const providerStatus = (result?.data?.status ?? '').toString().toLowerCase()
          const isPaid = providerStatus === 'paid'
          const normalizedStatus = isPaid ? 'COMPLETED' : providerStatus.toUpperCase() || 'PENDING'

          if (isPaid) {
            const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
            const { data: existing } = await supabaseAdmin
              .from('pix_transactions')
              .select('*')
              .eq('transaction_id', transactionId)
              .maybeSingle()

            await supabaseAdmin
              .from('pix_transactions')
              .update({ status: 'COMPLETED', paid_at: new Date().toISOString() })
              .eq('transaction_id', transactionId)

            // Só envia UTMify uma vez (quando muda de PENDING -> COMPLETED)
            if (existing && existing.status !== 'COMPLETED') {
              const { sendUtmifyOrder } = await import('@/lib/utmify.server')
              await sendUtmifyOrder({
                orderId: transactionId,
                status: 'paid',
                amountInCents: existing.amount,
                productTitle: existing.product ?? 'Havan',
                productId: existing.product ?? undefined,
                customer: {
                  name: existing.customer_name,
                  document: existing.customer_cpf,
                },
                utm: existing.utm,
                createdAt: existing.created_at ? new Date(existing.created_at) : undefined,
                approvedAt: new Date(),
              })
            }
          }

          return new Response(JSON.stringify({ status: normalizedStatus, data: result?.data ?? null }), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          })
        } catch (err: any) {
          console.error('PIX status error:', err)
          return new Response(JSON.stringify({ error: err?.message ?? 'unknown' }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
