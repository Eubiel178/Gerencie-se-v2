"use client";

import { ReactElement, cloneElement, useId } from "react";

import styles from "./tooltip.module.css";

export interface TooltipProps {
  content: string;
  children: ReactElement<{ "aria-describedby"?: string }>;
  side?: "top" | "bottom" | "left" | "right";
}

/**
 * Sem dependência de posicionamento (floating-ui etc.) — o gatilho é
 * sempre o elemento âncora (`position: relative`) e a bolha é posicionada
 * com CSS puro. Aparece em hover E em foco (teclado), nunca só em hover.
 */
export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const id = useId();

  return (
    <span className={styles.wrapper}>
      {cloneElement(children, { "aria-describedby": id })}
      <span role="tooltip" id={id} className={[styles.bubble, styles[side]].join(" ")}>
        {content}
      </span>
    </span>
  );
}
