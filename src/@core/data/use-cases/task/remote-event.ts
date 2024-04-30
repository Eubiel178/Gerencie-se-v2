import * as domain from "@/@core/domain";

import { IHttpAdpter } from "@/@core/infra/adapters/interfaces";

export class RemoteTask
  implements domain.CreateTask, domain.LoadAllTasks, domain.DeleteTask
{
  constructor(private http: IHttpAdpter) {}

  async create(params: domain.CreateTask.Params) {
    return await this.http.request({
      url: "tasks",
      method: "post",
      body: params,
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${params.token}`,
      },
    });
  }

  async loadAll(params: domain.LoadAllTasks.Params) {
    return await this.http.request({
      url: "tasks",
      method: "get",
      cache: "force-cache",
      next: {
        tags: ["load-tasks"],
      },
    });
  }

  async delete(params: domain.DeleteTask.Params) {
    // return (await this.http.delete(`/event/${params.id}`)).data;
  }
}
