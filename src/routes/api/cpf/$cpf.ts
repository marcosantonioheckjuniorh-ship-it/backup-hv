import { createFileRoute } from '@tanstack/react-router'

/**
 * GET /api/cpf/:cpf
 * Proxy para API de consulta de CPF. A URL/token são configurados em
 * CPF_API_URL e CPF_API_TOKEN. Devolve JSON no formato { NOME, MAE, SEXO, CPF_FORMATADO }
 * que o funil (página 4) já consome.
 */
export const Route = createFileRoute('/api/cpf/$cpf')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const cpf = (params.cpf || '').replace(/\D/g, '')
        if (cpf.length !== 11) {
          return new Response(JSON.stringify({ error: 'CPF inválido' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
          })
        }

        const apiUrl = process.env.CPF_API_URL
        const apiToken = process.env.CPF_API_TOKEN

        if (!apiUrl) {
          return new Response(JSON.stringify({ error: 'CPF API not configured' }), {
            status: 503, headers: { 'Content-Type': 'application/json' },
          })
        }

        try {
          // Suporte a diferentes formatos de URL: com {cpf} placeholder, ou concatenado
          const url = apiUrl.includes('{cpf}')
            ? apiUrl.replace('{cpf}', cpf)
            : apiUrl.replace(/\/$/, '') + '/' + cpf

          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`

          const upstream = await fetch(url, { headers })
          const text = await upstream.text()
          let data: any
          try { data = JSON.parse(text) } catch { data = { raw: text } }

          if (!upstream.ok) {
            console.error(`CPF API failed [${upstream.status}]: ${text.substring(0, 300)}`)
            return new Response(JSON.stringify({ error: 'provider error', status: upstream.status }), {
              status: 502, headers: { 'Content-Type': 'application/json' },
            })
          }

          // Normalizar resposta para o formato esperado pelo funil.
          // Tenta várias variantes comuns (Assertiva, CPFCNPJ.io, InvertexTO, etc.)
          const nome = data.NOME ?? data.nome ?? data.name ?? data.data?.nome ?? data.result?.nome ?? data.dados?.nome ?? ''
          const mae = data.NOME_MAE ?? data.MAE ?? data.mae ?? data.nome_mae ?? data.mother ?? data.data?.mae ?? data.result?.mae ?? ''
          const sexo = (data.SEXO ?? data.sexo ?? data.gender ?? data.data?.sexo ?? '').toString().toUpperCase()
          const nascimento = data.NASC ?? data.NASCIMENTO ?? data.nascimento ?? data.birth_date ?? data.data?.nascimento ?? null

          return new Response(JSON.stringify({
            NOME: (nome || '').toString().toUpperCase(),
            MAE: (mae || '').toString().toUpperCase(),
            SEXO: sexo === 'M' ? 'MASCULINO' : sexo === 'F' ? 'FEMININO' : sexo,
            NASCIMENTO: nascimento,
            CPF_FORMATADO: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
          }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        } catch (err: any) {
          console.error('CPF proxy error:', err)
          return new Response(JSON.stringify({ error: err?.message ?? 'unknown' }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
