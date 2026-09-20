import assert from "node:assert/strict";
import test from "node:test";

import { buildContextualFallback, type FallbackDeps } from "./companion-fallback";

function makeDeps(overrides?: Partial<FallbackDeps>): FallbackDeps {
  return {
    getActiveSession: async () => null,
    getTaskById: async () => null,
    ...overrides,
  };
}

// ── Travado / ajuda ──

test("fallback: 'travado' sem sessão menciona dividir problema", async () => {
  const msg = await buildContextualFallback("tô travado", makeDeps());
  assert.match(msg, /dividir/i);
});

test("fallback: 'não consigo' sem sessão menciona dividir problema", async () => {
  const msg = await buildContextualFallback("não consigo fazer isso", makeDeps());
  assert.match(msg, /dividir/i);
});

test("fallback: 'ajuda' com sessão mostra passo atual", async () => {
  const deps = makeDeps({
    getActiveSession: async () => ({ taskId: "t1", status: "active", currentStepIndex: 0 }),
    getTaskById: async () => ({ title: "Estudar React", steps: [{ title: "Ler docs" }, { title: "Praticar" }] }),
  });
  const msg = await buildContextualFallback("me ajuda", deps);
  assert.match(msg, /Ler docs/);
  assert.match(msg, /Estudar React/);
});

test("fallback: 'ajuda' com sessão sem passos menciona tarefa", async () => {
  const deps = makeDeps({
    getActiveSession: async () => ({ taskId: "t1", status: "active", currentStepIndex: 0 }),
    getTaskById: async () => ({ title: "Estudar React", steps: [] }),
  });
  const msg = await buildContextualFallback("travado", deps);
  assert.match(msg, /Estudar React/);
  assert.match(msg, /dividir/i);
});

test("fallback: 'ajuda' com sessão e currentStepIndex fora do range menciona tarefa", async () => {
  const deps = makeDeps({
    getActiveSession: async () => ({ taskId: "t1", status: "active", currentStepIndex: 5 }),
    getTaskById: async () => ({ title: "Teste", steps: [{ title: "A" }] }),
  });
  const msg = await buildContextualFallback("ajuda", deps);
  assert.match(msg, /Teste/);
});

// ── Saudação ──

test("fallback: 'oi' retorna saudação", async () => {
  const msg = await buildContextualFallback("oi", makeDeps());
  assert.ok(msg.length > 0);
  // Não deve mencionar tarefa
  assert.doesNotMatch(msg, /tarefa|passo/i);
});

test("fallback: 'bom dia' retorna saudação", async () => {
  const msg = await buildContextualFallback("bom dia", makeDeps());
  assert.ok(msg.length > 0);
});

test("fallback: 'boa noite' retorna saudação", async () => {
  const msg = await buildContextualFallback("boa noite", makeDeps());
  assert.ok(msg.length > 0);
});

// ── Agradecimento ──

test("fallback: 'obrigado' retorna agradecimento", async () => {
  const msg = await buildContextualFallback("obrigado", makeDeps());
  assert.ok(msg.length > 0);
  assert.doesNotMatch(msg, /tarefa/i);
});

test("fallback: 'valeu' retorna agradecimento", async () => {
  const msg = await buildContextualFallback("valeu", makeDeps());
  assert.ok(msg.length > 0);
});

test("fallback: 'thanks' retorna agradecimento", async () => {
  const msg = await buildContextualFallback("thanks", makeDeps());
  assert.ok(msg.length > 0);
});

// ── Genérico (sem match) ──

test("fallback: mensagem genérica não menciona tarefa", async () => {
  const msg = await buildContextualFallback("quero gozar", makeDeps());
  assert.ok(msg.length > 0);
  assert.doesNotMatch(msg, /tarefa|passo|gozar/i);
});

test("fallback: 'sla' não menciona tarefa", async () => {
  const msg = await buildContextualFallback("sla", makeDeps());
  assert.ok(msg.length > 0);
  assert.doesNotMatch(msg, /tarefa/i);
});

test("fallback: mensagem longa não menciona tarefa", async () => {
  const msg = await buildContextualFallback("não sei o que fazer com minha vida", makeDeps());
  assert.ok(msg.length > 0);
  assert.doesNotMatch(msg, /tarefa/i);
});

// ── Prefixo de indisponibilidade ──

test("fallback: genérico pode incluir prefixo de indisponibilidade", async () => {
  // Roda várias vezes para cobrir as opções com e sem prefixo
  const results = await Promise.all(
    Array.from({ length: 20 }, () => buildContextualFallback("qualquer coisa", makeDeps())),
  );
  const hasPrefix = results.some((r) => r.includes("sem IA"));
  assert.ok(hasPrefix, "Pelo menos uma resposta deve conter 'sem IA'");
});

test("fallback: 'ajuda' sem sessão inclui prefixo", async () => {
  const msg = await buildContextualFallback("me ajuda", makeDeps());
  assert.match(msg, /sem IA/i);
});

// ── Casse insensível ──

test("fallback: 'TRAVADO' (maiúsculo) é detectado", async () => {
  const msg = await buildContextualFallback("TRAVADO", makeDeps());
  assert.match(msg, /dividir/i);
});

test("fallback: 'OI' (maiúsculo) é detectado", async () => {
  const msg = await buildContextualFallback("OI", makeDeps());
  assert.ok(msg.length > 0);
});

// ── Erro no deps ──

test("fallback: erro no getActiveSession não quebra", async () => {
  const deps = makeDeps({
    getActiveSession: async () => { throw new Error("db error"); },
  });
  const msg = await buildContextualFallback("ajuda", deps);
  assert.ok(msg.length > 0);
  assert.match(msg, /dividir/i);
});

test("fallback: erro no getTaskById não quebra", async () => {
  const deps = makeDeps({
    getActiveSession: async () => ({ taskId: "t1", status: "active", currentStepIndex: 0 }),
    getTaskById: async () => { throw new Error("db error"); },
  });
  const msg = await buildContextualFallback("ajuda", deps);
  assert.ok(msg.length > 0);
  assert.match(msg, /dividir/i);
});

// ── Sem sessão ativa ──

test("fallback: 'ajuda' sem sessão ativa não menciona tarefa", async () => {
  const msg = await buildContextualFallback("travado", makeDeps());
  assert.doesNotMatch(msg, /você tá no passo/i);
  assert.match(msg, /dividir/i);
});

// ── Sessão com sessão paused ──

test("fallback: sessão paused não é buscada (só active)", async () => {
  const deps = makeDeps({
    getActiveSession: async () => null,
    getTaskById: async () => ({ title: "Tarefa Pausada", steps: [] }),
  });
  const msg = await buildContextualFallback("ajuda", deps);
  assert.doesNotMatch(msg, /Tarefa Pausada/);
});
