export interface IHttpRequest {
  url: string;
  method: "get" | "post" | "put" | "delete";
  body?: any;
  headers?: any;
}

export interface IHttpAdpter {
  request: (params: IHttpRequest) => Promise<any>;
}
