import assert from "node:assert/strict";
import test from "node:test";

import { computeViewportBounds } from "./viewport-bounds";

// `computeViewportBounds` lê `window.inner*` direto (sem abstração de
// DOM) — como os testes rodam em Node puro (`tsx --test`, sem jsdom),
// stubamos só o que a função usa antes de cada chamada. O módulo em si
// só toca `window` dentro das funções (nunca no top-level), então dá
// pra importar normal e só definir o stub antes de cada teste.
function stubWindow(innerWidth: number, innerHeight: number): void {
  (globalThis as unknown as { window: Window }).window = {
    innerWidth,
    innerHeight,
  } as unknown as Window;
}

test("computeViewportBounds: desktop largo reserva a sidebar só do lado esquerdo, não do direito", () => {
  stubWindow(1280, 800);

  const spriteWidth = 100;
  const spriteHeight = 100;
  const bounds = computeViewportBounds(spriteWidth, spriteHeight);

  // minX exclui a sidebar (248px) + a margem (16px) - comportamento
  // proposital, mantido.
  assert.equal(bounds.minX, 264);

  // maxX só reserva a margem simples (16px) do lado direito, onde não
  // existe sidebar nenhuma - antes do fix, reutilizava os mesmos 264px
  // do lado esquerdo, "comendo" ~248px de área de passeio à toa do lado
  // direito da tela (achado relatado: "tentei arrastar ele pro canto e
  // ele fica num limite").
  assert.equal(bounds.maxX, 1280 - spriteWidth - 16);
});

test("computeViewportBounds: personagem largo (260px) ainda ganha a maior parte da tela no desktop", () => {
  stubWindow(1920, 1080);

  const bounds = computeViewportBounds(260, 260);

  assert.equal(bounds.minX, 264);
  assert.equal(bounds.maxX, 1920 - 260 - 16);
  // Faixa utilizável bem maior que a largura do próprio sprite - não é
  // um "quadradinho".
  assert.ok(bounds.maxX - bounds.minX > 1000);
});

test("computeViewportBounds: mobile (sem sidebar) usa o cantinho confinado, com margem simétrica", () => {
  stubWindow(390, 844);

  const bounds = computeViewportBounds(80, 80);

  // Mobile sempre cai no ramo "conteúdo estreito" (não tem sidebar pra
  // evitar, mas a tela é pequena demais pro passeio livre - ver
  // `isNarrowContentViewport`) - aqui o fix não muda nada, já que
  // `leftMarginX === rightMarginX` no mobile (sem sidebar, a assimetria
  // não existia). `maxX` fica limitado pelo tamanho do canto
  // (`NARROW_CORNER_SIZE`), não pela tela.
  assert.equal(bounds.minX, 12);
  assert.equal(bounds.maxX, 12 + 100);
});
