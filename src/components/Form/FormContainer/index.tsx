import { FormHTMLAttributes } from "react";

interface FormContainerProps extends FormHTMLAttributes<HTMLFormElement> {
  isSubmitting: boolean;
  buttonLabel: string;
}

export const FormContainer = ({
  isSubmitting = false,
  onSubmit,
  buttonLabel,
  children,
}: FormContainerProps) => {
  return (
    <form
      className="flex flex-col gap-16 w-[20rem] max-w-[25rem]"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-6	">{children}</div>

      <button
        className="bg-sky-600 text-white p-2 disabled:opacity-25"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Carregando..." : buttonLabel}
      </button>
    </form>
  );
};
