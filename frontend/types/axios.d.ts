import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Skip 401 → refresh → retry (login, register, logout, init /me probe) */
    skipAuthRetry?: boolean;
    /** @internal — marks request as already retried after refresh */
    _retry?: boolean;
  }
}
