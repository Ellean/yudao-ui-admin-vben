import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'externalSku',
      label: '外部SKU',
      component: 'Input',
      componentProps: { placeholder: '外部SKU', allowClear: true },
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: { placeholder: '标题', allowClear: true },
    },
    {
      fieldName: 'claimed',
      label: '认领状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '未认领', value: false },
          { label: '已认领', value: true },
        ],
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'externalSku', title: '外部SKU', minWidth: 120 },
    { field: 'title', title: '标题', minWidth: 220 },
    { field: 'price', title: '价格', minWidth: 90, formatter: 'formatAmount2' },
    { field: 'stock', title: '库存', minWidth: 80 },
    { field: 'sourceName', title: '来源', minWidth: 100 },
    {
      field: 'claimed',
      title: '认领',
      minWidth: 90,
      formatter: ({ cellValue }) => (cellValue ? '已认领' : '未认领'),
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
