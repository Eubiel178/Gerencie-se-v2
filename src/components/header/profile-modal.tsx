"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/profile-schema";
import { updateProfileAction } from "@/features/profile/actions";
import { ProfileOverview } from "@/features/profile/get-profile-overview";
import { useToast } from "@/providers/toast-context";

import { Modal, ModalHeader, Form, Input, Button } from "..";

import styles from "./profile-modal.module.css";

interface FormData {
  name: string;
}

interface ProfileModalProps {
  user: { name: string | null; email: string | null; image: string | null };
  overview: ProfileOverview;
  onClose: () => void;
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

export function ProfileModal({ user, overview, onClose }: ProfileModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: { name: user.name ?? "" },
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

  return (
    <Modal className={styles.modal}>
      <ModalHeader title="Meu perfil" onClose={onClose} />

      <div className={styles.identity}>
        {user.image ? (
          <Image src={user.image} alt="" width={72} height={72} className={styles.avatar} />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">
            {initials(user.name)}
          </span>
        )}

        <p className={styles.name}>{user.name ?? "Minha conta"}</p>
        <p className={styles.email}>{user.email}</p>
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
              <Input.Label>Nome</Input.Label>
              <Input.Wrapper>
                <Input.Field {...register("name")} placeholder="Seu nome" />
              </Input.Wrapper>
              <Input.HelperText />
            </Input.Root>
          </Form.Wrapper>

          {submitError && <p className={styles.formError}>{submitError}</p>}

          <div className={styles.editActions}>
            <Button.Root variant="secondary" type="button" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button.Root>
            <Button.Root loading={isSubmitting}>Salvar</Button.Root>
          </div>
        </Form.Root>
      ) : (
        <Button.Root variant="secondary" onClick={() => setIsEditing(true)}>
          Editar nome
        </Button.Root>
      )}
    </Modal>
  );
}
