import { HTMLAttributes } from "react";

export interface TitleProps extends HTMLAttributes<HTMLHeadElement> {
  text: string;
}
