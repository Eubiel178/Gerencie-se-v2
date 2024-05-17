type Cache =
  | "default"
  | "force-cache"
  | "no-cache"
  | "no-store"
  | "only-if-cached"
  | "reload";

export interface IHttpRequest {
  url: string;
  method: "get" | "post" | "put" | "delete";
  body?: any;
  cache?: Cache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
  headers?: {
    [key: string]: string;
  };
}

export interface IHttpAdpter {
  request: (params: IHttpRequest) => Promise<any>;
}
