"use client";

import { forwardRef } from "react";

import { useInputRootContext } from "@/providers/input-root-context";

import styles from "./styles.module.css";

type OptionSelectProps = {
  label: string;
  value: string;
};

interface InputFieldSelectProps extends React.ComponentProps<"select"> {
  optionsArray: OptionSelectProps[];
}

export const InputFieldSelect = forwardRef<
  HTMLSelectElement,
  InputFieldSelectProps
>(({ className, name, optionsArray, ...rest }, ref) => {
  const { sharedProps } = useInputRootContext();
  const incorrect = Boolean(sharedProps?.error);

  let classNames = `${styles.field} ${styles.select}`;

  if (incorrect) {
    classNames = classNames + " " + styles.incorrect;
  }

  if (className) {
    classNames = classNames + " " + className;
  }

  // Se uma das opções reais já usa value="" (ex.: "Não compartilhada" do
  // ShareSelect), NÃO adiciona o placeholder "Selecione" — ele também usa
  // value="", e com dois <option> de mesmo valor o navegador podia acabar
  // exibindo o placeholder desabilitado em vez da opção padrão real,
  // dando a impressão de que nada foi selecionado por padrão.
  const hasEmptyValueOption = optionsArray.some((option) => option.value === "");

  return (
    <select {...rest} className={classNames} name={name} id={name} ref={ref}>
      {!hasEmptyValueOption && (
        <option value="" disabled>
          Selecione
        </option>
      )}

      {optionsArray.map((element, index) => (
        <option key={index} value={element.value}>
          {element.label}
        </option>
      ))}
    </select>
  );
});
