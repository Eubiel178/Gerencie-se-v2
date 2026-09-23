import assert from "node:assert/strict";
import test from "node:test";

import { MascotPersonality } from "@/features/focus/domain";

import { CompanionFact, phraseCompanion } from "./companion-phrasing";

const PERSONALITIES: MascotPersonality[] = [
  "afetuoso",
  "sarcastico",
  "engracado",
  "motivador",
  "zen",
];

const FACTS: CompanionFact[] = [
  { kind: "execution-started", taskTitle: "Estudar React" },
  { kind: "execution-completed", taskTitle: "Estudar React" },
  { kind: "execution-idle-nudge", taskTitle: "Estudar React", elapsedMinutes: 12 },
  { kind: "return-after-absence", taskTitle: "Estudar React", firstName: null },
  { kind: "presence-greeting", taskTitle: "Estudar React", firstName: null },
  { kind: "presence-greeting", taskTitle: null, firstName: null },
  { kind: "long-session", taskTitle: "Estudar React", elapsedMinutes: 45, gender: "nao_informado" },
  { kind: "deadline-approaching", taskTitle: "Estudar React", minutesUntilDue: 30 },
  { kind: "overdue-task", taskTitle: "Estudar React", daysOverdue: 2 },
  { kind: "progress-milestone", taskTitle: "Estudar React", completedSteps: 3, totalSteps: 5 },
  { kind: "reopened-task", taskTitle: "Estudar React" },
];

test("phraseCompanion: toda combinação de personalidade x fato gera texto escrito e falado", () => {
  for (const personality of PERSONALITIES) {
    for (const fact of FACTS) {
      const phrase = phraseCompanion(fact, personality);
      assert.ok(phrase.written.length > 0);
      assert.ok(phrase.spoken.length > 0);
    }
  }
});

test("phraseCompanion: usa o título real da tarefa, nunca um texto genérico fixo", () => {
  const phrase = phraseCompanion(
    { kind: "execution-started", taskTitle: "Escrever relatório" },
    "afetuoso"
  );

  assert.match(phrase.written, /Escrever relatório/);
});

test("phraseCompanion: escrito e falado podem diferir (não precisam ser o mesmo texto)", () => {
  const phrase = phraseCompanion(
    { kind: "execution-idle-nudge", taskTitle: "Estudar React", elapsedMinutes: 12 },
    "afetuoso"
  );

  assert.notEqual(phrase.written, phrase.spoken);
});

test("phraseCompanion: volta de ausência nunca presume distração (linguagem neutra)", () => {
  const fact: CompanionFact = { kind: "return-after-absence", taskTitle: "Estudar React", firstName: null };

  for (const personality of PERSONALITIES) {
    const phrase = phraseCompanion(fact, personality);
    for (const text of [phrase.written, phrase.spoken]) {
      assert.doesNotMatch(text.toLowerCase(), /distra|sumiu|cadê você|abandonou/);
    }
  }
});

test("phraseCompanion: personalidades diferentes nunca repetem a mesma frase pro mesmo fato", () => {
  const fact: CompanionFact = { kind: "execution-completed", taskTitle: "Estudar React" };
  const afetuoso = phraseCompanion(fact, "afetuoso");
  const sarcastico = phraseCompanion(fact, "sarcastico");

  assert.notEqual(afetuoso.written, sarcastico.written);
});

test("phraseCompanion: nome só aparece quando fornecido (uso ocasional, decidido por quem chama)", () => {
  const withName = phraseCompanion(
    { kind: "presence-greeting", taskTitle: null, firstName: "Gabriel" },
    "afetuoso"
  );
  const withoutName = phraseCompanion(
    { kind: "presence-greeting", taskTitle: null, firstName: null },
    "afetuoso"
  );

  assert.match(withName.written, /Gabriel/);
  assert.doesNotMatch(withoutName.written, /Gabriel/);
});

test("phraseCompanion: presence-greeting sem tarefa ativa não inventa nenhuma tarefa", () => {
  const phrase = phraseCompanion({ kind: "presence-greeting", taskTitle: null, firstName: null }, "zen");
  assert.doesNotMatch(phrase.written, /"/);
});

test("phraseCompanion: long-session nunca usa adjetivo de gênero quando gênero é desconhecido", () => {
  const phrase = phraseCompanion(
    { kind: "long-session", taskTitle: "Estudar React", elapsedMinutes: 40, gender: "nao_informado" },
    "afetuoso"
  );
  assert.doesNotMatch(phrase.spoken.toLowerCase(), /cansad[oa]\b/);
});

test("phraseCompanion: tarefa atrasada nunca soa acusatório", () => {
  const fact: CompanionFact = { kind: "overdue-task", taskTitle: "Estudar React", daysOverdue: 3 };

  for (const personality of PERSONALITIES) {
    const phrase = phraseCompanion(fact, personality);
    for (const text of [phrase.written, phrase.spoken]) {
      assert.doesNotMatch(text.toLowerCase(), /sua culpa|deveria ter|fracass/);
    }
  }
});

test("phraseCompanion: marco de progresso usa a contagem real de passos", () => {
  const phrase = phraseCompanion(
    { kind: "progress-milestone", taskTitle: "Estudar React", completedSteps: 4, totalSteps: 6 },
    "motivador"
  );
  assert.match(phrase.written, /4/);
  assert.match(phrase.written, /6/);
});

test("phraseCompanion: reabertura de tarefa nunca soa como repreensão", () => {
  const fact: CompanionFact = { kind: "reopened-task", taskTitle: "Estudar React" };

  for (const personality of PERSONALITIES) {
    const phrase = phraseCompanion(fact, personality);
    for (const text of [phrase.written, phrase.spoken]) {
      assert.doesNotMatch(text.toLowerCase(), /desistiu|voltou atrás|erro seu/);
    }
  }
});
