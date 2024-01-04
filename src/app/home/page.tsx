"use client";

import { tv } from "tailwind-variants";
import { CardList, DefaultLink, Input } from "@/components";
import { taskData } from "@/data/tasksData";

const homeTv = tv({
  slots: {
    taskTypesContainer: "flex items-stretch justify-between",
    button:
      "bg-green-500 text-slate-100 border-solid border-2 border-green-500 font-medium px-4",
  },
});

const Home = () => {
  const { taskTypesContainer, button } = homeTv();

  const tagLabels: Record<string, string> = {
    studie: "#Estudo",
    work: "#Trabalho",
    exercise: "#Exercício",
    other: "#Outros",
  };

  return (
    <section>
      <div className={taskTypesContainer()}>
        <Input.Root>
          <Input.Div>
            <Input.FieldSelect
              title="Listar tarefas por tag"
              optionsArray={[
                { label: "Todos", value: "all" },
                { label: "Estudos", value: "studie" },
                { label: "Trabalhos", value: "work" },
                { label: "Exercícios", value: "exercise" },
                { label: "Outros", value: "other" },
              ]}
            />
          </Input.Div>
        </Input.Root>

        <button type="button" className={button()}>
          Novo
        </button>
      </div>

      {taskData.length === 0 ? (
        <div>
          <p>Nenhuma tarefa adicionada</p>
        </div>
      ) : (
        <CardList.Root>
          {taskData.map(({ id, tag, title, description }) => (
            <CardList.Item key={id}>
              <CardList.Div height="h32" className="bg-slate-500" />

              <CardList.Div justify="between" height="flex1" padding="md">
                <CardList.Div>
                  <CardList.Text
                    textColor="secondary"
                    margin="mb2"
                    text={tagLabels[tag]}
                  />

                  <CardList.Title title={title} />

                  <CardList.Text margin="mt3" text={description} />
                </CardList.Div>

                <DefaultLink href={`home/${id}`}>Acessar</DefaultLink>
              </CardList.Div>
            </CardList.Item>
          ))}
        </CardList.Root>
      )}
    </section>
  );
};

export default Home;
