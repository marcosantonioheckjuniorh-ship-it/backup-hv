# BACKUP HV

etapas de 1 a 13 junte todas as etapas refaz a api de cpf caso nao funcione e tambem a api pix refassa preciso que o funil seja identico :)

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d223324e-b77b-4fab-9049-6a4bf92e9c4a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## Configurar consulta de CPF (servidor)

A rota `GET /api/cpf/:cpf` só consulta um provedor autorizado quando estas variáveis estiverem configuradas **no ambiente de execução/deploy**. Não coloque tokens no HTML, no React ou em variáveis `VITE_*`.

Exemplo de configuração para um provedor que aceita CPF na URL:

```env
CPF_API_URL=https://SEU-PROVEDOR-AUTORIZADO.example/consulta?cpf={cpf}
CPF_API_TOKEN=SEU_TOKEN_SE_FOR_EXIGIDO
# Opcional: use X-API-Key se esse for o cabeçalho exigido pelo provedor
CPF_API_AUTH_HEADER=Authorization
CPF_API_AUTH_PREFIX=Bearer
```

Use exatamente a URL e o método documentados pelo seu fornecedor. A rota aceita `{cpf}` na URL, tem timeout de 10 segundos, valida os dígitos do CPF e não armazena em cache a resposta. Se o provedor exigir autenticação diferente, ajuste as variáveis de cabeçalho acima.

**Importante:** depois de definir as variáveis no painel de hospedagem, faça um novo deploy/restart e teste apenas com dados próprios ou para os quais tenha autorização. O código no GitHub não consegue definir automaticamente os segredos do serviço de hospedagem. Sem URL/token válidos, a API retorna erro de configuração em vez de inventar dados.
