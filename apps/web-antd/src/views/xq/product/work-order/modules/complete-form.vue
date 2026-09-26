<script lang="ts" setup>
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { completeXqWorkOrder } from '#/api/xq/work-order';

import { useCompleteFormSchema } from '../data';

const emit = defineEmits(['success']);
const rowData = ref<XqWorkOrderApi.WorkOrder>();
const title = computed(() => `上架 ${rowData.value?.no || ''}`);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useCompleteFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = (await formApi.getValues()) as XqWorkOrderApi.CompleteReq;
      const productId = await completeXqWorkOrder(data);
      await modalApi.close();
      emit('success');
      message.success(`已上架，品库 ID=${productId}`);
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      rowData.value = undefined;
      return;
    }
    const row = modalApi.getData() as XqWorkOrderApi.WorkOrder;
    rowData.value = row;
    await formApi.setValues({
      id: row.id,
      productSku: row.externalSku ? `SKU-${row.externalSku}` : '',
      productName: row.contentTitle || row.title || '',
      categoryName: row.categoryName || '',
    });
  },
});
</script>

<template>
  <Modal :title="title" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
