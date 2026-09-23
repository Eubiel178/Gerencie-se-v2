import { useEffect, useRef, useState } from "react";

// Tempo curto de propósito - é só um reconhecimento visual de "isso
// mudou agora", não uma transição de conteúdo (o texto em si troca na
// hora, sempre - ver comentário em `styles.module.css`).
const PULSE_MS = 220;

/**
 * `true` por um instante logo depois que `value` MUDA de verdade -
 * NUNCA no primeiro render (evita todo card da lista "piscando" ao
 * carregar a página, que era o efeito colateral do `key`+`animation` de
 * antes: remontar o elemento tocava a entrada em TODO mount, inclusive o
 * primeiro, e como todo card monta ao mesmo tempo, a impressão era de
 * conteúdo trocando de lugar entre cards vizinhos). Compara o VALOR, não
 * a referência - só pulsa quando o status/ação primária realmente muda
 * de categoria (ex.: "paused" → "executing"), nunca a cada re-render.
 */
export function usePulseOnChange<T>(value: T): boolean {
  const [pulsing, setPulsing] = useState(false);
  const previousRef = useRef(value);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousRef.current = value;
      return;
    }

    if (previousRef.current === value) return;
    previousRef.current = value;

    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), PULSE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return pulsing;
}
