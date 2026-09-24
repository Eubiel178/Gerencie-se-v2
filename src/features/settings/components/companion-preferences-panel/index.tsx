"use client";

import { useState } from "react";

import { Button, Icon, Input, SwitchRow } from "@/components";
import { updateAssistantPreferencesAction } from "@/features/assistant/actions";
import { IAssistantPreferences } from "@/features/assistant/domain";
import { updateMascotAction } from "@/features/focus/actions";
import { getMascotVoicePreview, IMascotState, MascotPersonality, MascotSpecies } from "@/features/focus/domain";
import { MascotPreview, characterIdForSpecies } from "@/features/mascot-pet";
import { useSpeak } from "@/lib/speech/speak-text";
import { SPEECH_VOICES, SpeechVoiceId } from "@/lib/speech/voices";
import { useToast } from "@/providers/toast-context";
import { validationSchema } from "@/validation/mascot-schema";

import styles from "./styles.module.css";

const PERSONALITY_OPTIONS = [
  { label: "Afetuoso", value: "afetuoso" },
  { label: "Sarcástico", value: "sarcastico" },
  { label: "Engraçado", value: "engracado" },
  { label: "Motivador", value: "motivador" },
  { label: "Zen", value: "zen" },
];

const SPECIES_OPTIONS = [
  { label: "Gato", value: "gato" },
  { label: "Shiba", value: "cachorro" },
  { label: "Pássaro", value: "passaro" },
  { label: "Urso", value: "urso" },
  { label: "Raposa", value: "raposa" },
  { label: "Panda", value: "panda" },
  { label: "Golden Retriever", value: "golden" },
  { label: "Akita", value: "akita" },
  { label: "Dogue Alemão", value: "dogue-alemao" },
  { label: "Gato Preto", value: "gato-preto" },
  { label: "Gato Angorá", value: "gato-angora" },
  { label: "Gato Cinza", value: "gato-tabby" },
  { label: "Gato Laranja", value: "gato-laranja" },
  { label: "Gato Lilás", value: "gato-lilas" },
  { label: "Gato Siamês", value: "gato-siames" },
];

type SavingOperation = "identity" | "behavior" | "voice" | null;

interface CompanionPreferencesPanelProps {
  mascot: IMascotState;
  preferences: IAssistantPreferences;
}

/**
 * Tela única de configuração do companheiro (mascote + assistente + voz).
 * Antes eram três formulários independentes (um com "Salvar", um com
 * autosave por toggle e outro com "Salvar voz") — aqui tudo persiste
 * sozinho com um único indicador discreto de "Salvo" e toast só em erro.
 *
 * Persistência:
 * - Nome salva no blur/Enter (nunca a cada tecla); espécie/personalidade e
 *   voz salvam no change.
 * - Preferências liga/desliga persistem já no clique (otimista, desfaz em
 *   erro).
 * - Tudo segue o mesmo padrão de sincronização: compara o valor vindo do
 *   servidor com o último valor SALVO (não com o rascunho), adotando
 *   mudanças externas sem pisar em edição em andamento do usuário.
 *
 * Progressão: as opções "Presença reduzida" e "Falar automaticamente" só
 * fazem sentido com o Companion ativo — aparecem aninhadas sob o switch
 * enquanto ele estiver ligado (a relação fica explícita pelo encaixe).
 */
