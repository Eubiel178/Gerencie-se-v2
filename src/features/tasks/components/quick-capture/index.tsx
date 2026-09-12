"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Modal, ModalHeader, Form, Input, Button } from "@/components";
import { Icon } from "@/components/icon";
import { useToast } from "@/providers/toast-context";

import { quickCaptureTaskAction } from "@/features/tasks/actions";

import styles from "./quick-capture.module.css";

/**
 * "Despejo mental" — botão sempre visível na sidebar que abre um modal
 * com um único campo: digitou, apertou Enter, virou tarefa. Nenhuma
 * outra decisão (tag/prioridade/data) é pedida aqui — quem quiser
 * refinar, edita a tarefa normalmente depois. O ponto é nunca deixar a
 * fricção de um formulário completo competir com o impulso de anotar
 * algo antes que se perca.
 */
export function QuickCapture({ triggerClassName }: { triggerClassName?: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function open() {
    setIsOpen(true);
    setTitle("");
    setError(null);
  }

  function close() {
    setIsOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await quickCaptureTaskAction(title);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    showToast("Capturado! Já vira uma tarefa em Tarefas.");
    close();
    router.refresh();
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={open}>
        <Icon name="MdOutlineEditNote" aria-hidden="true" />
        Capturar
      </button>

      {isOpen && (
        <Modal onClose={close}>
          <ModalHeader title="Despejo mental" onClose={close} />

          <Form.Root onSubmit={handleSubmit}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: error ?? undefined }}>
                <Input.Wrapper>
                  <Input.Field
                    ref={inputRef}
                    autoFocus
                    maxLength={200}
                    placeholder="O que tá passando pela cabeça?"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") close();
                    }}
                  />
                </Input.Wrapper>
                <Input.HelperText />
              </Input.Root>

              <p className={styles.hint}>
                Vira uma tarefa sem categoria/prioridade definida — ajuste depois, se quiser.
              </p>
            </Form.Wrapper>

            <Button.Root loading={isSubmitting}>Capturar</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}
