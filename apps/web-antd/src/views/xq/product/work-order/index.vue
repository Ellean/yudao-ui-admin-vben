<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { Page, useVbenModal } from '@vben/common-ui';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getXqWorkOrderPage } from '#/api/xq/work-order';

import { useGridColumns, useGridFormSchema } from './data';
import CompleteForm from './modules/complete-form.vue';
import EditForm from './modules/edit-form.vue';

const [EditModal, editModalApi] = useVbenModal({
  connectedComponent: EditForm,
  destroyOnClose: true,
});
const [CompleteModal, completeModalApi] = useVbenModal({
  connectedComponent: CompleteForm,
  destroyOnClose: true,
});

function handleRefresh() {
  gridApi.query();
}

function handleEdit(row: XqWorkOrderApi.WorkOrder) {
  editModalApi.setData(row).open();
}

function handleComplete(row: XqWorkOrderApi.WorkOrder) {
  completeModalApi.setData(row).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getXqWorkOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<XqWorkOrderApi.WorkOrder>,
});
</script>

<template>
  <Page auto-content-height>
    <EditModal @success="handleRefresh" />
    <CompleteModal @success="handleRefresh" />
    <Grid table-title="我的作业">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑文案',
              type: 'link',
              auth: ['xq:work-order:update'],
              disabled: row.status !== 10,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '完成入库',
              type: 'link',
              auth: ['xq:work-order:complete'],
              disabled: row.status !== 10,
              onClick: handleComplete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
