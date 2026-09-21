import assert from "node:assert/strict";
import test from "node:test";

import { IMascotState } from "./mascot";
import { getMascotLine } from "./mascot-lines";

function buildMascot(overrides: Partial<IMascotState> = {}): IMascotState {
  return {
    userId: "u1",
    name: "Chunchumaru",
    personality: "afetuoso",
    species: "gato",
    totalXp: 0,
    level: 1,
    xpIntoCurrentLevel: 0,
    xpForNextLevel: 100,
    ...overrides,
  };
}

test("getMascotLine: reflete o XP restante e o nível reais, não um texto fixo", () => {
  const mascot = buildMascot({ totalXp: 1, level: 2, xpIntoCurrentLevel: 20, xpForNextLevel: 100 });
  const line = getMascotLine("afetuoso", "idle", mascot, new Date("2026-01-01T09:00:00"));

  assert.match(line, /80 XP/);
  assert.match(line, /nível 3/);
});

test("getMascotLine: mesmo evento/personalidade varia com XP total (não é sempre a mesma frase)", () => {
  const mascotA = buildMascot({ totalXp: 0 });
  const mascotB = buildMascot({ totalXp: 1 });

  const lineA = getMascotLine("sarcastico", "working", mascotA, new Date("2026-01-01T09:00:00"));
  const lineB = getMascotLine("sarcastico", "working", mascotB, new Date("2026-01-01T09:00:00"));

  assert.notEqual(lineA, lineB);
});

test("getMascotLine: personalidade sarcástica nunca usa as mesmas frases da afetuosa", () => {
  const mascot = buildMascot();
  const afetuoso = getMascotLine("afetuoso", "happy", mascot, new Date("2026-01-01T09:00:00"));
  const sarcastico = getMascotLine("sarcastico", "happy", mascot, new Date("2026-01-01T09:00:00"));

  assert.notEqual(afetuoso, sarcastico);
});
