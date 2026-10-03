import { requestClient } from '#/api/request';

export namespace XqGigaCredentialApi {
  /** pickup=自提价 dropship=一键代发价 */
  export type PriceRole = 'dropship' | 'pickup';
  /** skip_if_exists=库中已有SKU不扩 always_refresh=始终刷新 */
  export type SyncDedupeMode = 'always_refresh' | 'skip_if_exists';

  export interface Credential {
    id: number;
    name: string;
    vendorCode?: string;
    vendorName?: string;
    clientId: string;
    clientSecretMask?: string;
    sandbox?: boolean;
    baseUrl?: string;
    priceRole?: PriceRole;
    enableScheduledSync?: boolean;
    syncDedupeMode?: SyncDedupeMode;
    isDefault?: boolean;
    enabled?: boolean;
    remark?: string;
    updateTime?: string;
  }

  export interface SaveReq {
    id?: number;
    name: string;
    vendorCode?: string;
    vendorName?: string;
    clientId: string;
    clientSecret?: string;
    sandbox?: boolean;
    baseUrl?: string;
    priceRole: PriceRole;
    enableScheduledSync?: boolean;
    syncDedupeMode?: SyncDedupeMode;
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
