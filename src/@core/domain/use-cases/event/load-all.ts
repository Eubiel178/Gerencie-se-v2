import { IEvent } from "./event"

export type LoadAll = {
  loadAll: (params: LoadAll.Params) => Promise<LoadAll.Model>
}

export namespace LoadAll {
  export type Params = {
    id: number
  }

  export type Model =IEvent[]
}