import { Container } from "inversify";
import { RemoteTask } from "@/@core/data";
import { TaskTypes } from "./types";
import { configsContainer } from "../configs";
import { AxiosAdapter } from "@/@core/infra";

export const taskContainer = new Container();

taskContainer.parent = configsContainer;

taskContainer.bind(TaskTypes.RemoteTask).toDynamicValue(function () {
  return new RemoteTask(new AxiosAdapter());
});
