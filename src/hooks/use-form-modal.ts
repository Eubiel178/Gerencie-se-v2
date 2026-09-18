"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";

import type { ActionResult } from "@/types/action-result";

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
 */
export function useFormModal<
  TFormData extends FieldValues,
  TResult extends ActionResult = ActionResult,
>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
}: UseFormModalOptions<TFormData, TResult>) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<TFormData>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues,
  });

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setSubmitError(null);
    form.reset();
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

  return {
    ...form,
    isOpen,
    openModal,
    closeModal,
    submitError,
    handleFormSubmit,
  };
}
