import { z } from "zod";

// Limites generosos só para barrar valores absurdos (erro de digitação ou
// chamada direta da Server Action) — nunca para invalidar uma corrida real.
const MAX_DURATION_SECONDS = 24 * 60 * 60; // 24h
const MAX_DISTANCE_METERS = 300_000; // 300km

export const createRunningSessionSchema = z.object({
  durationSeconds: z.number().int().positive().max(MAX_DURATION_SECONDS, "Duração muito alta"),
  distanceMeters: z.number().positive().max(MAX_DISTANCE_METERS, "Distância muito alta"),
  source: z.enum(["manual", "gps"]),
});
