import assert from "node:assert/strict";
import test from "node:test";

import { calculatePaceMinPerKm, haversineMeters } from "./live-tracking";

test("haversineMeters: mesmo ponto tem distância zero", () => {
  const point = { lat: -23.55052, lng: -46.633308 };
  assert.equal(haversineMeters(point, point), 0);
});

test("haversineMeters: distância conhecida entre dois pontos (aprox. 1km em latitude)", () => {
  const a = { lat: 0, lng: 0 };
  const b = { lat: 0.009, lng: 0 }; // ~1km ao norte no equador
  const distance = haversineMeters(a, b);
  assert.ok(distance > 950 && distance < 1050, `esperado ~1000m, obtido ${distance}`);
});

test("calculatePaceMinPerKm: sem distância percorrida, ritmo é 0 (não Infinity)", () => {
  assert.equal(calculatePaceMinPerKm(0, 300), 0);
});

test("calculatePaceMinPerKm: 5km em 25 minutos = 5 min/km", () => {
  assert.equal(calculatePaceMinPerKm(5000, 25 * 60), 5);
});
