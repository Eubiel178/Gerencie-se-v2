import { Container } from "inversify";

import { configsContainer } from "./configs";
import { eventContainer } from "./event";

export const GerenciSe = Container.merge(configsContainer, eventContainer);
