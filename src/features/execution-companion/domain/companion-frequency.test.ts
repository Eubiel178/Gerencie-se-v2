import assert from "node:assert/strict";
import test from "node:test";

import { COMPANION_FREQUENCY, isCompanionFrequencyAllowed } from "./companion-frequency";

const NOW = new Date("2026-09-22T12:00:00Z");

function minutesAgo(min: number): Date {
  return new Date(NOW.getTime() - min * 60 * 1000);
}

test("nunca falou antes: sempre permitido", () => {
  const allowed = isCompanionFrequencyAllowed({
    priority: "casual",
    frequencyBypass: false,
    lastSpokeAt: null,
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: false,
  });
  assert.equal(allowed, true);
});

test("meaningful logo após outra fala (bem próximo): bloqueado", () => {
  const allowed = isCompanionFrequencyAllowed({
    priority: "meaningful",
    frequencyBypass: false,
    lastSpokeAt: minutesAgo(1),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: false,
  });
  assert.equal(allowed, false);
});

test("meaningful depois do intervalo mínimo: permitido", () => {
  const allowed = isCompanionFrequencyAllowed({
    priority: "meaningful",
    frequencyBypass: false,
    lastSpokeAt: minutesAgo(4),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: false,
  });
  assert.equal(allowed, true);
});

test("casual exige intervalo bem maior que meaningful", () => {
  // 4 minutos já libera meaningful, mas não libera casual.
  const allowed = isCompanionFrequencyAllowed({
    priority: "casual",
    frequencyBypass: false,
    lastSpokeAt: minutesAgo(4),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: false,
  });
  assert.equal(allowed, false);
});

test("casual com usuário engajado no chat exige intervalo ainda maior", () => {
  // 15 minutos já libera casual normal, mas não libera casual engajado.
  const allowedNormal = isCompanionFrequencyAllowed({
    priority: "casual",
    frequencyBypass: false,
    lastSpokeAt: minutesAgo(15),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: false,
  });
  const allowedEngaged = isCompanionFrequencyAllowed({
    priority: "casual",
    frequencyBypass: false,
    lastSpokeAt: minutesAgo(15),
    now: NOW,
    isEngagedViaChat: true,
    abuseGuardTriggered: false,
  });
  assert.equal(allowedNormal, true);
  assert.equal(allowedEngaged, false);
});

test("evento com bypass ignora o intervalo mínimo normal", () => {
  const allowed = isCompanionFrequencyAllowed({
    priority: "meaningful",
    frequencyBypass: true,
    lastSpokeAt: minutesAgo(0.1),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: false,
  });
  assert.equal(allowed, true);
});

test("freio de emergência ativo: ignora prioridade E bypass, exige o maior intervalo", () => {
  const allowedBypassButRecent = isCompanionFrequencyAllowed({
    priority: "meaningful",
    frequencyBypass: true,
    lastSpokeAt: minutesAgo(5),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: true,
  });
  assert.equal(allowedBypassButRecent, false);

  const allowedAfterLongGap = isCompanionFrequencyAllowed({
    priority: "meaningful",
    frequencyBypass: true,
    lastSpokeAt: minutesAgo(30),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: true,
  });
  assert.equal(allowedAfterLongGap, true);
});

test("freio de emergência nunca bloqueia para sempre - ainda permite após o maior intervalo", () => {
  const minutesForLargestGap = COMPANION_FREQUENCY.CASUAL_MIN_GAP_WHILE_ENGAGED_MS / 60000;
  const allowed = isCompanionFrequencyAllowed({
    priority: "casual",
    frequencyBypass: false,
    lastSpokeAt: minutesAgo(minutesForLargestGap + 1),
    now: NOW,
    isEngagedViaChat: false,
    abuseGuardTriggered: true,
  });
  assert.equal(allowed, true);
});
