export interface IAssistantPreferences {
  enabled: boolean;
  // Presença reduzida: o widget fica só como um ponto discreto, sem o
  // balão de fala aparecendo sozinho — o usuário abre quando quiser.
  reducedPresence: boolean;
}

export type GetAssistantPreferences = {
  getPreferences: () => Promise<IAssistantPreferences>;
};

export type UpdateAssistantPreferences = {
  updatePreferences: (params: Partial<IAssistantPreferences>) => Promise<void>;
};