export function CompanionPreferencesPanel({ mascot, preferences }: CompanionPreferencesPanelProps) {
  const { isSpeaking, speak } = useSpeak();
  const { showToast } = useToast();

  const [savedMascot, setSavedMascot] = useState(mascot);
  const [name, setName] = useState(mascot.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [species, setSpecies] = useState<MascotSpecies>(mascot.species);
  const [personality, setPersonality] = useState<MascotPersonality>(mascot.personality);

  const [savedPrefs, setSavedPrefs] = useState(preferences);
  const [prefs, setPrefs] = useState(preferences);
  const [savedVoice, setSavedVoice] = useState(preferences.voiceId);
  const [voice, setVoice] = useState(preferences.voiceId);

  const [saving, setSaving] = useState<SavingOperation>(null);
  const [savedFlashCounter, setSavedFlashCounter] = useState(0);

  // Sincronização servidor → local por IDENTIDADE do objeto (mesmo padrão
  // do PreferencesPanel antigo): só quando o Server Component manda um
  // objeto NOVO (refresh pós-ação, outra aba) é que a gente adota os
  // valores. Comparar campo a campo a cada render prendia um loop: o
  // `setState` de sync mudava o estado derivado sem estabilizar o próprio
  // guard, e cada re-render disparava outro sync ("Too many re-renders" ao
  // desligar o Companion).
  const [serverMascot, setServerMascot] = useState(mascot);
  if (mascot !== serverMascot) {
    setServerMascot(mascot);
    // Adota por campo usando o último valor SALVO como referência (nunca o
    // rascunho): uma mudança externa vence, mas um nome digitado ainda não
    // salvo não é pisado por um refresh de outra preferência.
    if (mascot.name !== savedMascot.name) {
      setSavedMascot((current) => ({ ...current, name: mascot.name }));
      setName(mascot.name);
    }
    if (mascot.species !== savedMascot.species) {
      setSavedMascot((current) => ({ ...current, species: mascot.species }));
      setSpecies(mascot.species);
    }
    if (mascot.personality !== savedMascot.personality) {
      setSavedMascot((current) => ({ ...current, personality: mascot.personality }));
      setPersonality(mascot.personality);
    }
  }

  const [serverPrefs, setServerPrefs] = useState(preferences);
  if (preferences !== serverPrefs) {
    setServerPrefs(preferences);
    setPrefs(preferences);
    setSavedPrefs(preferences);
    setSavedVoice(preferences.voiceId);
    setVoice(preferences.voiceId);
  }

  function flashSaved() {
    setSavedFlashCounter((count) => count + 1);
  }

  function reportError(message: string) {
    showToast(message, "error");
  }

  async function saveName() {
    const parsed = validationSchema.shape.name.safeParse(name);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0].message);
      return;
    }
    setNameError(null);
    if (name === savedMascot.name || saving === "identity") return;

    setSaving("identity");
    const result = await updateMascotAction({ name });
    setSaving(null);

    if (result.error) {
      reportError(result.error);
      return;
    }
    setSavedMascot((current) => ({ ...current, name }));
    flashSaved();
  }

  async function saveSpecies(next: MascotSpecies) {
    if (saving === "identity" || next === savedMascot.species) return;

    setSaving("identity");
    const result = await updateMascotAction({ species: next });
    setSaving(null);

    if (result.error) {
      reportError(result.error);
      return;
    }
    setSavedMascot((current) => ({ ...current, species: next }));
    setSpecies(next);
    flashSaved();
  }

  async function savePersonality(next: MascotPersonality) {
    if (saving === "identity" || next === savedMascot.personality) return;

    setSaving("identity");
    const result = await updateMascotAction({ personality: next });
    setSaving(null);

    if (result.error) {
      reportError(result.error);
      return;
    }
    setSavedMascot((current) => ({ ...current, personality: next }));
    setPersonality(next);
    flashSaved();
  }

  type BehaviorKey = "enabled" | "reducedPresence" | "autoSpeechEnabled";

  async function toggleBehavior(key: BehaviorKey, value: boolean) {
    if (saving === "behavior" || value === savedPrefs[key]) return;

    // Otimista: reflete o clique antes de o servidor confirmar.
    setPrefs((current) => ({ ...current, [key]: value }));
    setSaving("behavior");
    const patch: Partial<IAssistantPreferences> = { [key]: value };
    const result = await updateAssistantPreferencesAction(patch);
    setSaving(null);

    if (result.error) {
      // Falha real: desfaz o otimismo, senão o switch mentiria.
      setPrefs((current) => ({ ...current, [key]: !value }));
      reportError(result.error);
      return;
    }
    setSavedPrefs((current) => ({ ...current, [key]: value }));
    flashSaved();
  }

  async function handleVoiceChange(next: SpeechVoiceId) {
    if (saving === "voice") return;
    setVoice(next);
    if (next === savedVoice) return;

    setSaving("voice");
    const result = await updateAssistantPreferencesAction({ voiceId: next });
    setSaving(null);

    if (result.error) {
      setVoice(savedVoice);
      reportError(result.error);
      return;
    }
    setSavedVoice(next);
    flashSaved();
  }

  const identitySaving = saving === "identity";
  const behaviorSaving = saving === "behavior";

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Seu companheiro</h3>
        <SavedFeedback count={savedFlashCounter} />
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Como ele é</p>
        <div className={styles.identity}>
          <div className={styles.preview}>
            <MascotPreview
              characterId={characterIdForSpecies(species)}
              scale={1}
              label="Prévia do mascote"
            />
          </div>
          <div className={styles.identityFields}>
            <Input.Root sharedProps={{ error: nameError ?? undefined }}>
              <Input.Label htmlFor="name">Nome</Input.Label>
              <Input.Wrapper>
                <Input.Field
                  name="name"
                  value={name}
                  disabled={identitySaving}
                  placeholder="Chunchumaru"
                  autoComplete="off"
                  maxLength={24}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (nameError) setNameError(null);
                  }}
                  onBlur={() => void saveName()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void saveName();
                    }
                  }}
                />
              </Input.Wrapper>
              <Input.HelperText />
            </Input.Root>

            <Input.Root>
              <Input.Label htmlFor="species">Espécie</Input.Label>
              <Input.Wrapper>
                <Input.FieldSelect
                  name="species"
                  optionsArray={SPECIES_OPTIONS}
                  value={species}
                  disabled={identitySaving}
                  onChange={(event) => {
                    setSpecies(event.target.value as MascotSpecies);
                    void saveSpecies(event.target.value as MascotSpecies);
                  }}
                />
              </Input.Wrapper>
            </Input.Root>

            <Input.Root>
              <Input.Label htmlFor="personality">Personalidade</Input.Label>
              <Input.Wrapper>
                <Input.FieldSelect
                  name="personality"
                  optionsArray={PERSONALITY_OPTIONS}
                  value={personality}
                  disabled={identitySaving}
                  onChange={(event) => {
                    setPersonality(event.target.value as MascotPersonality);
                    void savePersonality(event.target.value as MascotPersonality);
                  }}
                />
              </Input.Wrapper>
            </Input.Root>
          </div>
        </div>
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Como ele age</p>
        <div className={styles.switches}>
          <SwitchRow
            title="Companion ativo"
            helper="Recebe sugestões durante o uso."
            checked={prefs.enabled}
            disabled={behaviorSaving}
            onChange={(value) => void toggleBehavior("enabled", value)}
          />
          {prefs.enabled && (
            <div className={styles.switchesNested}>
              <SwitchRow
                title="Presença reduzida"
                helper="Evita mensagens espontâneas."
                checked={prefs.reducedPresence}
                disabled={behaviorSaving}
                onChange={(value) => void toggleBehavior("reducedPresence", value)}
              />
              <SwitchRow
                title="Falar automaticamente"
                helper="O mascote pode falar algumas mensagens."
                checked={prefs.autoSpeechEnabled}
                disabled={behaviorSaving}
                onChange={(value) => void toggleBehavior("autoSpeechEnabled", value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Voz</p>
        <div className={styles.voiceRow}>
          <label className={styles.voiceLabel} htmlFor="voice">
            Voz do mascote
          </label>
          <select
            id="voice"
            className={styles.voiceSelect}
            value={voice}
            disabled={saving === "voice"}
            onChange={(event) => void handleVoiceChange(event.target.value as SpeechVoiceId)}
          >
            {SPEECH_VOICES.map((speechVoice) => (
              <option key={speechVoice.id} value={speechVoice.id}>
                {speechVoice.label}
              </option>
            ))}
          </select>
          <Button.Root
            type="button"
            variant="secondary"
            disabled={isSpeaking}
            onClick={() => void speak(getMascotVoicePreview(personality), { voice })}
          >
            <Icon name="FaVolumeUp" aria-hidden="true" />
            Ouvir
          </Button.Root>
        </div>
        <p className={styles.voiceHelper}>Vale para todas as falas do app.</p>
      </div>
    </div>
  );
}

/** Indicador discreto de persistência: mostra "Salvo" por um instante cada
 *  vez que o `count` muda e esvanece sozinho — aviso, não decoração. */
function SavedFeedback({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span key={count} className={styles.saved} role="status" aria-live="polite">
      Salvo
    </span>
  );
}