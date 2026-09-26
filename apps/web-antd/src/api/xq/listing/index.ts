import { requestClient } from '#/api/request';

export namespace XqListingApi {
  export interface Platform {
    id: string;
    code: string;
    name: string;
    sortOrder?: number;
    enabled?: boolean;
  }

  export interface Shop {
    id: string;
    platformId: string;
    code: string;
    name: string;
    enabled?: boolean;
  }

  export interface CopyRule {
    id?: string;
    platformId?: string;
    platformCode?: string;
    platformName?: string;
    code?: string;
    name: string;
    configJson: string;
    enabled?: boolean;
    remark?: string;
  }
}

export function getXqListingPlatforms() {
  return requestClient.get<XqListingApi.Platform[]>('/xq/listing/platforms');
}

export function getXqListingShops(platformId?: string) {
  return requestClient.get<XqListingApi.Shop[]>('/xq/listing/shops', {
    params: { platformId },
  });
}

export function getXqCopyRules() {
  return requestClient.get<XqListingApi.CopyRule[]>('/xq/listing/copy-rules');
}

export function getXqCopyRule(platformId?: string) {
  return requestClient.get<XqListingApi.CopyRule>('/xq/listing/copy-rule', {
    params: { platformId: platformId || '' },
  });
}

export function saveXqCopyRule(data: {
  configJson: string;
  enabled?: boolean;
  name: string;
  platformId?: string;
  remark?: string;
}) {
  return requestClient.post('/xq/listing/copy-rule', data);
}
