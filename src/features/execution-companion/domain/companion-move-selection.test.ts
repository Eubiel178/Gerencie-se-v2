import assert from "node:assert/strict";
import test from "node:test";

import { computeCandidateMoves } from "./companion-move-selection";

test("computeCandidateMoves: sem limite de espaço nem recuo, devolve os movimentos da situação na ordem de preferência da personalidade", () => {
  const moves = computeCandidateMoves({
    situation: "execution-idle-nudge",
    personality: "motivador",
    isQuiet: false,
    isMeaningful: false,
    inRecoveryWindow: false,
  });

  assert.deepEqual(moves, ["oferecer-ajuda", "observar"]);
});

test("computeCandidateMoves: limite de espaço ativo silencia por completo uma situação casual", () => {
  const moves = computeCandidateMoves({
    situation: "long-session",
    personality: "afetuoso",
    isQuiet: true,
    isMeaningful: false,
    inRecoveryWindow: false,
  });

  assert.deepEqual(moves, []);
});

test("computeCandidateMoves: limite de espaço ativo rebaixa (nunca silencia) uma situação meaningful", () => {
  const moves = computeCandidateMoves({
    situation: "overdue-task",
    personality: "motivador",
    isQuiet: true,
    isMeaningful: true,
    inRecoveryWindow: false,
  });

  // "oferecer-ajuda" sai (não é discreto o bastante), "reconhecer" fica.
  assert.deepEqual(moves, ["reconhecer"]);
});

test("computeCandidateMoves: janela de recuo tira oferecer-ajuda/sugerir/iniciar, mas nunca observar/reconhecer/comemorar", () => {
  const moves = computeCandidateMoves({
    situation: "deadline-approaching",
    personality: "motivador",
    isQuiet: false,
    isMeaningful: true,
    inRecoveryWindow: true,
  });

  assert.deepEqual(moves, ["observar"]);
});

test("computeCandidateMoves: personalidades diferentes preferem movimentos diferentes pra mesma situação", () => {
  const zen = computeCandidateMoves({
    situation: "execution-idle-nudge",
    personality: "zen",
    isQuiet: false,
    isMeaningful: false,
    inRecoveryWindow: false,
  });
  const motivador = computeCandidateMoves({
    situation: "execution-idle-nudge",
    personality: "motivador",
    isQuiet: false,
    isMeaningful: false,
    inRecoveryWindow: false,
  });

  assert.notDeepEqual(zen, motivador);
});
