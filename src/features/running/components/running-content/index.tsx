"use client";

import { useState } from "react";

import { IRunningSession } from "@/features/running/domain";

import { History } from "../history";
import { RunningTracker } from "../running-tracker";
import { Totals } from "../totals";

import styles from "./styles.module.css";

export function RunningContent({ sessions }: { sessions: IRunningSession[] }) {
  const [visibleSessions, setVisibleSessions] = useState(sessions);
  const [previousSessions, setPreviousSessions] = useState(sessions);

  if (sessions !== previousSessions) {
    setPreviousSessions(sessions);
    setVisibleSessions(sessions);
  }

  const totals = visibleSessions.reduce(
    (current, session) => ({
      totalDistanceMeters: current.totalDistanceMeters + session.distanceMeters,
      totalDurationSeconds: current.totalDurationSeconds + session.durationSeconds,
      sessionCount: current.sessionCount + 1,
    }),
    { totalDistanceMeters: 0, totalDurationSeconds: 0, sessionCount: 0 }
  );

  return (
    <div className={styles.content}>
      <Totals totals={totals} />
      <RunningTracker onSessionCreated={(session) => setVisibleSessions((current) => [session, ...current])} />
      <History sessions={visibleSessions} onRemove={(id) => setVisibleSessions((current) => current.filter((session) => session.id !== id))} />
    </div>
  );
}
