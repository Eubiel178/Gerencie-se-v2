export function useFormTags() {
  const tags = ["studie", "work", "exercise", "other"];

  const options = [
    { label: "Estudo", value: "studie" },
    { label: "Trabalho", value: "work" },
    { label: "Exercício", value: "exercise" },
    { label: "Outros", value: "other" },
  ];

  const tagsLabels: Record<string, string> = {
    all: "Todos",
    studie: "Estudo",
    work: "Trabalho",
    exercise: "Exercício",
    other: "Outros",
  };

  function tagExists(tag: string) {
    console.log(tag);

    if (tags.includes(tag)) {
      return tag;
    }

    return "all";
  }

  return { tags, options, tagsLabels, tagExists };
}
