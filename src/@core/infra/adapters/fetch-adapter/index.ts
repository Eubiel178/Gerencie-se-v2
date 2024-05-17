import { injectable } from "inversify";

import { IHttpAdpter, IHttpRequest } from "../interfaces";

@injectable()
export class FetchAdapter implements IHttpAdpter {
  async request(httpRequest: IHttpRequest) {
    const { url, method, cache, next, body, headers } = httpRequest;

    try {
      const response = await fetch(process.env.apiLocal + url, {
        method: method.toUpperCase(),
        headers: headers,
        body: JSON.stringify(body),
        cache: cache || "no-store",
        next,
      });
      //
      return response;
    } catch (error) {
      return error;
    }
  }
}
