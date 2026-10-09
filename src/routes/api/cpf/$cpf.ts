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
            redirect: 'manual',
          })

          if (upstream.status >= 300 && upstream.status < 400) {
            console.error('[cpf] provider_http redirect', upstream.status)
            return json({ error: 'Não foi possível consultar o provedor.', code: 'provider_http' }, 502)
          }
          if (!upstream.ok) {
            // Do not log provider response bodies: they may contain personal data.
            const st = upstream.status
            console.error('[cpf] provider_status', st)
            if (st === 404) return json({ error: 'CPF não encontrado na base do provedor.', code: 'not_found' }, 404)
            if (st === 401 || st === 403) return json({ error: 'Consulta indisponível no momento.', code: 'provider_auth' }, 503)
            if (st === 429) return json({ error: 'Muitas consultas. Aguarde e tente novamente.', code: 'rate_limited' }, 429)
            return json({ error: 'Não foi possível consultar o provedor.', code: 'provider_http' }, 502)
          }

          const data: any = await upstream.json().catch(() => null)
          if (!data || typeof data !== 'object') {
            console.error('[cpf] provider_invalid_response')
            return json({ error: 'Não foi possível consultar o provedor.', code: 'provider_invalid_response' }, 502)
          }

          // Inspect common nested response envelopes without logging or returning raw personal data.
          const candidates: Record<string, unknown>[] = []
          const seen = new Set<object>()
          const queue: Array<{ value: unknown; depth: number }> = [{ value: data, depth: 0 }]
          while (queue.length) {
            const current = queue.shift()!
            if (!current.value || typeof current.value !== 'object' || Array.isArray(current.value) ||
                seen.has(current.value as object) || current.depth > 4) continue
            seen.add(current.value as object)
            const record = current.value as Record<string, unknown>
            candidates.push(record)
            for (const value of Object.values(record)) {
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                queue.push({ value, depth: current.depth + 1 })
              }
            }
          }

          const normalizeKey = (key: string) =>
            key.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

          const pick = (...keys: string[]) => {
            const wanted = new Set(keys.map(normalizeKey))
            for (const candidate of candidates) {
              for (const [key, value] of Object.entries(candidate)) {
                if (wanted.has(normalizeKey(key)) && typeof value === 'string' && value.trim()) {
                  return value.trim()
                }
              }
            }
            return ''
          }

          const isCpfValue = (value: string) => value.replace(/\\D/g, '') === cpf
          const nome = pick('NOME', 'nome', 'name', 'full_name')
          // Never display the submitted CPF as a person's name or another attribute.
          if (!nome || isCpfValue(nome)) {
            console.error('[cpf] provider_invalid_response invalid_name_field')
            return json({ error: 'O provedor não retornou um nome válido.', code: 'provider_invalid_response' }, 502)
          }

          // Normalize common provider field names for the mother's name.
          // Only return a value explicitly supplied by the authorized provider.
          const maeCandidate = pick(
            'NOME_MAE',
            'NOME_DA_MAE',
            'NOME COMPLETO DA MAE',
            'MAE',
            'mae',
            'nome_mae',
            'nomeMae',
            'nomeDaMae',
            'mother',
            'mother_name',
            'motherName',
            'mothers_name',
            'nome da mae',
            'nome da mãe',
            'mother name',
          )
          const mae = maeCandidate && !isCpfValue(maeCandidate) ? maeCandidate : ''

          const sexoCandidate = pick('SEXO', 'sexo', 'gender').trim().toUpperCase()
          const sexo = ['M', 'MALE', 'MASCULINO'].includes(sexoCandidate)
            ? 'MASCULINO'
            : ['F', 'FEMALE', 'FEMININO'].includes(sexoCandidate)
              ? 'FEMININO'
              : ''

          const nascimentoCandidate = pick(
            'NASCIMENTO',
            'DATA_NASCIMENTO',
            'DATA DE NASCIMENTO',
            'birth_date',
            'birthDate',
            'date_of_birth',
            'dataNascimento',
          )
          const nascimento = nascimentoCandidate && !isCpfValue(nascimentoCandidate) &&
            /^(\\d{4}-\\d{2}-\\d{2}|\\d{2}\\/\\d{2}\\/\\d{4})(?:T.*)?$/.test(nascimentoCandidate)
            ? nascimentoCandidate
            : ''

          return json({
            NOME: nome.toUpperCase(),
            MAE: mae.toUpperCase(),
            SEXO: sexo,
            NASCIMENTO: nascimento || null,
            CPF_FORMATADO: cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4'),
          })
        } catch (error: any) {
          const timedOut = error?.name === 'AbortError'
          const code = timedOut ? 'provider_timeout' : 'provider_network'
          console.error('[cpf]', code, String(error?.name || 'Error'))
          return json({
            error: timedOut
              ? 'O provedor demorou para responder. Tente novamente.'
              : 'Consulta indisponível no momento. Tente novamente.',
            code,
          }, timedOut ? 504 : 502)
        } finally {
          clearTimeout(timeout)
        }
      },
    },
  },
})
