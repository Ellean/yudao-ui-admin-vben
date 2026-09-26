<script lang="ts" setup>
import type { XqProductApi } from '#/api/xq/product';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createXqProduct,
  getXqProduct,
  updateXqProduct,
} from '#/api/xq/product';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<XqProductApi.Product>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['产品'])
    : $t('ui.actionTitle.create', ['产品']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    const data = (await formApi.getValues()) as XqProductApi.Product;
    try {
      await (formData.value?.id
        ? updateXqProduct(data)
        : createXqProduct(data));
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
    const data = modalApi.getData() as XqProductApi.Product;
    if (!data?.id) return;
    modalApi.lock();
    try {
      formData.value = await getXqProduct(data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
