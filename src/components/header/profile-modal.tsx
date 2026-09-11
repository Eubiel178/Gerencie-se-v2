"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/profile-schema";
import { updateProfileAction } from "@/features/profile/actions";
import { useToast } from "@/providers/toast-context";

import { Modal, ModalHeader, Form, Input, Button } from "..";

import styles from "./profile-modal.module.css";

interface FormData {
  name: string;
}

interface ProfileModalProps {
  user: { name: string | null; email: string | null; image: string | null };
  onClose: () => void;
}

export function ProfileModal({ user, onClose }: ProfileModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    onClose();
  }

  return (
    <Modal>
      <ModalHeader title="Meu perfil" onClose={onClose} />

      <div className={styles.avatarRow}>
        {user.image ? (
          <Image src={user.image} alt="" width={56} height={56} className={styles.avatar} />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true" />
        )}

        <p className={styles.email}>{user.email}</p>
      </div>

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

        <Button.Root loading={isSubmitting}>Salvar</Button.Root>
      </Form.Root>
    </Modal>
  );
}
