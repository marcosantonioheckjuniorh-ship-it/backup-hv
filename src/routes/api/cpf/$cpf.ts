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
            key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

          const valuesFor = (...keys: string[]) => {
            const wanted = new Set(keys.map(normalizeKey))
            const values: string[] = []
            for (const candidate of candidates) {
              for (const [key, value] of Object.entries(candidate)) {
                if (!wanted.has(normalizeKey(key))) continue
                if (typeof value === 'string' && value.trim()) values.push(value.trim())
                else if (typeof value === 'number' && Number.isFinite(value)) values.push(String(value))
              }
            }
            return [...new Set(values)]
          }

          const isCpfValue = (value: string) => value.replace(/\D/g, '') === cpf
          const isPlausibleName = (value: string) =>
            value.length >= 3 && !isCpfValue(value) && /[A-Za-zÀ-ÿ]/.test(value) &&
            !/^(null|undefined|n\/a|não informado|nao informado)$/i.test(value.trim())

          const nome = valuesFor('NOME_COMPLETO', 'NOME', 'FULL_NAME', 'FULLNAME', 'NOME_PESSOA', 'NAME')
            .find(isPlausibleName)
          if (!nome) {
            console.error('[cpf] provider_invalid_response invalid_name_field')
            return json({ error: 'O provedor não retornou um nome válido. Verifique a URL e o formato da resposta da API.', code: 'provider_invalid_response' }, 502)
          }

          const mae = valuesFor(
            'NOME_MAE', 'NOME_DA_MAE', 'NOME_COMPLETO_MAE', 'NOME_COMPLETO_DA_MAE',
            'NOME_MATERNO', 'MAE_NOME', 'MAE', 'NOME_MAE_COMPLETO', 'NOME_DA_GENITORA',
            'NOME_GENITORA', 'FILIACAO_MAE', 'NOME_MAE_PESSOA', 'MOTHER_NAME', 'MOTHERNAME', 'MOTHERS_NAME', 'MOTHER'
          ).find(isPlausibleName) || ''

          const sexo = valuesFor('SEXO', 'GENDER', 'GENERO', 'SEX')
            .map(value => value.trim().toUpperCase())
            .map(value => {
              if (['M', 'MALE', 'MASCULINO', 'HOMEM'].includes(value)) return 'MASCULINO'
              if (['F', 'FEMALE', 'FEMININO', 'MULHER'].includes(value)) return 'FEMININO'
              return ''
            })
            .find(Boolean) || ''

          const parseBirthDate = (value: string): string => {
            const v = value.trim()
            let match = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/)
            if (match) {
              const [, year, month, day] = match
              const d = new Date(Number(year), Number(month) - 1, Number(day))
              if (d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1 && d.getDate() === Number(day)) {
                return year + '-' + month + '-' + day
              }
              return ''
            }
            match = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
            if (match) {
              const [, day, month, year] = match
              const d = new Date(Number(year), Number(month) - 1, Number(day))
              if (d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1 && d.getDate() === Number(day)) {
                return year + '-' + month + '-' + day
              }
            }
            match = v.match(/^(\d{2})-(\d{2})-(\d{4})$/)
            if (match) {
              const [, day, month, year] = match
              const d = new Date(Number(year), Number(month) - 1, Number(day))
              if (d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1 && d.getDate() === Number(day)) {
                return year + '-' + month + '-' + day
              }
            }
            return ''
          }

          const nascimento = valuesFor(
            'DATA_NASCIMENTO', 'DATA_DE_NASCIMENTO', 'NASCIMENTO', 'NASC', 'DATA_NASC',
            'DT_NASCIMENTO', 'DTNASCIMENTO', 'DATANASCIMENTO', 'NASCIMENTO_DATA',
            'BIRTH_DATE', 'BIRTHDATE', 'DATE_OF_BIRTH', 'DOB'
          ).map(parseBirthDate).find(Boolean) || ''

          return json({
            NOME: nome.toUpperCase(),
            MAE: mae.toUpperCase(),
            SEXO: sexo,
            NASCIMENTO: nascimento || null,
            CPF_FORMATADO: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
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
