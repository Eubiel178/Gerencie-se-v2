"use client";

import { useRouter, usePathname } from "next/navigation";
import { useParamsUrl } from "@/hooks/use-params-url";

import { Input } from "@/components";
import { Icon } from "@/components/icon";
import { AddTask } from "../modal";
import { PRIORITY_OPTIONS } from "../modal/interfaces";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { useTaskStore } from "@/features/tasks/task-store";
import styles from "../shared/styles.module.css";

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
  const lowEnergyMode = useTaskStore((state) => state.lowEnergyMode);
  const setLowEnergyMode = useTaskStore((state) => state.setLowEnergyMode);

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
              title="Listar tarefas por tipo"
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

        <Input.Root>
          <Input.Wrapper>
            <Input.FieldSelect
              aria-label="Filtrar por status"
              optionsArray={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            />
          </Input.Wrapper>
        </Input.Root>

        <Input.Root>
          <Input.Wrapper>
            <Input.FieldSelect
              aria-label="Filtrar por prioridade"
              optionsArray={PRIORITY_FILTER_OPTIONS}
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
            />
          </Input.Wrapper>
        </Input.Root>

        <button
          type="button"
          className={styles.lowEnergyToggle}
          data-active={lowEnergyMode}
          aria-pressed={lowEnergyMode}
          aria-describedby="low-energy-hint"
          title="Modo de baixa energia: esconde tarefas de prioridade alta/crítica"
          onClick={() => setLowEnergyMode(!lowEnergyMode)}
        >
          <Icon name="FaBatteryQuarter" aria-hidden="true" />
          Baixa energia
        </button>
      </div>

      {/* Texto visível (não só o tooltip nativo do `title`, que some no
          toque/celular e é fácil de nunca notar) - explica o que o modo
          faz assim que é ativado, quando mais importa (tarefas somem da
          lista e a pessoa pode achar que é um bug). */}
      {lowEnergyMode && (
        <p id="low-energy-hint" className={styles.lowEnergyHint}>
          <Icon name="FaBatteryQuarter" aria-hidden="true" />
          Modo de baixa energia ativo: tarefas de prioridade alta e crítica ficam escondidas, pra sobrar só o que dá pra encarar agora.
        </p>
      )}
    </>
  );
}
