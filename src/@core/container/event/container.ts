import { Container } from "inversify";

import { RemoteEvent } from "@/@core/data";
import { AxiosAdapter } from "@/@core/infra";

import { configsContainer } from "../configs";

import { EventTypes } from "./types";

export const eventContainer = new Container();

eventContainer.parent = configsContainer;

eventContainer.bind(EventTypes.RemoteEvent).toDynamicValue(function () {
  return new RemoteEvent(new AxiosAdapter());
});
