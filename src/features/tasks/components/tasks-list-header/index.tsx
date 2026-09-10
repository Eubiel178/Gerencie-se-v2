"use client";

import { useRouter, usePathname } from "next/navigation";
import { useParamsUrl } from "@/hooks/use-params-url";

import { Input } from "@/components";
import { AddTask } from "../modal";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import styles from "../../home-dashboard.module.css";

export function TasksListHeader({
  isGoogleConnected,
  connections,
}: {
  isGoogleConnected: boolean;
  connections: LoadAcceptedConnections.Model;
}) {
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
    <header className={styles.toolbar}>
      <div>
        <h1 className={styles.heading}>Suas tarefas</h1>
        <p className={styles.subheading}>Escolha a próxima ação e avance no seu ritmo.</p>
      </div>
      <div className={styles.filters}>
      <Input.Root>
        <Input.Wrapper>
          <Input.FieldSelect
            title="Listar tarefas por tag"
            optionsArray={listingTypeOptions}
            onChange={handleTag}
          />
        </Input.Wrapper>
      </Input.Root>
      <AddTask buttonText="Nova Tarefa" isGoogleConnected={isGoogleConnected} connections={connections} />
      </div>
    </header>
  );
}
