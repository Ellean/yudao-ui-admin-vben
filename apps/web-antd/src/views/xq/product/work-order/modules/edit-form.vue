<script lang="ts" setup>
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getXqWorkOrder, updateXqWorkOrder } from '#/api/xq/work-order';
import { $t } from '#/locales';

import { useEditFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<XqWorkOrderApi.WorkOrder>();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useEditFormSchema(),
  showDefaultActions: false,
});

const title = computed(() => `编辑作业 ${formData.value?.no || ''}`);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues();
      await updateXqWorkOrder(data);
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const row = modalApi.getData() as XqWorkOrderApi.WorkOrder;
    if (!row?.id) return;
    modalApi.lock();
    try {
      formData.value = await getXqWorkOrder(row.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="title" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
