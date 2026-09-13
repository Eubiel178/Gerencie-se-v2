"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Input } from "@/components";

import { createRunningSessionAction } from "@/features/running/actions";

import styles from "../running.module.css";

type Tab = "manual" | "gps";

// Distância entre duas coordenadas (fórmula de Haversine) — padrão pra
// medir distância sobre a superfície da Terra a partir de lat/long.
function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const EARTH_RADIUS_M = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function RunningTracker() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <div>
      <div className={styles.tabs}>
        <Button.Root
          className={tab === "manual" ? undefined : styles.tabButton}
          onClick={() => setTab("manual")}
        >
          Registro manual
        </Button.Root>
        <Button.Root
          className={tab === "gps" ? undefined : styles.tabButton}
          onClick={() => setTab("gps")}
        >
          GPS ao vivo
        </Button.Root>
      </div>

      {tab === "manual" ? (
        <ManualEntry onSaved={() => router.refresh()} />
      ) : (
        <LiveTracker onSaved={() => router.refresh()} />
      )}
    </div>
  );
}

function ManualEntry({ onSaved }: { onSaved: () => void }) {
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
      onSaved();
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

      <Button.Root loading={isSubmitting}>Salvar Corrida</Button.Root>
    </form>
  );
}

function LiveTracker({ onSaved }: { onSaved: () => void }) {
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
      await createRunningSessionAction({
        distanceMeters: Math.round(distanceMeters),
        durationSeconds: elapsedSeconds,
        source: "gps",
      });

      setDistanceMeters(0);
      setElapsedSeconds(0);
      onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  const distanceKm = distanceMeters / 1000;
  const paceMinPerKm = distanceKm > 0 ? elapsedSeconds / 60 / distanceKm : 0;

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
            Finalizar Corrida
          </Button.Root>
        ) : (
          <Button.Root onClick={handleStart}>Iniciar Corrida com GPS</Button.Root>
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
