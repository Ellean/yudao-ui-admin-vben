import { requestClient } from '#/api/request';

export namespace XqRpaGlobalApi {
  export interface Config {
    configured?: boolean;
    baseUrl?: string;
    appKeyMasked?: string;
    hasAppSecret?: boolean;
    remark?: string;
  }

  export interface SaveReq {
    baseUrl: string;
    appKey?: string;
    appSecret?: string;
    remark?: string;
  }
}

export function getXqRpaGlobal() {
  return requestClient.get<XqRpaGlobalApi.Config>('/xq/rpa-global/get');
}

export function saveXqRpaGlobal(data: XqRpaGlobalApi.SaveReq) {
  return requestClient.post<boolean>('/xq/rpa-global/save', data);
}
