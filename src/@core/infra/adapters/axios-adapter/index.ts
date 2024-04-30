import { injectable } from "inversify";

import axios, { AxiosResponse } from "axios";

import { IHttpAdpter, IHttpRequest } from "../interfaces";

@injectable()
export class AxiosAdapter implements IHttpAdpter {
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
