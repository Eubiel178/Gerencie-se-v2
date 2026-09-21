"use client";

import { Alert, Button, Form, Input, Modal, ModalHeader } from "@/components";
import { updateHealthCheckupAction } from "@/features/health/actions";
import { IHealthCheckup } from "@/features/health/domain";
import { useFormModal } from "@/hooks/use-form-modal";
import { healthCheckupFormSchema, HealthCheckupFormData } from "@/validation/health-schema";

interface EditCheckupProps {
  checkup: IHealthCheckup;
}

/** Faltava desde sempre: a camada de dados (`LocalHealth.update`) já
 * existia, mas não tinha Server Action nem UI nenhuma chamando — só dava
 * pra criar, marcar feito ou excluir. */
export function EditCheckup({ checkup }: EditCheckupProps) {
  const {
    register,
    formState: { errors, isSubmitting },
    isOpen,
    openModal,
    closeModal,
    submitError,
    handleFormSubmit,
  } = useFormModal<HealthCheckupFormData>({
    schema: healthCheckupFormSchema,
    defaultValues: {
      title: checkup.title,
      category: checkup.category,
      intervalDays: checkup.intervalDays ? String(checkup.intervalDays) : "",
      notes: checkup.notes ?? "",
    },
    onSubmit: (data) =>
      updateHealthCheckupAction({
        id: checkup.id,
        title: data.title,
        category: data.category,
        intervalDays: data.intervalDays ? Number(data.intervalDays) : null,
        notes: data.notes || null,
      }),
  });

  return (
    <>
      <Button.Preset
        icon={{ name: "FaEdit" }}
        root={{ tone: "highlight", "aria-label": `Editar ${checkup.title}`, onClick: openModal }}
      />

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Editar cuidado" onClose={closeModal} />

          <Form.Root onSubmit={handleFormSubmit}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Label htmlFor="title">Nome</Input.Label>
                <Input.Wrapper>
                  <Input.Field {...register("title")} placeholder="Ex.: Exame de vista" autoFocus />
                </Input.Wrapper>
                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.category?.message }}>
                <Input.Label htmlFor="category">Categoria</Input.Label>
                <Input.Wrapper>
                  <Input.Field {...register("category")} placeholder="Ex.: Check-up" />
                </Input.Wrapper>
                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.intervalDays?.message }}>
                <Input.Label htmlFor="intervalDays">Repetir a cada quantos dias (opcional)</Input.Label>
                <Input.Wrapper>
                  <Input.Field {...register("intervalDays")} type="number" min={1} />
                </Input.Wrapper>
                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.notes?.message }}>
                <Input.Label htmlFor="notes">Notas (opcional)</Input.Label>
                <Input.Wrapper>
                  <Input.FieldTextarea {...register("notes")} placeholder="Alguma observação..." rows={3} />
                </Input.Wrapper>
                <Input.HelperText />
              </Input.Root>
            </Form.Wrapper>

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <Button.Root loading={isSubmitting}>Salvar alterações</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}
