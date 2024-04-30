"use client";

import { useRouter, usePathname } from "next/navigation";
import { useParamsUrl } from "@/@core/presentation/hooks/use-params-url";

import { Input, Wrapper } from "@/components/_ui";
import { AddTask } from "../modal";

export function TasksListHeader() {
  const router = useRouter();
  const pathaname = usePathname();
  const paramsUrl = useParamsUrl();

  function handleTag(event: React.ChangeEvent<HTMLSelectElement>) {
    return router.push(
      pathaname + paramsUrl.createQueryString("tag", event.target.value)
    );
  }

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
            onChange={handleTag}
          />
        </Input.Wrapper>
      </Input.Root>

      <AddTask buttonText="Nova Tarefa" />
    </Wrapper>
  );
}
