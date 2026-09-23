import assert from "node:assert/strict";
import { test } from "node:test";

import { parseCompanionMarkdown } from "./parse-companion-markdown";

test("texto simples vira um único parágrafo sem negrito", () => {
  const blocks = parseCompanionMarkdown("oi, tudo bem?");
  assert.deepEqual(blocks, [
    { type: "paragraph", lines: [[{ bold: false, text: "oi, tudo bem?" }]] },
  ]);
});

test("**negrito** vira segmento bold, sem os asteriscos", () => {
  const blocks = parseCompanionMarkdown("faltam **duas** tarefas hoje");
  assert.deepEqual(blocks, [
    {
      type: "paragraph",
      lines: [
        [
          { bold: false, text: "faltam " },
          { bold: true, text: "duas" },
          { bold: false, text: " tarefas hoje" },
        ],
      ],
    },
  ]);
});

test("linha isolada com ** vira texto literal, nunca quebra o parser", () => {
  const blocks = parseCompanionMarkdown("preço: R$ 10**");
  assert.deepEqual(blocks, [
    { type: "paragraph", lines: [[{ bold: false, text: "preço: R$ 10**" }]] },
  ]);
});

test("quebra de linha simples vira múltiplas linhas no MESMO parágrafo", () => {
  const blocks = parseCompanionMarkdown("primeira linha\nsegunda linha");
  assert.deepEqual(blocks, [
    {
      type: "paragraph",
      lines: [
        [{ bold: false, text: "primeira linha" }],
        [{ bold: false, text: "segunda linha" }],
      ],
    },
  ]);
});

test("linha em branco separa em parágrafos DIFERENTES", () => {
  const blocks = parseCompanionMarkdown("primeiro\n\nsegundo");
  assert.deepEqual(blocks, [
    { type: "paragraph", lines: [[{ bold: false, text: "primeiro" }]] },
    { type: "paragraph", lines: [[{ bold: false, text: "segundo" }]] },
  ]);
});

test("lista com marcador (- ) vira bullet-list", () => {
  const blocks = parseCompanionMarkdown("- primeiro item\n- segundo item");
  assert.deepEqual(blocks, [
    {
      type: "bullet-list",
      items: [
        [{ bold: false, text: "primeiro item" }],
        [{ bold: false, text: "segundo item" }],
      ],
    },
  ]);
});

test("lista com marcador (* ) também vira bullet-list", () => {
  const blocks = parseCompanionMarkdown("* item A\n* item B");
  assert.equal(blocks[0].type, "bullet-list");
});

test("lista numerada (1. ) vira numbered-list", () => {
  const blocks = parseCompanionMarkdown("1. primeiro passo\n2. segundo passo");
  assert.deepEqual(blocks, [
    {
      type: "numbered-list",
      items: [
        [{ bold: false, text: "primeiro passo" }],
        [{ bold: false, text: "segundo passo" }],
      ],
    },
  ]);
});

test("negrito dentro de item de lista continua funcionando", () => {
  const blocks = parseCompanionMarkdown("- **Estudar matemática** - não iniciada");
  assert.deepEqual(blocks, [
    {
      type: "bullet-list",
      items: [
        [
          { bold: true, text: "Estudar matemática" },
          { bold: false, text: " - não iniciada" },
        ],
      ],
    },
  ]);
});

test("parágrafo antes e lista depois viram blocos separados, nessa ordem", () => {
  const blocks = parseCompanionMarkdown("Suas tarefas de hoje:\n- Tarefa A\n- Tarefa B");
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[1].type, "bullet-list");
});

test("texto vazio não gera nenhum bloco", () => {
  assert.deepEqual(parseCompanionMarkdown(""), []);
});

test("linha só com espaços entre parágrafos não gera bloco vazio", () => {
  const blocks = parseCompanionMarkdown("um\n   \ndois");
  assert.equal(blocks.length, 2);
});
