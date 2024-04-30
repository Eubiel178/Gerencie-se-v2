import * as domain from "@/@core/domain";

import { IHttpAdpter } from "@/@core/infra/adapters/interfaces";

export class RemoteEvent
  implements domain.CreateEvent, domain.LoadAllEvents, domain.DeleteEvent
{
  constructor(private http: IHttpAdpter) {}

  async create(params: domain.CreateEvent.Params) {
    return await this.http.request({
      url: "events",
      method: "post",
      body: params,
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${params.token}`,
      },
    });
  }

  async loadAll(params: domain.LoadAllEvents.Params) {
    return await this.http.request({
      url: "events",
      method: "get",
    });
  }

  async delete(params: domain.DeleteEvent.Params) {
    // return (await this.http.delete(`/event/${params.id}`)).data;
  }
}
