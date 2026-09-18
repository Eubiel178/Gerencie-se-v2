"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Input } from "@/components";

import { createRunningSessionAction } from "@/features/running/actions";
import { calculatePaceMinPerKm, haversineMeters, IRunningSession } from "@/features/running/domain";

import styles from "./styles.module.css";

type Tab = "manual" | "gps";

export function RunningTracker({ onSessionCreated }: { onSessionCreated: (session: IRunningSession) => void }) {
  const [tab, setTab] = useState<Tab>("manual");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabs: Tab[] = ["manual", "gps"];

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex == null) return;

    event.preventDefault();
    selectTab(tabs[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className={styles.tracker} aria-label="Como registrar sua corrida">
      <div className={styles.tabs} role="tablist" aria-label="Modo de registro">
        <Button.Root
          ref={(element) => {
            tabRefs.current[0] = element;
          }}
          id="running-tab-manual"
          role="tab"
          aria-selected={tab === "manual"}
          aria-controls="running-registration-panel"
          tabIndex={tab === "manual" ? 0 : -1}
          className={`${styles.tab} ${tab === "manual" ? styles.tabActive : ""}`}
          variant="secondary"
          onClick={() => selectTab("manual")}
          onKeyDown={(event) => handleTabKeyDown(event, 0)}
        >
          Registro manual
        </Button.Root>
        <Button.Root
          ref={(element) => {
            tabRefs.current[1] = element;
          }}
          id="running-tab-gps"
          role="tab"
          aria-selected={tab === "gps"}
          aria-controls="running-registration-panel"
          tabIndex={tab === "gps" ? 0 : -1}
          className={`${styles.tab} ${tab === "gps" ? styles.tabActive : ""}`}
          variant="secondary"
          onClick={() => selectTab("gps")}
          onKeyDown={(event) => handleTabKeyDown(event, 1)}
        >
          GPS ao vivo
        </Button.Root>
      </div>

      <div
        id="running-registration-panel"
        className={styles.tabPanel}
        role="tabpanel"
        aria-labelledby={tab === "manual" ? "running-tab-manual" : "running-tab-gps"}
        tabIndex={0}
      >
        {tab === "manual" ? (
          <ManualEntry onSaved={onSessionCreated} />
        ) : (
          <LiveTracker onSaved={onSessionCreated} />
        )}
      </div>
    </section>
  );
}

function ManualEntry({ onSaved }: { onSaved: (session: IRunningSession) => void }) {
  const [distanceKm, setDistanceKm] = useState("");
  const [minutes, setMinutes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const distance = Number(distanceKm);
    const durationMinutes = Number(minutes);

    if (!Number.isFinite(distance) || distance <= 0) {
      setError("Informe uma distância válida.");
      return;
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError("Informe um tempo válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createRunningSessionAction({
        distanceMeters: Math.round(distance * 1000),
        durationSeconds: Math.round(durationMinutes * 60),
        source: "manual",
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setDistanceKm("");
      setMinutes("");
      if (result.session) onSaved(result.session);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.fieldsRow}>
        <Input.Root>
          <Input.Label htmlFor="distanceKm">Distância (km)</Input.Label>
          <Input.Wrapper>
            <Input.Field
              name="distanceKm"
              type="number"
              step="0.01"
              min={0}
              value={distanceKm}
              onChange={(event) => setDistanceKm(event.target.value)}
            />
          </Input.Wrapper>
        </Input.Root>

        <Input.Root>
          <Input.Label htmlFor="minutes">Tempo (minutos)</Input.Label>
          <Input.Wrapper>
            <Input.Field
              name="minutes"
              type="number"
              step="0.1"
              min={0}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </Input.Wrapper>
        </Input.Root>
      </div>

      {error && <p className={styles.inlineMessage}>{error}</p>}

      <Button.Root loading={isSubmitting}>Salvar corrida</Button.Root>
    </form>
  );
}

function LiveTracker({ onSaved }: { onSaved: (session: IRunningSession) => void }) {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Libera o GPS se o usuário sair desta tela (trocar de aba/rota) sem
  // clicar em "Finalizar" — sem isso, o rastreamento continuaria ligado
  // em segundo plano gastando bateria indefinidamente.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking]);

  function handleStart() {
    if (!("geolocation" in navigator)) {
      setPermissionError("Este navegador não oferece localização (GPS).");
      return;
    }

    setPermissionError(null);
    setDistanceMeters(0);
    setElapsedSeconds(0);
    lastPositionRef.current = null;
    startedAtRef.current = Date.now();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const current = { lat: position.coords.latitude, lng: position.coords.longitude };

        if (lastPositionRef.current) {
          const delta = haversineMeters(lastPositionRef.current, current);
          // Ignora saltos absurdos (> 100m entre leituras) — geralmente é
          // ruído de GPS, não deslocamento real do usuário correndo.
          if (delta < 100) {
            setDistanceMeters((previous) => previous + delta);
          }
        }

        lastPositionRef.current = current;
      },
      () => {
        setPermissionError(
          "Não conseguimos acessar sua localização. Verifique a permissão de GPS do navegador."
        );
        setIsTracking(false);
      },
      { enableHighAccuracy: true }
    );

    setIsTracking(true);
  }

  function stopWatching() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }

  async function handleFinish() {
    stopWatching();

    if (elapsedSeconds < 5) {
      setPermissionError("Corrida muito curta para ser salva (menos de 5 segundos).");
      setDistanceMeters(0);
      setElapsedSeconds(0);
      return;
    }

    setIsSaving(true);

    try {
      const result = await createRunningSessionAction({
        distanceMeters: Math.round(distanceMeters),
        durationSeconds: elapsedSeconds,
        source: "gps",
      });

      if (result.error) {
        setPermissionError(result.error);
        return;
      }

      setDistanceMeters(0);
      setElapsedSeconds(0);
      if (result.session) onSaved(result.session);
    } finally {
      setIsSaving(false);
    }
  }

  const distanceKm = distanceMeters / 1000;
  const paceMinPerKm = calculatePaceMinPerKm(distanceMeters, elapsedSeconds);

  return (
    <div className={styles.panel}>
      {permissionError && <p className={styles.inlineMessage}>{permissionError}</p>}

      <div className={styles.liveStats}>
        <div>
          <p className={styles.liveValue}>{formatClock(elapsedSeconds)}</p>
          <p className={styles.liveLabel}>Tempo</p>
        </div>
        <div>
          <p className={styles.liveValue}>{distanceKm.toFixed(2)} km</p>
          <p className={styles.liveLabel}>Distância</p>
        </div>
        <div>
          <p className={styles.liveValue}>{paceMinPerKm > 0 ? paceMinPerKm.toFixed(1) : "—"}</p>
          <p className={styles.liveLabel}>min/km</p>
        </div>
      </div>

      <div className={styles.liveControls}>
        {isTracking ? (
          <Button.Root className={styles.finishButton} loading={isSaving} onClick={handleFinish}>
            Finalizar corrida
          </Button.Root>
        ) : (
          <Button.Root onClick={handleStart}>Iniciar corrida com GPS</Button.Root>
        )}
      </div>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
