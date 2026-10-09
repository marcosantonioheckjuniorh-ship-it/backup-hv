## Atualizar secrets no projeto remixado

Atualmente o projeto só tem `LOVABLE_API_KEY`. Os demais precisam ser criados com os valores já conhecidos do chat.

### Valores a gravar (`set_secret` — sem interação)

| Secret | Valor |
|---|---|
| `CPF_API_URL` | `https://api.zipcardx.online/api/v1/consult/{cpf}` |
| `CPF_API_TOKEN` | `a13676abe925caa4ac181611b357b8224d5a6a1c4853b22fbfabef04e77b0174` |
| `UTMIFY_API_TOKEN` | `4TfTSugiB4sWA0W5KqNOKvfRsxg0Z8B3pWvR` |
| `VELANI_BASE_URL` | `https://api.velanipagamentos.com.br/api/v1/api-gateway/v1` |
| `VELANI_PUBLIC_KEY` | `pk_live_2a52a2cc55989d0385f485356f391ceefea95861c900893a` |
| `FB_PIXEL_ID` | `1062555759088296` |
| `FB_CAPI_TOKEN` | `EAAJrLkr7RH0BRW5TcJ2MU7ARCcGuQZA5sci78ZCOKzPJEoQvlZAG9UsEuGZBZAcMq0o59izq12NZBhmXDQ8EtbI1tuL0jHC47RJiCvusXBlaZAV8JE2M52zyG2KBzEhIjp7ZCt7EGziNWZAZC3ofPUSXKhNbrwDOslEHSxis2D9uAiBJw7l02J5jinGZAULLLH5ivpDtgZDZD` |

### Secret que depende de você

`STRIPE_LIVE_API_KEY` — usado como fallback da `VELANI_SECRET_KEY` (header `x-api-key`) no código de PIX. O valor real não está visível pra mim. Você o fornece pelo formulário seguro (`add_secret`) quando eu abrir, ou me cola no chat se preferir.

### Após salvar

1. Reiniciar o dev server.
2. Smoke test: `/api/cpf/57948135715`, `POST /api/pix/create` com UTM, e confirmar o envio à UTMify.
