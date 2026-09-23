import assert from "node:assert/strict";
import { test } from "node:test";

import { hasDegenerateRepetition } from "./detect-degenerate-repetition";

test("texto normal, sem repetição, nunca é sinalizado", () => {
  assert.equal(
    hasDegenerateRepetition(
      "Essa tarefa venceu há uns dias e ainda não tem passos concluídos, mas ela tá em execução agora."
    ),
    false
  );
});

test("bug real corrigido: título de tarefa repetido 3+ vezes é detectado", () => {
  const text = "Correr contra o tempo Correr contra o tempo Correr contra o tempo, olha só.";
  assert.equal(hasDegenerateRepetition(text), true);
});

test("frase curta repetida (menos que o mínimo de caracteres) não é falso positivo", () => {
  // "tá tá tá" - repetição real, mas curta demais pra ser um artefato de
  // degeneração (isso é só ênfase natural de fala, nunca deveria acionar).
  assert.equal(hasDegenerateRepetition("tá tá tá tá tá, calma aí"), false);
});

test("uma frase repetida só 2 vezes não é sinalizada (mínimo é 3)", () => {
  const text = "Terminar o projeto até sexta é importante. Terminar o projeto até sexta é importante.";
  assert.equal(hasDegenerateRepetition(text), false);
});

test("texto curto nunca é sinalizado, mesmo se coincidentemente repetitivo", () => {
  assert.equal(hasDegenerateRepetition("oi oi oi"), false);
});

test("texto vazio nunca é sinalizado", () => {
  assert.equal(hasDegenerateRepetition(""), false);
});

test("detecta mesmo quando a frase repetida é mais longa que o título de uma tarefa comum", () => {
  const text =
    "Estudar matemática hoje à noite. Estudar matemática hoje à noite. Estudar matemática hoje à noite. Já registrei aqui.";
  assert.equal(hasDegenerateRepetition(text), true);
});
