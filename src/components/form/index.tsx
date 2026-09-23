import { FormRoot } from "./form-root";
import { FormWrapper } from "./form-wrapper";
import { Input } from "./input";

export const Form = {
  Root: FormRoot,
  Wrapper: FormWrapper,
  // Input mora fisicamente dentro de Form (form/input/) — quase todo
  // input do app só existe dentro de um formulário. Continua também
  // exportado separado (`Input`, ver components/index.ts) pra não
  // quebrar quem já usa `Input.Field` direto.
  Input,
};
