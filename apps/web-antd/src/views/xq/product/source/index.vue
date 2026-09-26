<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { XqSourceApi } from '#/api/xq/source';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { claimXqSource, getXqSourcePage } from '#/api/xq/source';

import { useGridColumns, useGridFormSchema } from './data';

function handleRefresh() {
  gridApi.query();
}

async function handleClaim(row: XqSourceApi.SourceItem) {
  const hide = message.loading({ content: '认领中...', duration: 0 });
  try {
    const order = await claimXqSource(row.id as number);
    message.success(`已认领，作业号 ${order.no || ''}`);
    handleRefresh();
  } finally {
    hide();
  }
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
          return await getXqSourcePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<XqSourceApi.SourceItem>,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="货源池">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '认领',
              type: 'link',
              auth: ['xq:source:claim'],
              disabled: !!row.claimed,
              onClick: handleClaim.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
