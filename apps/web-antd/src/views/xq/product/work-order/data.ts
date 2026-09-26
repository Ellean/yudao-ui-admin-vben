import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

const STATUS_OPTIONS = [
  { label: '进行中', value: 10 },
  { label: '已上架', value: 20 },
  { label: '已关闭', value: 30 },
];

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '任务号',
      component: 'Input',
      componentProps: { placeholder: '任务号', allowClear: true },
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
      label: '上架SKU',
      component: 'Input',
      rules: 'required',
      componentProps: { placeholder: '公司 SKU' },
    },
    {
      fieldName: 'productName',
      label: '产品名称',
      component: 'Input',
      rules: 'required',
      componentProps: { placeholder: '上架名称' },
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
    20: '已上架',
    30: '已关闭',
  };
  return [
    { field: 'no', title: '任务号', minWidth: 160 },
    { field: 'externalSku', title: 'Item Code', minWidth: 120 },
    { field: 'title', title: '选品标题', minWidth: 200 },
    {
      field: 'status',
      title: '状态',
      minWidth: 90,
      formatter: ({ cellValue }) => statusMap[cellValue as number] || cellValue,
    },
    {
      field: 'contentTitle',
      title: '文案',
      minWidth: 100,
      formatter: ({ row }) => (row.contentTitle ? '已生成' : '未做'),
    },
    {
      field: 'generatedImageUrl',
      title: '图片',
      minWidth: 100,
      formatter: ({ row }) => (row.generatedImageUrl ? '已生成' : '未做'),
    },
    {
      field: 'stage',
      title: '当前阶段',
      minWidth: 100,
      formatter: ({ row }) => {
        if (row.status === 20) return '已上架';
        if (row.status !== 10) return '已关闭';
        if (!row.contentTitle) return '待文案';
        if (!row.generatedImageUrl) return '待图片';
        return '待上架';
      },
    },
    { field: 'productSku', title: '上架SKU', minWidth: 120 },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 320,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
