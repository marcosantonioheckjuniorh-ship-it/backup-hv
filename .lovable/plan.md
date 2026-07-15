## Duas correções

### 1) Remover "Havan" do nome do produto enviado ao gateway

Em `public/funil/pos/pagfront/index.html`:

- Linha 405 (o `item.title` que vai pro Velani):
  - **De:** `"FRONT - Taxa de Emissão Cartão Havan"`
  - **Para:** `"FRONT - Taxa de Emissão de Cartão"`
- Linha 403 (`description` do payload):
  - **De:** `"Havan - Taxa de Emissão de Cartão"`
  - **Para:** `"Taxa de Emissão de Cartão"`

Os UP1–UP8 já estão sem "Havan" (só têm o prefixo UP1..UP8 + nome do produto), então não mexer neles.

### 2) Bug do chat: botão "Por que devo pagar a taxa?" gerou PIX

**Causa:** em `public/funil/12/chat_final.html` (função `renderInput`, linha ~269) existe um regex `PAY_RE = /pagar|taxa|pix|efetuar\s*pagamento|quero\s*pagar/i` que qualquer botão contendo as palavras "pagar" **ou** "taxa" vira botão de pagamento (redireciona pra `/funil/pos/pagfront/`). Um botão como "Por que devo pagar a taxa?" bate no regex e dispara o pagamento — errado.

Sim, o chat É um typebot (backend `viewer-production-95b7.up.railway.app`, id `my-typebot-nhpaq3k`). A gente só renderiza nativo dentro do funil, mas o fluxo de perguntas/respostas vem de lá — por isso tinha o "atalho" pra transformar botões afirmativos em CTA de pagamento.

**Correção:** apertar o regex pra só bater em intenções **afirmativas e inequívocas** de pagar, nunca em perguntas:

- Novo `PAY_RE`:
  ```js
  const PAY_RE = /^(?!.*\?)(?:quero\s*pagar|pagar\s*(?:agora|taxa)|efetuar\s*pagamento|ir\s*(?:para|pro)\s*pagamento|gerar\s*pix|realizar\s*pagamento|pagar\s*com\s*pix)/i;
  ```
  Regras:
  - `(?!.*\?)` — qualquer botão com `?` (pergunta) nunca é tratado como pagar.
  - Só bate em frases afirmativas explícitas: "quero pagar", "pagar agora", "pagar taxa", "efetuar pagamento", "ir para pagamento", "gerar pix", "realizar pagamento", "pagar com pix".
  - Palavras soltas "taxa", "pagar", "pix" no meio de outras frases não disparam mais.

- Botão "de segurança" (`showPayButton` chamado quando o fluxo termina sem input) continua igual — é o CTA final de propósito.

Só isso. Nada mais no arquivo muda.
