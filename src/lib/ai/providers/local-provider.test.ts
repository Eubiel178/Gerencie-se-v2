import assert from "node:assert/strict";
import test from "node:test";

import { LocalAssistantProvider } from "./local-provider";

const provider = new LocalAssistantProvider();
const ALL_PERSONALITIES = ["afetuoso", "sarcastico", "engracado", "motivador", "zen"] as const;

// ── decomposeTask ──

test("decomposeTask: retorna steps vazios quando não há existingSteps", async () => {
  const result = await provider.decomposeTask({
    taskTitle: "Estudar React",
    taskDescription: "",
    existingSteps: [],
    personality: "afetuoso",
  });
  assert.equal(result.steps.length, 0);
  assert.ok(result.firstMessage.length > 0);
});

test("decomposeTask: preserva existingSteps quando fornecidos", async () => {
  const existing = ["Ler documentação", "Fazer exercícios", "Revisar"];
  const result = await provider.decomposeTask({
    taskTitle: "Estudar React",
    taskDescription: "",
    existingSteps: existing,
    personality: "afetuoso",
  });
  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].title, "Ler documentação");
  assert.equal(result.steps[1].title, "Fazer exercícios");
  assert.equal(result.steps[2].title, "Revisar");
  result.steps.forEach((s) => assert.equal(s.completed, false));
});

test("decomposeTask: todas as personalidades retornam firstMessage", async () => {
  for (const personality of ALL_PERSONALITIES) {
    const result = await provider.decomposeTask({
      taskTitle: "Teste",
      taskDescription: "",
      existingSteps: [],
      personality,
    });
    assert.ok(result.firstMessage.length > 0, `${personality} deve ter firstMessage`);
  }
});

test("decomposeTask: personalidade inválida usa afetuoso como fallback", async () => {
  const result = await provider.decomposeTask({
    taskTitle: "Teste",
    taskDescription: "",
    existingSteps: [],
    personality: "invalid" as any,
  });
  assert.ok(result.firstMessage.length > 0);
});

// ── helpWhenStuck ──

test("helpWhenStuck: retorna suggestion não vazia", async () => {
  const result = await provider.helpWhenStuck({ personality: "afetuoso" });
  assert.ok(result.suggestion.length > 0);
});

test("helpWhenStuck: todas as personalidades funcionam", async () => {
  for (const personality of ALL_PERSONALITIES) {
    const result = await provider.helpWhenStuck({ personality });
    assert.ok(result.suggestion.length > 0, `${personality} deve ter suggestion`);
  }
});

test("helpWhenStuck: personalidade inválida usa afetuoso como fallback", async () => {
  const result = await provider.helpWhenStuck({ personality: "invalid" as any });
  assert.ok(result.suggestion.length > 0);
});

// ── resumeAfterDistraction ──

test("resumeAfterDistraction: retorna message não vazia", async () => {
  const result = await provider.resumeAfterDistraction({ personality: "afetuoso" });
  assert.ok(result.message.length > 0);
});

test("resumeAfterDistraction: todas as personalidades funcionam", async () => {
  for (const personality of ALL_PERSONALITIES) {
    const result = await provider.resumeAfterDistraction({ personality });
    assert.ok(result.message.length > 0, `${personality} deve ter message`);
  }
});

test("resumeAfterDistraction: personalidade inválida usa afetuoso como fallback", async () => {
  const result = await provider.resumeAfterDistraction({ personality: "invalid" as any });
  assert.ok(result.message.length > 0);
});

// ── Mensagens não contêm caracteres inválidos ──

test("nenhuma mensagem contém caracteres de placeholder quebrados", async () => {
  const brokenPatterns = ["天才", "Organizando-se", "[object", "undefined", "null"];

  for (const personality of ALL_PERSONALITIES) {
    const decompose = await provider.decomposeTask({
      taskTitle: "Teste",
      taskDescription: "",
      existingSteps: [],
      personality,
    });
    const stuck = await provider.helpWhenStuck({ personality });
    const resume = await provider.resumeAfterDistraction({ personality });

    const allText = [decompose.firstMessage, stuck.suggestion, resume.message].join(" ");
    for (const pattern of brokenPatterns) {
      assert.ok(
        !allText.includes(pattern),
        `${personality} contém "${pattern}": ${allText}`,
      );
    }
  }
});
