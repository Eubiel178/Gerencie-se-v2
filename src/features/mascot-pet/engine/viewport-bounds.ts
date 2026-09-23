import { MascotBounds } from "./movement";

// Largura da sidebar fixa em desktop (ver `.sidebar` em
// src/app/home/home-layout.module.css) - o mascote nunca deve andar por
// cima da navegação. Em telas <= 720px a sidebar já some (mesmo
// breakpoint usado lá).
const SIDEBAR_WIDTH = 248;
const SIDEBAR_BREAKPOINT = 720;

const DESKTOP_MARGIN = 16;
// Mobile: margem maior embaixo pra não cobrir gestos de borda.
const MOBILE_MARGIN_X = 12;
const MOBILE_MARGIN_BOTTOM = 72;

// Larguras de CONTEÚDO (viewport menos sidebar, quando ela está visível)
// iguais ou menores que este valor contam como "estreitas" pro que vem
// abaixo — não é o mesmo conceito de `SIDEBAR_BREAKPOINT`: um tablet em
// retrato (~834px) mantém a sidebar visível, mas o que sobra de largura
// de conteúdo (834 - 248 ≈ 586px) já é estreito o bastante pra ter o
// mesmo problema de telas sem sidebar (confirmado visualmente). Usar
// 720 aqui (mesmo valor de `SIDEBAR_BREAKPOINT`, mas como constante à
// parte de propósito) garante que todo o intervalo "mobile" já cai
// automaticamente neste caso — nunca existe uma faixa intermediária sem
// tratamento.
const NARROW_CONTENT_WIDTH = 720;

// Em telas/conteúdo estreitos o layout é uma única coluna, com cards que
// se esticam quase de ponta a ponta — um mascote `position: fixed` que
// rondasse a altura (ou largura) inteira do espaço disponível, como
// fazia antes, quase sempre acabava pousando em cima de algum card ao
// rolar a página (confirmado visualmente em Dashboard, Tarefas,
// Estatísticas, Corrida e — mesmo com a sidebar visível — Calendário em
// tablet). Uma faixa só na vertical, mas larga o bastante na horizontal,
// ainda esbarrava em conteúdo com frequência.
//
// O canto inferior esquerdo do espaço de conteúdo, por outro lado, é a
// única região que sobra genuinamente vazia em TODAS as telas: `.main`
// sempre tem padding lateral (nenhum card toca a borda) e os cards têm
// cantos arredondados, então uma caixa pequena colada nesse canto nunca
// entra na área retangular de um card. É o mesmo raciocínio por trás do
// widget do assistente já viver no canto inferior DIREITO — aqui usamos
// o canto oposto pra não competir com ele. Restringir o passeio a essa
// caixa é o único jeito de cumprir de verdade a regra "nunca cobrir
// conteúdo" sem precisar saber a posição de scroll nem a geometria de
// cada card. Combinado com `pointer-events: none` no wrapper nessa
// mesma faixa (ver `mascot-pet.module.css`), que garante que mesmo a
// própria caixinha do mascote nunca bloqueia um toque em algo por
// baixo.
const NARROW_CORNER_SIZE = 100;

export function isMobileViewport(): boolean {
  return window.innerWidth <= SIDEBAR_BREAKPOINT;
}

/** true quando a coluna de conteúdo disponível (largura da tela, menos a
 * sidebar se ela estiver visível) é estreita o bastante pra precisar do
 * canto confinado — ver `NARROW_CONTENT_WIDTH`. Também usado pelo CSS
 * do wrapper via o mesmo breakpoint (`mascot-pet.module.css`), pra
 * desligar `pointer-events` exatamente no mesmo caso. */
export function isNarrowContentViewport(): boolean {
  const contentWidth = isMobileViewport() ? window.innerWidth : window.innerWidth - SIDEBAR_WIDTH;
  return contentWidth <= NARROW_CONTENT_WIDTH;
}

// Garante uma área de passeio mínima mesmo numa janela bem estreita -
// sem isso, uma janela pequena o bastante faria `minX === maxX` (a
// margem/sidebar "comendo" todo o espaço) e o bichinho pareceria
// travado, nunca andando de verdade.
const MIN_RANGE_PX = 80;

function widen(min: number, max: number, minRange: number): [number, number] {
  if (max - min >= minRange) return [min, max];
  return [Math.min(min, max - minRange), max];
}

/** Área segura de rolagem livre, recalculada a cada resize (barato - só
 * aritmética, sem tocar no DOM além de ler `window.inner*`). */
export function computeViewportBounds(spriteWidth: number, spriteHeight: number): MascotBounds {
  const mobile = isMobileViewport();
  // `marginX` (a sidebar inteira + respiro, no desktop) só faz sentido do
  // lado ESQUERDO - é o que evita o mascote andar por cima da navegação.
  // Reutilizar o mesmo valor pra calcular o limite DIREITO (como o código
  // fazia antes) reservava um vão vazio do tamanho da sidebar também do
  // lado direito, onde não existe sidebar nenhuma - encolhendo a área de
  // passeio/arrasto bem mais do que o necessário (achado relatado:
  // "tentei arrastar ele pro canto e ele fica num limite"). Do lado
  // direito só precisa do respiro normal (`DESKTOP_MARGIN`/
  // `MOBILE_MARGIN_X`, sem a sidebar).
  const leftMarginX = mobile ? MOBILE_MARGIN_X : SIDEBAR_WIDTH + DESKTOP_MARGIN;
  const rightMarginX = mobile ? MOBILE_MARGIN_X : DESKTOP_MARGIN;
  const marginBottom = mobile ? MOBILE_MARGIN_BOTTOM : DESKTOP_MARGIN;

  if (isNarrowContentViewport()) {
    // `maxX`/`maxY` primeiro limitados pelo tamanho real da tela (nunca
    // deixar o sprite passar da borda), depois estreitados pro tamanho
    // do canto — nessa ordem, porque numa tela minúscula o limite real
    // da tela é o que manda, não o tamanho do canto.
    const screenMaxX = Math.max(window.innerWidth - spriteWidth - rightMarginX, leftMarginX);
    const maxX = Math.min(screenMaxX, leftMarginX + NARROW_CORNER_SIZE);
    const [minX] = widen(leftMarginX, maxX, MIN_RANGE_PX);

    const screenMaxY = Math.max(window.innerHeight - spriteHeight - marginBottom, 0);
    const [minY] = widen(Math.max(screenMaxY - NARROW_CORNER_SIZE, 0), screenMaxY, MIN_RANGE_PX);

    // `widen` só move `min` pra baixo quando o intervalo é curto demais
    // (nunca mexe em `max`) — daí não precisar de um segundo valor de
    // retorno pra `maxX`/`maxY` em nenhuma das duas chamadas acima.
    return { minX, maxX, minY, maxY: screenMaxY };
  }

  const [minX, maxX] = widen(
    leftMarginX,
    Math.max(window.innerWidth - spriteWidth - rightMarginX, leftMarginX),
    MIN_RANGE_PX
  );
  const [minY, maxY] = widen(
    marginBottom,
    Math.max(window.innerHeight - spriteHeight - marginBottom, marginBottom),
    MIN_RANGE_PX
  );
  return { minX, maxX, minY, maxY };
}
