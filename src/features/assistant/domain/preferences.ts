export interface IAssistantPreferences {
  enabled: boolean;
  // Presença reduzida: o widget fica só como um ponto discreto, sem o
  // balão de fala aparecendo sozinho — o usuário abre quando quiser.
  reducedPresence: boolean;
  // Fala automática do Companion (TTS espontâneo, ver
  // `features/execution-companion/domain/companion-phrasing.ts`).
  // Desligar isso nunca remove o balão escrito, só o áudio — mutável
  // rapidamente pelo próprio mascote, sem precisar abrir Configurações.
  autoSpeechEnabled: boolean;
  // Convite único "quer que eu fale às vezes?" já foi mostrado/respondido
  // (ver `VoiceOnboardingPrompt`) — nunca reaparece depois disso.
  autoSpeechPromptShown: boolean;
  // Introdução contextual da Execução Acompanhada ("Começar" numa tarefa)
  // já foi mostrada na PRIMEIRA vez - ver `isFirstEver` em
  // `companion-phrasing.ts`. Nunca reaparece depois disso, mesmo em
  // tarefas/sessões futuras.
  executionIntroShown: boolean;
}

export type GetAssistantPreferences = {
  getPreferences: () => Promise<IAssistantPreferences>;
};

export type UpdateAssistantPreferences = {
  updatePreferences: (params: Partial<IAssistantPreferences>) => Promise<void>;
};
