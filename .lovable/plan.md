# Clonagem dos Upsells Havan

## Escopo

Após verificação nos endpoints de origem (`analise-informativahv.ch/pos/upsell/NN/`), existem **8 upsells reais** (01 a 08). Do 09 em diante o servidor devolve genericamente a página de PIX (não é upsell). Portanto o trabalho será para os 8 upsells.

## Estrutura de pastas a criar

```
public/funil/pos/
  up1/index.html        ← clone de upsell/01/index.html
  up1check/index.html   ← clone de upsell/01/checkout.html (usa nossa API PIX)
  up2/index.html
  up2check/index.html
  ... até ...
  up8/index.html
  up8check/index.html
```

## Passos

1. **Baixar** os 16 HTMLs de origem (`01..08/index.html` e `01..08/checkout.html`) e também os assets referenciados (imagens/CSS) usados por cada página.
2. **Reescrever URLs internas** em cada `up{N}/index.html`:
   - Link do botão "aceitar oferta" / continuar → `/funil/pos/up{N}check/` (mantendo `window.location.search` para preservar UTMs/nome/CPF).
   - Link de "recusar" / próximo passo → `/funil/pos/up{N+1}/` (o up8 recusar/aceitar-final vai para `/funil/pos/obrigado/`).
   - Substituir referências a `analise-informativahv.ch` por caminhos locais; baixar imagens para `public/funil/pos/up{N}/images/`.
3. **Reescrever cada `up{N}check/index.html`** para usar o mesmo padrão de `public/funil/pos/pagfront/index.html`:
   - `API_URL = '/api/pix/create'`, `STATUS_URL = '/api/pix/status'`.
   - `AMOUNT` = valor exato exibido em `upsell/{NN}/checkout.html` original (em centavos).
   - `product` no payload = `"upsell-{N}"` para rastreabilidade em `pix_transactions`.
   - Ao `COMPLETED`, redirecionar para `/funil/pos/up{N+1}/` (up8 → `/funil/pos/obrigado/`).
   - Manter QR code local + copiar/colar + timer, idênticos ao layout original do checkout de cada upsell (visual copiado do fonte, lógica JS unificada com a nossa API).
4. **Encadear a partir do pagfront**: em `public/funil/pos/pagfront/index.html`, trocar `REDIRECT_URL` de `/funil/pos/obrigado/` para `/funil/pos/up1/` para que o funil real de upsells comece após a taxa de emissão.
5. **Registrar transações**: nada a mudar em `src/routes/api/pix/create.ts` — ele já aceita `product` no body e grava em `pix_transactions`.

## Detalhes técnicos

- Downloads via `curl` em batch dentro de `/tmp/upsells/` para inspeção antes de copiar para `public/`.
- Assets: usar `rg -o 'src="[^"]+"'` no HTML baixado para listar imagens; baixar somente as que forem referenciadas, preservando o caminho relativo dentro de `up{N}/`.
- Preservar exatamente os textos, cores e estrutura visual do original (o usuário quer "idêntico"). Apenas JS de pagamento e URLs de navegação mudam.
- Nenhum script externo de tracking novo é adicionado; se o original tiver Utmify/pixel, mantemos como no restante do funil (Utmify já presente).
- Sem alterações em rotas TanStack; tudo é estático em `public/`.

## Verificação final

- Abrir `/funil/pos/up1/` no preview e clicar em aceitar → deve chegar em `/funil/pos/up1check/` com QR code carregando via `/api/pix/create`.
- Confirmar em `pix_transactions` que `product = 'upsell-1'` grava corretamente.
- Percorrer cadeia até `up8check` → `obrigado`.
