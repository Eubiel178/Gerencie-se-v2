import { inject, injectable } from "inversify";

import { AxiosInstance } from "axios";

import * as domain from "@/@core/domain";

export class RemoteEvent
  implements domain.CreateEvent, domain.LoadAll, domain.DeleteEvent
{
  constructor(private http: AxiosInstance) {}

  async create(params: domain.CreateEvent.Params) {
    return this.http.post("/events", params, {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${params.token}`,
      },
    });
  }

  async loadAll(params: domain.LoadAll.Params) {
    return (await this.http.get("/events")).data;
  }

  async delete(params: domain.DeleteEvent.Params) {
    // return (await this.http.delete(`/event/${params.id}`)).data;
  }
}
