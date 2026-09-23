import assert from "node:assert/strict";
import test from "node:test";

import { MascotPersonality } from "@/features/focus/domain";

import { computeCompanionStatus } from "./companion-status";
import { phraseCompanionStatus } from "./companion-status-phrasing";

const PERSONALITIES: MascotPersonality[] = ["afetuoso", "sarcastico", "engracado", "motivador", "zen"];

test("computeCompanionStatus: sem nenhum sinal notável, devolve 'calm' (resposta válida, não uma falha)", () => {
  const status = computeCompanionStatus({
    isQuiet: false,
    declinedRecently: false,
    acceptedRecently: null,
    recentCelebration: null,
    activeTask: null,
  });
  assert.equal(status.category, "calm");
});

test("computeCompanionStatus: limite de espaço ativo tem prioridade sobre qualquer outro sinal", () => {
  const status = computeCompanionStatus({
    isQuiet: true,
    declinedRecently: true,
    acceptedRecently: { taskTitle: "X" },
    recentCelebration: { taskTitle: "Y" },
    activeTask: { title: "Z" },
  });
  assert.equal(status.category, "quiet");
});

test("computeCompanionStatus: tarefa ativa só aparece quando nada mais recente existe", () => {
  const status = computeCompanionStatus({
    isQuiet: false,
    declinedRecently: false,
    acceptedRecently: null,
    recentCelebration: null,
    activeTask: { title: "Estudar React" },
  });
  assert.equal(status.category, "active-task");
  assert.equal(status.taskTitle, "Estudar React");
});

test("phraseCompanionStatus: toda combinação categoria x personalidade gera texto não vazio", () => {
  const categories = ["quiet", "declined-recently", "accepted-recently", "celebrated-recently", "active-task", "calm"] as const;
  for (const personality of PERSONALITIES) {
    for (const category of categories) {
      const text = phraseCompanionStatus({ category, taskTitle: "Estudar React" }, personality);
      assert.ok(text.length > 0);
    }
  }
});

test("phraseCompanionStatus: personalidades diferentes nunca dizem a mesma frase pra mesma categoria", () => {
  const afetuoso = phraseCompanionStatus({ category: "calm", taskTitle: null }, "afetuoso");
  const sarcastico = phraseCompanionStatus({ category: "calm", taskTitle: null }, "sarcastico");
  assert.notEqual(afetuoso, sarcastico);
});

test("phraseCompanionStatus: mesma categoria e personalidade sempre devolve o mesmo texto (continuidade, nunca aleatório)", () => {
  const first = phraseCompanionStatus({ category: "active-task", taskTitle: "Estudar React" }, "zen");
  const second = phraseCompanionStatus({ category: "active-task", taskTitle: "Estudar React" }, "zen");
  assert.equal(first, second);
});
