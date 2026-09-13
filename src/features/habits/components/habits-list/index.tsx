"use client";

import { useState } from "react";
import dayjs from "dayjs";

import { Input } from "@/components";
import { IHabit } from "@/features/habits/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { GoalOption } from "../modal/interfaces";
import { filterHabits, HabitFrequencyFilter, HabitStatusFilter } from "@/features/habits/filter-habits";
import { Card } from "./card";

import styles from "../../habits.module.css";

const STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Feitos hoje", value: "done-today" },
  { label: "Pendentes hoje", value: "pending-today" },
];

const FREQUENCY_OPTIONS = [
  { label: "Todas", value: "all" },
  { label: "Todo dia", value: "daily" },
  { label: "Algumas vezes por semana", value: "weekly" },
];

interface HabitsListProps {
  habitsList: IHabit[];
  connections: LoadAcceptedConnections.Model;
  goalOptions: GoalOption[];
}

export function HabitsList({ habitsList, connections, goalOptions }: HabitsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<HabitFrequencyFilter>("all");
  const [statusFilter, setStatusFilter] = useState<HabitStatusFilter>("all");

  if (habitsList.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyState}>Você ainda não tem hábitos. Comece adicionando o primeiro.</p>
      </div>
    );
  }

  const today = dayjs().format("YYYY-MM-DD");
  const goalTitleById = new Map(goalOptions.map((goal) => [goal.id, goal.title]));
  const filteredHabits = filterHabits(habitsList, { searchQuery, frequencyFilter, statusFilter });

  return (
    <div className={styles.listWithFilters}>
      <div className={styles.searchRow}>
        <Input.Root>
          <Input.Wrapper>
            <Input.Field
              type="search"
              placeholder="Buscar por nome..."
              aria-label="Buscar hábitos por nome"
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
              onChange={(event) => setStatusFilter(event.target.value as HabitStatusFilter)}
            />
          </Input.Wrapper>
        </Input.Root>

        <Input.Root>
          <Input.Wrapper>
            <Input.FieldSelect
              aria-label="Filtrar por frequência"
              optionsArray={FREQUENCY_OPTIONS}
              value={frequencyFilter}
              onChange={(event) => setFrequencyFilter(event.target.value as HabitFrequencyFilter)}
            />
          </Input.Wrapper>
        </Input.Root>
      </div>

      {filteredHabits.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyState}>Nenhum hábito encontrado com esses filtros.</p>
        </div>
      ) : (
        <ul className={styles.grid}>
          {filteredHabits.map((habit) => (
            <Card
              key={habit.id}
              habit={habit}
              today={today}
              connections={connections}
              goalOptions={goalOptions}
              linkedGoalTitle={habit.goalId ? goalTitleById.get(habit.goalId) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
