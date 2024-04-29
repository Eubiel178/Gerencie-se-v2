import { Container } from "inversify";
import { RemoteEvent } from "@/@core/data";
import { EventTypes } from "./types";
import { configsContainer } from "../configs";
import { AxiosAdapter } from "@/@core/infra";

export const eventContainer = new Container();

eventContainer.parent = configsContainer;

eventContainer.bind(EventTypes.RemoteEvent).toDynamicValue(function () {
  return new RemoteEvent(new AxiosAdapter());
});
