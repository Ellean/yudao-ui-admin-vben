import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace XqWorkOrderApi {
  export interface WorkOrder {
    id?: number;
    no: string;
    sourceId?: number;
    externalSku?: string;
    title?: string;
    status: number;
    contentTitle?: string;
    contentSellingPoints?: string;
    productId?: number;
    productSku?: string;
    assigneeUserId?: number;
    createTime?: string;
  }

  export interface CompleteReq {
    id: number;
    productSku: string;
    productName: string;
    categoryName?: string;
  }
}

export function getXqWorkOrderPage(params: PageParam) {
  return requestClient.get<PageResult<XqWorkOrderApi.WorkOrder>>(
    '/xq/work-order/page',
    { params },
  );
}

export function getXqWorkOrder(id: number) {
  return requestClient.get<XqWorkOrderApi.WorkOrder>(
    `/xq/work-order/get?id=${id}`,
  );
}

export function updateXqWorkOrder(data: Partial<XqWorkOrderApi.WorkOrder>) {
  return requestClient.put('/xq/work-order/update', data);
}

export function completeXqWorkOrder(data: XqWorkOrderApi.CompleteReq) {
  return requestClient.post<number>('/xq/work-order/complete', data);
}
