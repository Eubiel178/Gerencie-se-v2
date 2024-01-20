import { Button, Input, Wrapper } from "@/components/_ui";

export const TasksListHeader = () => {
  const listingTypeOptions = [
    { label: "Todos", value: "all" },
    { label: "Estudos", value: "studie" },
    { label: "Trabalhos", value: "work" },
    { label: "Exercícios", value: "exercise" },
    { label: "Outros", value: "other" },
  ];

  return (
    <Wrapper justify="between" align="stretch">
      <Input.Root>
        <Input.Wrapper>
          <Input.FieldSelect
            title="Listar tarefas por tag"
            optionsArray={listingTypeOptions}
          />
        </Input.Wrapper>
      </Input.Root>

      <Button type="button">Novo</Button>
    </Wrapper>
  );
};
