"use client";

import { DefaultLink, Header, Input, Notification, Title } from "@/components";
import { useState } from "react";
import { TaskProps } from "./type";
import { taskData } from "@/data/tasksData";

const Home = () => {
  const [tasks, setTasks] = useState<TaskProps[]>(taskData);
  const [tips, setTips] = useState<string>(
    "Lembre-se de fazer pequenas pausas durante o trabalho para manter a produtividade."
  );

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
      return <li>Nenhum Tarefa adicionada</li>;
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
          <li
            key={id}
            className="min-w-72	 w-full max-w-xs h-96 bg-white shadow rounded-ee-lg rounded-es-lg flex flex-col  "
          >
            <div className="bg-slate-500 h-32"></div>

            <div className="flex-1 flex flex-col items-start justify-between p-3.5 ">
              <div>
                <span className="text-blue-400 mb-2 text-sm">
                  {(tagJSON as any)[tag]}
                </span>

                <Title.Three className="mb-5">{title}</Title.Three>

                <p className="text-gray-700 text-sm break-all">{description}</p>
              </div>

              <DefaultLink href={`home/${id}`}>Acessar</DefaultLink>
            </div>
          </li>
        );
      });
    }
  };

  return (
    <div className="flex-1 flex smallTablet:flex-col">
      <Header />

      <main className="flex-1 flex flex-col gap-10 p-5">
        <form className="flex items-stretch justify-between">
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

          <button
            type="button"
            className="border-solid border-2 bg-green-500 text-slate-100 font-medium px-4"
          >
            Novo
          </button>
        </form>

        <section>
          <ul className="flex flex-wrap gap-10">{handleListCards()}</ul>
        </section>
      </main>
    </div>
  );
};

export default Home;
