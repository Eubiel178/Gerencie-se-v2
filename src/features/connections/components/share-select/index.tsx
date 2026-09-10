import { Input } from "@/components";
import { LoadAcceptedConnections } from "@/features/connections/domain";

interface ShareSelectProps extends Omit<React.ComponentProps<typeof Input.FieldSelect>, "optionsArray"> {
  connections: LoadAcceptedConnections.Model;
}

/**
 * Select de "compartilhar com" reutilizado por tarefas, rotina, hábitos e
 * metas — sempre as mesmas opções (ninguém + cada conexão aceita), só
 * muda o `register(...)` de cada formulário. Se não há ninguém conectado
 * ainda, mostra só a opção "Não compartilhada" (sem quebrar o formulário).
 */
export function ShareSelect({ connections, ...rest }: ShareSelectProps) {
  const options = [
    { label: "Não compartilhada", value: "" },
    ...connections.map((connection) => ({ label: connection.label, value: connection.userId })),
  ];

  return <Input.FieldSelect optionsArray={options} {...rest} />;
}
