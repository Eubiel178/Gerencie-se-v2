"use client";

import { useRef, useState } from "react";
import Image from "next/image";
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

    try {
      const formData = new FormData();
      formData.set("avatar", file);

      const result = await updateAvatarAction(formData);

      if (result.error) {
        setAvatarError(result.error);
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
          {user.image ? (
            <Image src={user.image} alt="" width={72} height={72} className={styles.avatar} />
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
