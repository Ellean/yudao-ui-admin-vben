import { requestClient } from '#/api/request';

export namespace XqGigaCredentialApi {
  export interface Credential {
    id: number;
    name: string;
    clientId: string;
    clientSecretMask?: string;
    sandbox?: boolean;
    baseUrl?: string;
    isDefault?: boolean;
    enabled?: boolean;
    remark?: string;
    updateTime?: string;
  }

  export interface SaveReq {
    id?: number;
    name: string;
    clientId: string;
    clientSecret?: string;
    sandbox?: boolean;
    baseUrl?: string;
    isDefault?: boolean;
    enabled?: boolean;
    remark?: string;
  }
}

export function getXqGigaCredentials() {
  return requestClient.get<XqGigaCredentialApi.Credential[]>(
    '/xq/giga-credential/list',
  );
}

export function saveXqGigaCredential(data: XqGigaCredentialApi.SaveReq) {
  return requestClient.post<number>('/xq/giga-credential/save', data);
}

export function deleteXqGigaCredential(id: number) {
  return requestClient.delete<boolean>('/xq/giga-credential/delete', {
    params: { id },
  });
}

export function setDefaultXqGigaCredential(id: number) {
  return requestClient.post<boolean>('/xq/giga-credential/set-default', null, {
    params: { id },
  });
}
