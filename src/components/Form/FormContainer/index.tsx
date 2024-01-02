import { VariantProps, tv } from "tailwind-variants";
import { FormHTMLAttributes } from "react";

const form = tv({
  slots: {
    base: "gap-16 w-[20rem] max-w-[25rem]",
    fieldContainer: "gap-6",
    button: "text-white p-2",
  },

  variants: {
    disabled: {
      true: {
        button: "opacity-50 bg-gray-500 pointer-events-none",
      },
      false: { button: "bg-sky-600" },
    },
  },

  compoundSlots: [
    {
      slots: ["base", "fieldContainer"],
      className: "flex flex-col",
    },
  ],
});

interface FormContainerProps
  extends FormHTMLAttributes<HTMLFormElement>,
    VariantProps<typeof form> {
  isSubmitting: boolean;
  buttonLabel: string;
}

export const FormContainer = ({
  isSubmitting = false,
  onSubmit,
  buttonLabel,
  children,
}: FormContainerProps) => {
  const { base, fieldContainer, button } = form();

  return (
    <form className={base()} onSubmit={onSubmit}>
      <div className={fieldContainer()}>{children}</div>

      <button
        className={button({ disabled: isSubmitting })}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Carregando..." : buttonLabel}
      </button>
    </form>
  );
};
