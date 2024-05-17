import "reflect-metadata";

import { Container } from "inversify";

import { configsContainer } from "./configs";
import { eventContainer } from "./event";
import { taskContainer } from "./task";

export const GerenciSe = Container.merge(
  configsContainer,
  eventContainer,
  taskContainer
);
