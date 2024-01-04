"use client";

import { tv } from "tailwind-variants";

import { DefaultLink, Input, TitleThree } from "@/components";
import { taskData } from "@/data/tasksData";
import { useState } from "react";

const homeTv = tv({
  slots: {
    form: "flex items-stretch justify-between",
    formButton:
      "bg-green-500 text-slate-100 border-solid border-2 border-green-500 font-medium px-4",
    cardList: "flex flex-wrap gap-10",
    card: "bg-white min-w-72	w-full max-w-xs h-96 shadow rounded-ee-lg rounded-es-lg flex flex-col",
    cardColor: "bg-slate-500 h-32",
    cardContent: "flex-1 flex flex-col items-start justify-between p-3.5",
    cardTag: "mb-2 text-sm text-blue-400",
    cardDescription: "text-gray-700 text-sm break-all mt-3",
  },
});

const Home = () => {
  const [tip, setTip] = useState(
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
  } = homeTv();

  const tagLabels: Record<string, string> = {
    studie: "#Estudo",
    work: "#Trabalho",
    exercise: "#Exercício",
    other: "#Outros",
  };

  const handletips = (): void => {
    const tips = [
      "Organize suas tarefas por prioridade para garantir que o mais importante seja feito primeiro.",
      "Use a técnica Pomodoro para dividir o trabalho em períodos de foco intenso intercalados com pausas.",
      "Mantenha sua área de trabalho limpa e organizada para reduzir distrações.",
      "Defina metas realistas para suas tarefas diárias e celebre suas conquistas.",
    ];
    const randomIndex = Math.floor(Math.random() * tips.length);
    const randomTip = tips[randomIndex];

    setTip(randomTip);
  };

  return (
    <section>
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

      {taskData.length === 0 ? (
        <div>
          <p>Nenhuma tarefa adicionada</p>
        </div>
      ) : (
        <ul className={cardList()}>
          {taskData.map(({ id, tag, title, description }) => (
            <li key={id} className={card()}>
              <div className={cardColor()}></div>

              <div className={cardContent()}>
                <div>
                  <span className={cardTag()}>{tagLabels[tag]}</span>

                  <TitleThree>{title}</TitleThree>

                  <p className={cardDescription()}>{description}</p>
                </div>

                <DefaultLink href={`home/${id}`}>Acessar</DefaultLink>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Home;
