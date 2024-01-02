"use client";

import { DefaultLink, Input, Notification, TitleThree } from "@/components";
import { useState } from "react";
import { taskData } from "@/data/tasksData";
import { tv } from "tailwind-variants";

const home = tv({
  slots: {
    form: "flex items-stretch justify-between",
    formButton: "border-solid border-2 font-medium px-4",
    cardList: "flex flex-wrap gap-10",
    card: "min-w-72	w-full max-w-xs h-96 shadow rounded-ee-lg rounded-es-lg flex flex-col",
    cardColor: "h-32",
    cardContent: "flex-1 flex flex-col items-start justify-between p-3.5",
    cardTag: "mb-2 text-sm",
    cardDescription: "text-sm break-all mt-3",
  },

  variants: {
    color: {
      primary: {
        formButton: "bg-green-500 text-slate-100",
        card: "bg-white",
        cardColor: "bg-slate-500",
        cardTag: "text-blue-400",
        cardDescription: "text-gray-700",
      },
    },
  },

  defaultVariants: {
    color: "primary",
    size: "default",
  },
});

export interface TaskProps {
  id: string;
  tag: string;
  title: string;
  description: string;
}

const Home = () => {
  const [tasks, setTasks] = useState<TaskProps[]>(taskData);
  const [tips, setTips] = useState<string>(
    "Lembre-se de fazer pequenas pausas durante o trabalho para manter a produtividade."
  );
  const {
    form,
    formButton,
    cardList,
    card,
    cardColor,
    cardContent,
    cardTag,
    cardDescription,
  } = home();

  const handletips = (): void => {
    const tips = [
      "Lembre-se de fazer pequenas pausas durante o trabalho para manter a produtividade.",
      "Organize suas tarefas por prioridade para garantir que o mais importante seja feito primeiro.",
      "Use a técnica Pomodoro para dividir o trabalho em períodos de foco intenso intercalados com pausas.",
      "Mantenha sua área de trabalho limpa e organizada para reduzir distrações.",
      "Defina metas realistas para suas tarefas diárias e celebre suas conquistas.",
    ];

    setTips(tips[Math.floor(Math.random() * tips.length)]);
  };

  const handleListCards = () => {
    if (tasks.length === 0) {
      return <li></li>;
    } else {
      const tagJSON = {
        studie: "#Estudo",
        work: "#Trabalho",
        exercise: "#Exercício",
        other: "#Outros",
      };

      return tasks.map((element: TaskProps) => {
        const { id, tag, title, description } = element;

        return (
          <li key={id} className={card()}>
            <div className={cardColor()}></div>

            <div className={cardContent()}>
              <div>
                <span className={cardTag()}>{(tagJSON as any)[tag]}</span>

                <TitleThree>{title}</TitleThree>

                <p className={cardDescription()}>{description}</p>
              </div>

              <DefaultLink href={`home/${id}`}>Acessar</DefaultLink>
            </div>
          </li>
        );
      });
    }
  };

  return (
    <>
      <form className={form()}>
        <Input.Root>
          <Input.Div>
            <Input.FieldSelect
              optionsArray={[
                {
                  label: "Todos",
                  value: "all",
                },
                {
                  label: "Estudos",
                  value: "studie",
                },
                {
                  label: "Trabalhos",
                  value: "work",
                },
                {
                  label: "Exercícios",
                  value: "exercise",
                },
                {
                  label: "Outros",
                  value: "other",
                },
              ]}
            />
          </Input.Div>
        </Input.Root>

        <button type="button" className={formButton()}>
          Novo
        </button>
      </form>

      <section>
        <ul className={cardList()}>{handleListCards()}</ul>
      </section>
    </>
  );
};

export default Home;
