import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace XqSourceApi {
  export interface SourceItem {
    id?: number;
    externalSku: string;
    title: string;
    price?: number;
    stock?: number;
    sourceName?: string;
    imageUrl?: string;
    claimed?: boolean;
    createTime?: string;
  }

  export interface WorkOrder {
    id?: number;
    no?: string;
    sourceId?: number;
    externalSku?: string;
    title?: string;
    status?: number;
  }
}

export function getXqSourcePage(params: PageParam) {
  return requestClient.get<PageResult<XqSourceApi.SourceItem>>(
    '/xq/source/page',
    { params },
  );
}

export function claimXqSource(id: number) {
  return requestClient.post<XqSourceApi.WorkOrder>(`/xq/source/claim?id=${id}`);
}
