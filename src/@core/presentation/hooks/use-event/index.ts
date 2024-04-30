import { GerenciSe, GerenciseTypes } from "@/@core/container";

import { RemoteEvent } from "@/@core/data";

export function useEvent() {
  return { fetcher: GerenciSe.get<RemoteEvent>(GerenciseTypes.RemoteEvent) };
}
