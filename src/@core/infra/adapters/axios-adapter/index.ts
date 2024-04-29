import { injectable } from "inversify";
import axios, { AxiosResponse } from "axios";

import { IHttpRequest } from "../interfaces";

export interface IAxiosAdapter {
  request: (params: IHttpRequest) => Promise<unknown>;
}

@injectable()
export class AxiosAdapter {
  async request(httpRequest: IHttpRequest) {
    const { url, method, body, headers } = httpRequest;

    try {
      const response = (await axios({
        url: process.env.apiLocal + url,
        method,
        data: body,
        headers,
      })) as AxiosResponse;

      return response.data;
    } catch (error) {
      return error;
    }
  }
}
