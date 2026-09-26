import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      component: 'Input',
      fieldName: 'sku',
      label: 'SKU',
      rules: 'required',
      componentProps: { placeholder: '公司 SKU' },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '名称',
      rules: 'required',
      componentProps: { placeholder: '产品名称' },
    },
    {
      component: 'Input',
      fieldName: 'categoryName',
      label: '分类',
      componentProps: { placeholder: '分类名' },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: { placeholder: '备注' },
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sku',
      label: 'SKU',
      component: 'Input',
      componentProps: { placeholder: 'SKU', allowClear: true },
    },
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: { placeholder: '名称', allowClear: true },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'sku', title: 'SKU', minWidth: 140 },
    { field: 'name', title: '名称', minWidth: 180 },
    { field: 'categoryName', title: '分类', minWidth: 100 },
    {
      field: 'status',
      title: '状态',
      minWidth: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
