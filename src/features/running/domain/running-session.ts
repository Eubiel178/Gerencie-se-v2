export type RunningSource = "manual" | "gps";

export interface IRunningSession {
  id: string;
  userId: string;
  startedAt: Date;
  durationSeconds: number;
  distanceMeters: number;
  source: RunningSource;

  // Calculados a partir de duration/distance na hora de ler (nunca
  // guardados): ritmo em min/km e velocidade em km/h. `null` quando a
  // distância é 0 (divisão por zero).
  paceMinPerKm: number | null;
  speedKmh: number;
}

export interface IRunningTotals {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  sessionCount: number;
}
