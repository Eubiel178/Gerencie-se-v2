import { Container } from "inversify";

import { RemoteEvent } from "@/@core/data";

import { EventTypes } from "./types";

import { configsContainer } from "../configs";

export const eventContainer = new Container();

eventContainer.parent = configsContainer;

eventContainer.bind(EventTypes.RemoteEvent).toDynamicValue(function (context) {
  return new RemoteEvent(context.container.get(EventTypes.ApiLocalInstance));
});
