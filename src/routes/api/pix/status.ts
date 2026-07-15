import { createFileRoute } from '@tanstack/react-router'

/**
 * GET /api/pix/status?transactionId=xxx
 * Consulta status na Duttyfy e atualiza pix_transactions se COMPLETED.
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

          const gatewayUrl = process.env.DUTTYFY_PIX_URL_ENCRYPTED
          if (!gatewayUrl) {
            return new Response(JSON.stringify({ error: 'PIX gateway not configured' }), {
              status: 500, headers: { 'Content-Type': 'application/json' },
            })
          }

          // Duttyfy usa mesma URL com ?transactionId= para GET
          const sep = gatewayUrl.includes('?') ? '&' : '?'
          const upstream = await fetch(`${gatewayUrl}${sep}transactionId=${encodeURIComponent(transactionId)}`, {
            method: 'GET',
          })

          const text = await upstream.text()
          let result: any
          try { result = JSON.parse(text) } catch { result = { raw: text } }

          if (!upstream.ok) {
            return new Response(JSON.stringify({ error: 'provider error', status: upstream.status, body: result }), {
              status: 502, headers: { 'Content-Type': 'application/json' },
            })
          }

          if (result.status === 'COMPLETED') {
            const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
            await supabaseAdmin
              .from('pix_transactions')
              .update({ status: 'COMPLETED', paid_at: new Date().toISOString() })
              .eq('transaction_id', transactionId)
          }

          return new Response(JSON.stringify(result), {
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
