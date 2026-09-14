import assert from "node:assert/strict";
import test from "node:test";

import { MASCOT_CHARACTERS, characterIdForSpecies } from "./characters";

test("characterIdForSpecies: especies com atlas pronto mapeiam pro personagem certo", () => {
  assert.equal(characterIdForSpecies("gato"), "cat");
  assert.equal(characterIdForSpecies("cachorro"), "dog");
  assert.equal(characterIdForSpecies("passaro"), "bird");
  assert.equal(characterIdForSpecies("urso"), "bear");
  assert.equal(characterIdForSpecies("raposa"), "fox");
  assert.equal(characterIdForSpecies("panda"), "panda");
  assert.equal(characterIdForSpecies("golden"), "golden");
  assert.equal(characterIdForSpecies("akita"), "akita");
  assert.equal(characterIdForSpecies("dogue-alemao"), "dogue-alemao");
  assert.equal(characterIdForSpecies("gato-preto"), "gato-preto");
  assert.equal(characterIdForSpecies("gato-angora"), "gato-angora");
  assert.equal(characterIdForSpecies("gato-tabby"), "gato-tabby");
  assert.equal(characterIdForSpecies("gato-laranja"), "gato-laranja");
  assert.equal(characterIdForSpecies("gato-lilas"), "gato-lilas");
  assert.equal(characterIdForSpecies("gato-siames"), "gato-siames");
});

test("characterIdForSpecies: especie sem atlas (coelho/galinha/sapo) nao mostra o bicho errado", () => {
  assert.equal(characterIdForSpecies("coelho"), null);
  assert.equal(characterIdForSpecies("galinha"), null);
  // "sapo" foi tentado e removido (pack de origem so tinha Idle, sem
  // animacao de andar de verdade - ver CREDITS.txt) - continua mapeando
  // pra null, igual a qualquer outra especie sem personagem pronto.
  assert.equal(characterIdForSpecies("sapo"), null);
});

test("gato-lilas: sem animacao 'Itch' no pack de origem, 'sad' reaproveita os frames de 'idle'", () => {
  const gatoLilas = MASCOT_CHARACTERS["gato-lilas"];
  assert.deepEqual(gatoLilas.animations.sad, gatoLilas.animations.idle);
});

test("MASCOT_CHARACTERS: pelo menos idle tem frame, e todo frame referenciado existe no atlas", () => {
  // Nem todo personagem tem as 8 animacoes (pacotes de asset variam - ver
  // CREDITS.txt pro passaro/urso/raposa, cada um com um subconjunto).
  // idle e o unico obrigatorio de verdade: sem ele nem a pose parada
  // existe. Estados sem frame proprio ficam com array vazio (o motor
  // mantem a ultima animacao tocando - ver runtime.ts).
  for (const character of Object.values(MASCOT_CHARACTERS)) {
    assert.ok(character.animations.idle.length > 0, `${character.id} sem frame de idle`);

    for (const frames of Object.values(character.animations)) {
      for (const frameName of frames) {
        assert.ok(character.frameRects[frameName], `${character.id}: frame "${frameName}" nao existe no atlas`);
      }
    }
  }
});
