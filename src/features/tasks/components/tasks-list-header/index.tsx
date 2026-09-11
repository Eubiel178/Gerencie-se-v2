"use client";

import { useRouter, usePathname } from "next/navigation";
import { useParamsUrl } from "@/hooks/use-params-url";

import { Input, ChipGroup } from "@/components";
import { AddTask } from "../modal";
import { PRIORITY_OPTIONS } from "../modal/interfaces";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { useTaskStore } from "@/features/tasks/task-store";
import styles from "../../home-dashboard.module.css";

const STATUS_OPTIONS = [
  { label: "Todas", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Concluídas", value: "completed" },
  { label: "Atrasadas", value: "overdue" },
];

const PRIORITY_FILTER_OPTIONS = [{ label: "Todas", value: "all" }, ...PRIORITY_OPTIONS];

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

  const searchQuery = useTaskStore((state) => state.searchQuery);
  const setSearchQuery = useTaskStore((state) => state.setSearchQuery);
  const statusFilter = useTaskStore((state) => state.statusFilter);
  const setStatusFilter = useTaskStore((state) => state.setStatusFilter);
  const priorityFilter = useTaskStore((state) => state.priorityFilter);
  const setPriorityFilter = useTaskStore((state) => state.setPriorityFilter);

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
    <>
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

      <div className={styles.searchRow}>
        <Input.Root>
          <Input.Wrapper>
            <Input.Field
              type="search"
              placeholder="Buscar por título..."
              aria-label="Buscar tarefas por título"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </Input.Wrapper>
        </Input.Root>

        <ChipGroup
          aria-label="Filtrar por status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as typeof statusFilter)}
        />

        <ChipGroup
          aria-label="Filtrar por prioridade"
          options={PRIORITY_FILTER_OPTIONS}
          value={priorityFilter}
          onChange={(value) => setPriorityFilter(value as typeof priorityFilter)}
        />
      </div>
    </>
  );
}
