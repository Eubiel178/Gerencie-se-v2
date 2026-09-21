"use client";

import { useState } from "react";

import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ZodType } from "zod";

import { Button, Modal, ModalHeader } from "@/components";
import type { ActionResult } from "@/types/action-result";

import styles from "./use-form-modal.module.css";

interface UseFormModalOptions<
  TFormData extends FieldValues,
  TResult extends ActionResult = ActionResult,
> {
  schema: ZodType<TFormData>;
  defaultValues: DefaultValues<TFormData>;
  onSubmit: (data: TFormData) => Promise<TResult>;
  /** Atualiza somente a área afetada. Sem callback, mantém a revalidação
   * padrão para formulários cujo resultado altera dados do layout. */
  onSuccess?: (result: TResult) => void;
  /** Nome/título real do item sendo editado (ex.: `taskBeingEdited.title`)
   * — usado na pergunta de descarte, "Descartar as alterações em 'X'?".
   * Omitido em formulários de criação (ainda não existe um nome a citar):
   * a pergunta cai para "Descartar as alterações?". */
  discardConfirmLabel?: string;
}

/**
 * Molde repetido nos modais de criar/editar (tarefa, objetivo, hábito,
 * item de rotina, evento, ...): abrir/fechar, `useForm` com zodResolver,
 * `submitError`, e no submit — limpa erro, chama a Server Action, se der
 * erro mostra e para, senão fecha o modal e dá `router.refresh()`.
 * Centralizado aqui pra não divergir por acidente entre os modais (ver
 * auditoria de duplicação): cada modal só entra com o schema, os valores
 * padrão e a action a chamar; o resto do formulário (campos, layout)
 * continua inteiramente no componente.
 *
 * Também centraliza a confirmação de descarte: `requestClose` (usado no
 * `onClose` do `Modal`/`ModalHeader` no lugar de `closeModal` direto) só
 * fecha na hora se o formulário está limpo; se há alterações não salvas
 * (`formState.isDirty`), abre um segundo modal por cima perguntando antes
 * de descartar. `closeModal` continua existindo e fechando incondicional
 * — é o que roda depois de um submit bem-sucedido, onde não há nada pra
 * "descartar" (acabou de salvar).
 */
export function useFormModal<
  TFormData extends FieldValues,
  TResult extends ActionResult = ActionResult,
>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  discardConfirmLabel,
}: UseFormModalOptions<TFormData, TResult>) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const router = useRouter();

  const form = useForm<TFormData>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues,
  });
  // `formState` do react-hook-form é um Proxy que só passa a rastrear (e
  // atualizar) um campo depois que ALGUM render de verdade o lê — sem
  // isso, `isDirty` fica sempre `false`/não computado, porque nada nunca
  // "assina" essa chave. `requestClose` só lê `formState.isDirty` dentro
  // de um event handler (nunca durante o render), então sem essa leitura
  // aqui o Proxy nunca ativa o rastreamento. Precisa ser lido durante o
  // render — não basta ler dentro de uma função chamada depois.
  const { isDirty } = form.formState;

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setIsConfirmingDiscard(false);
    setSubmitError(null);
    form.reset(defaultValues);
  }

  /** Ponto único de saída pro X, Escape, clique fora e "Cancelar" — nunca
   * chame `closeModal` direto a partir desses gatilhos, ou a confirmação
   * de descarte é pulada. */
  function requestClose() {
    if (isDirty) {
      setIsConfirmingDiscard(true);
      return;
    }
    closeModal();
  }

  const handleFormSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);

    const result = await onSubmit(data);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    closeModal();
    if (onSuccess) {
      onSuccess(result);
    } else {
      router.refresh();
    }
  });

  const discardConfirmDialog = isConfirmingDiscard ? (
    <Modal onClose={() => setIsConfirmingDiscard(false)}>
      <ModalHeader
        title={
          discardConfirmLabel
            ? `Descartar as alterações em "${discardConfirmLabel}"?`
            : "Descartar as alterações?"
        }
        onClose={() => setIsConfirmingDiscard(false)}
      />

      <div className={styles.actions}>
        <Button.Root
          type="button"
          variant="secondary"
          onClick={() => setIsConfirmingDiscard(false)}
        >
          Continuar editando
        </Button.Root>
        <Button.Root type="button" tone="danger" onClick={closeModal}>
          Descartar
        </Button.Root>
      </div>
    </Modal>
  ) : null;

  return {
    ...form,
    isOpen,
    openModal,
    closeModal,
    requestClose,
    discardConfirmDialog,
    submitError,
    handleFormSubmit,
  };
}
