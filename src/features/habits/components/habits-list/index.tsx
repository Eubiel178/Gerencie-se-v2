import dayjs from "dayjs";

import { Feedback, Wrapper } from "@/components";

import { IHabit } from "@/features/habits/domain";
import { Card } from "./card";

import styles from "../../habits.module.css";

interface HabitsListProps {
  habitsList: IHabit[];
}

export function HabitsList({ habitsList }: HabitsListProps) {
  if (habitsList.length === 0) {
    return (
      <Wrapper className={styles.empty}>
        <Feedback>Você ainda não tem hábitos. Comece adicionando o primeiro.</Feedback>
      </Wrapper>
    );
  }

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <ul className={styles.grid}>
      {habitsList.map((habit) => (
        <Card key={habit.id} habit={habit} today={today} />
      ))}
    </ul>
  );
}
