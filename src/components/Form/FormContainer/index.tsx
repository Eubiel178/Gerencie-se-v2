import { FormHTMLAttributes, ReactNode } from "react";

interface FormContainerProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  buttonLabel: string;
}

export const FormContainer = ({
  children,
  onSubmit,
  buttonLabel,
}: FormContainerProps) => {
  return (
    <form
      className="flex flex-col gap-16 w-[20rem] max-w-[25rem]"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-6	">{children}</div>

      <button className="bg-sky-600 text-white p-2">{buttonLabel}</button>
    </form>
  );
};
