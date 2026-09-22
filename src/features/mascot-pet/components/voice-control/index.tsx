"use client";

import { Icon } from "@/components/icon";

import styles from "./styles.module.css";

interface VoiceControlProps {
  autoSpeechEnabled: boolean;
  /** Convite único "quer que eu fale às vezes?" - só `true` na primeiríssima
   * vez que faz sentido perguntar (ver `assistantAutoSpeechPromptShown`),
   * nunca de novo depois de respondido. Não é uma permissão de navegador
   * de verdade (TTS de saída não pede uma) - é só uma pergunta de produto,
   * uma vez, num momento real. */
  showPrompt: boolean;
  onToggle: () => void;
  onAnswerPrompt: (enable: boolean) => void;
}

/**
 * Controle PERSISTENTE e único de voz do Companion - fica sempre visível
 * (não só quando um balão aparece), num canto fixo da tela, do mesmo
 * jeito que o botão de mudo de um player de vídeo nunca se move. Evita
 * dois problemas do design anterior: (1) um botão de mudo redundante
 * dentro de CADA balão, que fazia a interação parecer um player de áudio;
 * (2) um ícone grudado no mascote que andaria pela tela junto com ele,
 * virando um alvo pequeno e inconstante.
 *
 * Controla a MESMA preferência (`autoSpeechEnabled`) usada em
 * Configurações - nunca uma flag de "mudo" paralela (evita duas
 * configurações que significam a mesma coisa).
 */
export function VoiceControl({
  autoSpeechEnabled,
  showPrompt,
  onToggle,
  onAnswerPrompt,
}: VoiceControlProps) {
  if (showPrompt) {
    return (
      <div className={styles.prompt} role="dialog" aria-label="Preferência de voz do Companion">
        <p className={styles.promptText}>Quer que eu fale às vezes, além de escrever?</p>
        <div className={styles.promptActions}>
          <button
            type="button"
            className={styles.promptButton}
            data-variant="primary"
            onClick={() => onAnswerPrompt(true)}
          >
            Quero
          </button>
          <button
            type="button"
            className={styles.promptButton}
            onClick={() => onAnswerPrompt(false)}
          >
            Só texto
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={autoSpeechEnabled ? "Silenciar fala do Companion" : "Ativar fala do Companion"}
      aria-pressed={!autoSpeechEnabled}
      onClick={onToggle}
    >
      <Icon
        name={autoSpeechEnabled ? "FaVolumeUp" : "FaVolumeMute"}
        aria-hidden="true"
        size={13}
      />
    </button>
  );
}
