import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

const STATUS_OPTIONS = [
  { label: '进行中', value: 10 },
  { label: '已完成', value: 20 },
  { label: '已关闭', value: 30 },
];

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '作业号',
      component: 'Input',
      componentProps: { placeholder: '作业号', allowClear: true },
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: { placeholder: '标题', allowClear: true },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: STATUS_OPTIONS,
      },
    },
  ];
}

export function useEditFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'contentTitle',
      label: '文案标题',
      component: 'Input',
      componentProps: { placeholder: '文案标题' },
    },
    {
      fieldName: 'contentSellingPoints',
      label: '卖点',
      component: 'Textarea',
      componentProps: { placeholder: '卖点，分行或逗号分隔', rows: 4 },
    },
  ];
}

export function useCompleteFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'productSku',
      label: '入库SKU',
      component: 'Input',
      rules: 'required',
      componentProps: { placeholder: '公司 SKU' },
    },
    {
      fieldName: 'productName',
      label: '产品名称',
      component: 'Input',
      rules: 'required',
      componentProps: { placeholder: '品库名称' },
    },
    {
      fieldName: 'categoryName',
      label: '分类',
      component: 'Input',
      componentProps: { placeholder: '分类名' },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  const statusMap: Record<number, string> = {
    10: '进行中',
    20: '已完成',
    30: '已关闭',
  };
  return [
    { field: 'no', title: '作业号', minWidth: 160 },
    { field: 'externalSku', title: '外部SKU', minWidth: 120 },
    { field: 'title', title: '货源标题', minWidth: 200 },
    {
      field: 'status',
      title: '状态',
      minWidth: 90,
      formatter: ({ cellValue }) => statusMap[cellValue as number] || cellValue,
    },
    { field: 'contentTitle', title: '文案标题', minWidth: 140 },
    { field: 'productSku', title: '入库SKU', minWidth: 120 },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
