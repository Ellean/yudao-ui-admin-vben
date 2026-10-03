import { requestClient } from '#/api/request';

export namespace XqRpaConfigApi {
  export interface Config {
    globalConfigured?: boolean;
    globalBaseUrl?: string;
    globalAppKeyMasked?: string;
    imageJobUuid?: string;
    copyJobUuid?: string;
    erpSiteUrl?: string;
    account?: string;
    hasPassword?: boolean;
  }

  export interface SaveReq {
    imageJobUuid?: string;
    copyJobUuid?: string;
    erpSiteUrl?: string;
    account?: string;
    password?: string;
  }

  export interface TriggerReq {
    jobKind: 'copy' | 'image';
  }

  export interface TriggerResp {
    jobKind?: string;
    jobUuid?: string;
    workUuid?: string;
    inputParamSent?: boolean;
  }
}

export function getXqRpaConfig() {
  return requestClient.get<XqRpaConfigApi.Config>('/xq/rpa-config/get');
}

export function saveXqRpaConfig(data: XqRpaConfigApi.SaveReq) {
  return requestClient.post<boolean>('/xq/rpa-config/save', data);
}

export function triggerXqRpa(data: XqRpaConfigApi.TriggerReq) {
  return requestClient.post<XqRpaConfigApi.TriggerResp>(
    '/xq/rpa-config/trigger',
    data,
  );
}
