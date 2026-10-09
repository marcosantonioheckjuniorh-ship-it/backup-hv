import { createFileRoute } from '@tanstack/react-router'

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })

function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const digit = (base: string, factor: number) => {
    let sum = 0
    for (const char of base) sum += Number(char) * factor--
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return digit(cpf.slice(0, 9), 10) === Number(cpf[9]) &&
    digit(cpf.slice(0, 10), 11) === Number(cpf[10])
}

/**
 * GET /api/cpf/:cpf
 *
 * Configure CPF_API_URL only for a provider you are authorized to use.
 * Supported URL formats:
 *   https://provider.example/lookup/{cpf}
 *   https://provider.example/lookup?cpf={cpf}
 *
 * Optional server-only authentication:
 *   CPF_API_TOKEN=...
 *   CPF_API_AUTH_HEADER=Authorization (default) or X-API-Key
 *   CPF_API_AUTH_PREFIX=Bearer (default for Authorization; empty for API keys)
 *
 * Never place provider tokens in frontend code or return raw provider payloads.
 */
export const Route = createFileRoute('/api/cpf/$cpf')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const cpf = (params.cpf || '').replace(/\D/g, '')
        if (!isValidCPF(cpf)) return json({ error: 'CPF inválido' }, 400)

        const configuredUrl = process.env.CPF_API_URL?.trim()
        if (!configuredUrl) {
          console.error('[cpf] missing_env CPF_API_URL')
          return json({ error: 'Consulta indisponível no momento.', code: 'missing_CPF_API_URL' }, 503)
        }

        let url: URL
        try {
          if (configuredUrl.includes('{cpf}')) {
            url = new URL(configuredUrl.replaceAll('{cpf}', cpf))
          } else {
            url = new URL(configuredUrl)
            // URLs com query string recebem o CPF no parâmetro cpf; URLs sem query
            // recebem o CPF como último segmento do caminho.
            if (url.search) url.searchParams.set('cpf', cpf)
            else url.pathname = url.pathname.replace(/\/$/, '') + '/' + cpf
          }
        } catch {
          return json({ error: 'Configuração da API inválida.' }, 503)
        }

        const token = process.env.CPF_API_TOKEN
        const authHeader = process.env.CPF_API_AUTH_HEADER || 'Authorization'
        const authPrefix = process.env.CPF_API_AUTH_PREFIX ??
          (authHeader.toLowerCase() === 'authorization' ? 'Bearer' : '')
        const headers: Record<string, string> = { Accept: 'application/json' }
        if (token) headers[authHeader] = authPrefix ? authPrefix + ' ' + token : token

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        try {
          const upstream = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal,
            redirect: 'error',
            cache: 'no-store',
          })

          if (!upstream.ok) {
            // Do not log provider response bodies: they may contain personal data.
            const st = upstream.status
            console.error('[cpf] provider_status', st)
            if (st === 404) return json({ error: 'CPF não encontrado na base do provedor.', code: 'not_found' }, 404)
            if (st === 401 || st === 403) return json({ error: 'Consulta indisponível no momento.', code: 'provider_auth' }, 503)
            if (st === 429) return json({ error: 'Muitas consultas. Aguarde e tente novamente.', code: 'rate_limited' }, 429)
            return json({ error: 'Não foi possível consultar o provedor.', code: 'provider_error' }, 502)
          }

          const data: any = await upstream.json().catch(() => null)
          if (!data || typeof data !== 'object') {
            return json({ error: 'Resposta inválida do provedor.' }, 502)
          }

          const candidates = [
            data,
            data.data,
            data.result,
            data.dados,
            data.response,
          ].filter((item) => item && typeof item === 'object' && !Array.isArray(item))

          const pick = (...keys: string[]) => {
            for (const candidate of candidates) {
              for (const key of keys) {
                const value = candidate[key]
                if (typeof value === 'string' && value.trim()) return value.trim()
              }
            }
            return ''
          }

          const nome = pick('NOME', 'nome', 'name', 'full_name')
          if (!nome) return json({ error: 'O provedor não retornou os dados esperados.' }, 502)

          const mae = pick('NOME_MAE', 'MAE', 'mae', 'nome_mae', 'mother')
          const rawSexo = pick('SEXO', 'sexo', 'gender').toUpperCase()
          const sexo = rawSexo === 'M' || rawSexo === 'MALE'
            ? 'MASCULINO'
            : rawSexo === 'F' || rawSexo === 'FEMALE'
              ? 'FEMININO'
              : rawSexo
          const nascimento = pick('NASCIMENTO', 'NASC', 'nascimento', 'birth_date')

          return json({
            NOME: nome.toUpperCase(),
            MAE: mae.toUpperCase(),
            SEXO: sexo,
            NASCIMENTO: nascimento || null,
            CPF_FORMATADO: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
          })
        } catch (error: any) {
          const timedOut = error?.name === 'AbortError'
          console.error(timedOut ? 'CPF provider timed out' : 'CPF provider request failed')
          return json({
            error: timedOut
              ? 'O provedor demorou para responder. Tente novamente.'
              : 'Não foi possível conectar ao provedor.',
          }, timedOut ? 504 : 502)
        } finally {
          clearTimeout(timeout)
        }
      },
    },
  },
})
