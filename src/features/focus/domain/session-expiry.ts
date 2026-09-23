import { IFocusSession } from "./focus-session";

// Uma sessão "running" cujo tempo decorrido já ultrapassou a duração
// planejada é uma sessão órfã (aba fechada, hot-reload em dev, queda do app)
// — nunca deve ser reaproveitada como se ainda estivesse em andamento.
export function isFocusSessionExpired(
  session: Pick<IFocusSession, "startedAt" | "plannedDurationSeconds">,
  now: Date = new Date()
): boolean {
  const elapsedSeconds = (now.getTime() - session.startedAt.getTime()) / 1000;
  return elapsedSeconds >= session.plannedDurationSeconds;
}
