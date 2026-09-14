"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Button, Form, Input } from "@/components";
import { formatFileSize, MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/upload-limits";
import { validationSchema } from "@/validation/profile-schema";
import { updateAvatarAction, updateProfileAction } from "@/features/profile/actions";
import { ProfileOverview } from "@/features/profile/get-profile-overview";
import { Gender } from "@/features/profile/get-gender";
import { useToast } from "@/providers/toast-context";

import styles from "./account-panel.module.css";

interface FormData {
  name: string;
  gender: Gender;
}

const GENDER_OPTIONS = [
  { label: "Prefiro não dizer", value: "nao_informado" },
  { label: "Feminino", value: "feminino" },
  { label: "Masculino", value: "masculino" },
];

interface AccountPanelProps {
  user: { name: string | null; email: string | null; image: string | null };
  gender: Gender;
  overview: ProfileOverview;
}

function initials(name: string | null): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  let result = parts[0].slice(0, 2);

  if (parts.length > 1) {
    result = result + parts[1][0];
  }

  return result.toUpperCase();
}

export function AccountPanel({ user, gender, overview }: AccountPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  // Preview LOCAL (via `URL.createObjectURL`, mostrado na hora, antes de
  // qualquer resposta do servidor) - sem isso, escolher um arquivo não
  // dava feedback visual nenhum até o upload+`router.refresh()`
  // terminarem (achado relatado: "não consigo ver o preview quando
  // troco"). Só é limpo quando `user.image` (vindo do servidor) muda de
  // verdade pra outra coisa - nunca antes disso, pra não "piscar" de
  // volta pra foto antiga no meio do caminho.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  // Ajuste de estado durante a renderização (não em `useEffect`), padrão
  // recomendado pra "resetar estado quando uma prop muda" - evita o
  // re-render em cascata que um `useEffect` chamando `setState` causaria.
  const [previousUserImage, setPreviousUserImage] = useState(user.image);
  if (user.image !== previousUserImage) {
    setPreviousUserImage(user.image);
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  // Revoga o blob pendente se o componente desmontar no meio do upload
  // (ex.: navegou pra outra categoria de Configurações) - sem isso, a
  // URL fica presa em memória até a aba fechar.
  useEffect(() => {
    return () => {
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return current;
      });
    };
  }, []);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: { name: user.name ?? "", gender },
  });

  async function handleFormSubmit(data: FormData) {
    setSubmitError(null);

    const result = await updateProfileAction(data);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    showToast("Perfil atualizado!");
    router.refresh();
    setIsEditing(false);
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setAvatarError(null);
    setIsUploadingAvatar(true);

    // Mostra o arquivo escolhido IMEDIATAMENTE (antes do upload em si
    // terminar) - `URL.createObjectURL` lê o arquivo direto do disco,
    // sem precisar de rede. Revoga o blob anterior (se houver) pra não
    // vazar memória a cada troca.
    setLocalPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });

    try {
      const formData = new FormData();
      formData.set("avatar", file);

      const result = await updateAvatarAction(formData);

      if (result.error) {
        setAvatarError(result.error);
        setLocalPreview((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return null;
        });
        return;
      }

      showToast("Foto atualizada!");
      router.refresh();
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.identity}>
        <div className={styles.avatarArea}>
          {localPreview || user.image ? (
            // `<img>` simples (não `next/image`): o preview local usa uma
            // URL `blob:`, que o otimizador de imagem do Next não aceita -
            // como o avatar é pequeno (72px) e não crítico pra
            // performance, usar `<img>` sempre (também pro caso da URL
            // real) evita ramificar a lógica pra um caso e outro.
            // eslint-disable-next-line @next/next/no-img-element -- preview local via blob: URL, next/image não aceita esse esquema
            <img src={localPreview ?? user.image!} alt="" width={72} height={72} className={styles.avatar} />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              {initials(user.name)}
            </span>
          )}

          <button
            type="button"
            className={styles.avatarEditButton}
            aria-label="Alterar foto de perfil"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? "..." : "Alterar"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className={styles.avatarInput}
            onChange={handleAvatarChange}
          />
        </div>

        <p className={styles.name}>{user.name ?? "Minha conta"}</p>
        <p className={styles.email}>{user.email}</p>
        <p className={styles.avatarHint}>
          JPEG, PNG, WebP ou HEIC, até {formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}.
        </p>

        {avatarError && <Alert variant="error">{avatarError}</Alert>}
      </div>

      <div>
        <h3 className={styles.sectionTitle}>Visão geral (7 dias)</h3>

        <div className={styles.overviewGrid}>
          <div className={styles.overviewTile}>
            <p className={styles.overviewValue}>{overview.tasksCompletedThisWeek}</p>
            <p className={styles.overviewLabel}>Tarefas concluídas</p>
          </div>

          <div className={styles.overviewTile}>
            <p className={styles.overviewValue}>{overview.completionRate}%</p>
            <p className={styles.overviewLabel}>Taxa de conclusão</p>
          </div>

          <div className={styles.overviewTile}>
            <p className={styles.overviewValue}>{overview.focusHours}h</p>
            <p className={styles.overviewLabel}>Horas de foco</p>
          </div>

          <div className={styles.overviewTile}>
            <p className={styles.overviewValue}>
              {overview.bestHabitStreak} {overview.bestHabitStreak === 1 ? "dia" : "dias"}
            </p>
            <p className={styles.overviewLabel}>Melhor sequência</p>
          </div>
        </div>
      </div>

      {isEditing ? (
        <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
          <Form.Wrapper>
            <Input.Root sharedProps={{ error: errors.name?.message }}>
              <Input.Label htmlFor="name">Nome</Input.Label>
              <Input.Wrapper>
                <Input.Field {...register("name")} placeholder="Seu nome" />
              </Input.Wrapper>
              <Input.HelperText />
            </Input.Root>

            <Input.Root sharedProps={{ error: errors.gender?.message }}>
              <Input.Label htmlFor="gender">Gênero</Input.Label>
              <Input.Wrapper>
                <Input.FieldSelect {...register("gender")} optionsArray={GENDER_OPTIONS} />
              </Input.Wrapper>
              <Input.HelperText />
            </Input.Root>
          </Form.Wrapper>

          {submitError && <Alert variant="error">{submitError}</Alert>}

          <div className={styles.editActions}>
            <Button.Root variant="secondary" type="button" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button.Root>
            <Button.Root loading={isSubmitting}>Salvar</Button.Root>
          </div>
        </Form.Root>
      ) : (
        <Button.Root variant="secondary" onClick={() => setIsEditing(true)}>
          Editar perfil
        </Button.Root>
      )}
    </div>
  );
}
