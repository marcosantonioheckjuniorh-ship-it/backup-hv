## Escopo

Aplicar a mesma correção do vídeo nativo em **duas páginas**:

1. `public/funil/12/intermediaria.html` — funil 12 (layout do player quebrado)
2. `public/funil/pos/back/frontvsl/index.html` — back redirect (mesma VSL, precisa da mesma UX de "iniciar com som")

Ambas usam `<video>` nativo + HLS.js (converteai). Mantenho o player nativo (sem vturb), corrijo o layout e padronizo o comportamento de autoplay-com-som + overlay "toque para ativar o som".

---

## 1) `public/funil/12/intermediaria.html`

**Problema:** o CSS de `.video-container` foi feito pro `vturb-smartplayer` — tem `aspect-ratio: 16/9`, `max-height`, `height: 56.25vw`, `display:flex`, e regras alvo `vturb-smartplayer` que não existem mais. Com o `<video>` nativo dentro, sobra caixa preta/branca e a barra azul de progresso fica deslocada.

**Correção:**
- Simplificar o CSS do `.video-container`: só `position:relative; width:100%; background:#000; overflow:hidden; border-radius:8px 8px 0 0`. Remover todas as regras `@media` específicas do player antigo e as regras `vturb-smartplayer`.
- Wrapper interno com `position:relative` que envolve `<video>` + `#unmuteOverlay`, para o overlay (`inset:0`) cobrir exatamente a área do vídeo.
- `<video>` com `width:100%; aspect-ratio:16/9; object-fit:cover; display:block; background:#000` (sem `border-radius` conflitante).
- Barra `#videoProgress` logo abaixo do wrapper, 100% de largura.
- Tirar o `<div id="videoArrow">` órfão da área do vídeo (fica solto no layout); manter só como indicador ao final, fora do wrapper do player.
- **Manter a lógica atual**: tentar autoplay unmuted → se falhar, cair pra muted e mostrar overlay "Toque para ativar o som" que ativa no primeiro pointerdown/touch/scroll/click.

## 2) `public/funil/pos/back/frontvsl/index.html`

**Problema:** hoje o vídeo já é nativo, mas: (a) começa mudo sem prompt visível ("uso não sabe que precisa clicar"), (b) não tenta autoplay com som primeiro, (c) o `<div id="vslArrow">` fica dentro do wrapper preto (mesmo problema visual).

**Correção:**
- Envolver `<video id="nativeVsl">` num wrapper `position:relative`.
- Adicionar `#vslUnmuteOverlay` idêntico ao do funil 12, mas com a cor Havan (`#003399`) no círculo pulsante e no ícone de som, texto "Toque para ativar o som".
- Adicionar `@keyframes pulseSound` (mesmo do funil 12).
- Trocar o script pra: tentar `v.muted=false; v.play()` primeiro; se `.catch`, cair pra muted + `tryPlay()` mantendo overlay visível. `unmute()` esconde overlay e liga áudio no primeiro `pointerdown/touchstart/keydown/click/scroll/mousemove/touchmove`. Overlay também é clicável.
- Mover o `#vslArrow` (seta bounce) pra **fora** do wrapper do vídeo, logo abaixo da barra de progresso, pra não aparecer sobreposto ao player.
- Não mexer no restante da página (checkout, timer, pixels).

---

## Nota importante pro usuário

Autoplay **com som** é bloqueado pelo Chrome/Safari/iOS quando o usuário ainda não interagiu na página específica — é regra do navegador, não tem workaround 100% confiável. O que o código faz:

- Tenta iniciar já com som (funciona em PWA, Android com MEI/permissão, alguns casos com histórico de engajamento);
- Se o navegador bloquear, cai pra mudo automaticamente e mostra o overlay azul pulsante pedindo um toque — no primeiro pointerdown/scroll/touch em qualquer lugar da página, o som liga sozinho.

Esse é o comportamento padrão dos VSLs modernos e é o máximo que dá pra fazer sem depender de player proprietário (vturb, converteai player, etc.).
