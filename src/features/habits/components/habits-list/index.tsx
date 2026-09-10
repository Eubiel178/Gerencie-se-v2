import dayjs from "dayjs";

import { Feedback, Wrapper } from "@/components";

import { IHabit } from "@/features/habits/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { GoalOption } from "../modal/interfaces";
import { Card } from "./card";

import styles from "../../habits.module.css";

interface HabitsListProps {
  habitsList: IHabit[];
  connections: LoadAcceptedConnections.Model;
  goalOptions: GoalOption[];
}

export function HabitsList({ habitsList, connections, goalOptions }: HabitsListProps) {
  if (habitsList.length === 0) {
    return (
      <Wrapper className={styles.empty}>
        <Feedback>Você ainda não tem hábitos. Comece adicionando o primeiro.</Feedback>
      </Wrapper>
    );
  }

  const today = dayjs().format("YYYY-MM-DD");
  const goalTitleById = new Map(goalOptions.map((goal) => [goal.id, goal.title]));

  return (
    <ul className={styles.grid}>
      {habitsList.map((habit) => (
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
  );
}
