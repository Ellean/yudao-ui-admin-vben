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

  export interface CategoryNode {
    id: string;
    name: string;
    parentId?: string;
    platformId?: string;
    sortOrder?: number;
    children?: CategoryNode[];
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

  export interface ImageRule {
    id?: string;
    platformId?: string;
    platformCode?: string;
    platformName?: string;
    categoryId?: string;
    categoryName?: string;
    name: string;
    promptText: string;
    negativePrompt?: string;
    configJson?: string;
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

export function getXqListingCategories(platformId: string) {
  return requestClient.get<XqListingApi.CategoryNode[]>(
    '/xq/listing/categories',
    {
      params: { platformId },
    },
  );
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

export function getXqImageRules(platformId?: string) {
  return requestClient.get<XqListingApi.ImageRule[]>(
    '/xq/listing/image-rules',
    {
      params: { platformId: platformId || '' },
    },
  );
}

export function getXqImageRule(platformId?: string, categoryId?: string) {
  return requestClient.get<XqListingApi.ImageRule>('/xq/listing/image-rule', {
    params: {
      platformId: platformId || '',
      categoryId: categoryId || '',
    },
  });
}

export function saveXqImageRule(data: {
  categoryId?: string;
  categoryName?: string;
  configJson?: string;
  enabled?: boolean;
  name: string;
  negativePrompt?: string;
  platformId?: string;
  promptText: string;
  remark?: string;
}) {
  return requestClient.post('/xq/listing/image-rule', data);
}
