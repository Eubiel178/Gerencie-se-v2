import { GerenciSe, GerenciseTypes } from "@/@core/container";

import { RemoteTask } from "@/@core/data";

export function useTask() {
  return { fetcher: GerenciSe.get<RemoteTask>(GerenciseTypes.RemoteTask) };
}
