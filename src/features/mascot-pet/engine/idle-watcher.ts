const DEFAULT_IDLE_THRESHOLD_MS = 5 * 60 * 1000;

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "scroll"] as const;

/**
 * Observa atividade do usuário na página inteira (não só no mascote) -
 * qualquer clique/tecla/rolagem reseta a contagem. Depois de `thresholdMs`
 * sem nenhuma atividade, chama `onIdle()` e volta a contar do zero (então
 * "ficou parado" pode disparar de novo se a pessoa continuar ausente).
 * Retorna uma função de limpeza.
 */
export function watchUserIdle(onIdle: () => void, thresholdMs = DEFAULT_IDLE_THRESHOLD_MS): () => void {
  let timer: ReturnType<typeof setTimeout>;

  function scheduleNext() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      onIdle();
      scheduleNext();
    }, thresholdMs);
  }

  function handleActivity() {
    scheduleNext();
  }

  scheduleNext();
  for (const eventName of ACTIVITY_EVENTS) {
    window.addEventListener(eventName, handleActivity, { passive: true });
  }

  return () => {
    clearTimeout(timer);
    for (const eventName of ACTIVITY_EVENTS) {
      window.removeEventListener(eventName, handleActivity);
    }
  };
}
