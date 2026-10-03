<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Form,
  FormItem,
  Input,
  InputPassword,
  message,
  Space,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { getXqRpaGlobal, saveXqRpaGlobal } from '#/api/xq/rpa-global';

defineOptions({ name: 'XqRpaGlobal' });

const loading = ref(false);
const saving = ref(false);
const configured = ref(false);
const appKeyMasked = ref('');
const hasAppSecret = ref(false);

const form = reactive({
  baseUrl: 'https://z-commander-api.ai-indeed.com',
  appKey: '',
  appSecret: '',
  remark: '',
});

async function load() {
  loading.value = true;
  try {
    const data = await getXqRpaGlobal();
    configured.value = !!data?.configured;
    appKeyMasked.value = data?.appKeyMasked || '';
    hasAppSecret.value = !!data?.hasAppSecret;
    form.baseUrl = data?.baseUrl || 'https://z-commander-api.ai-indeed.com';
    form.appKey = '';
    form.appSecret = '';
    form.remark = data?.remark || '';
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!form.baseUrl.trim()) {
    message.warning('请填写 API 地址');
    return;
  }
  if (!configured.value && (!form.appKey.trim() || !form.appSecret.trim())) {
    message.warning('首次保存请填写 appKey 与 appSecret');
    return;
  }
  saving.value = true;
  try {
    await saveXqRpaGlobal({
      baseUrl: form.baseUrl.trim(),
      appKey: form.appKey.trim() || undefined,
      appSecret: form.appSecret.trim() || undefined,
      remark: form.remark.trim() || undefined,
    });
    message.success('全局密钥已保存');
    await load();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <div class="mx-auto max-w-2xl space-y-4 p-1">
      <Alert
        type="warning"
        show-icon
        message="控制中枢密钥（全员共用）"
        description="appKey / appSecret / API 地址由管理员统一配置。普通用户在「工作台 → 配置 → RPA配置」只填个人任务 UUID 与入参。"
      />

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-4 flex items-center justify-between">
          <div class="text-base font-semibold">全局密钥</div>
          <Space>
            <Tag v-if="configured" color="success">已配置</Tag>
            <Tag v-else color="error">未配置</Tag>
            <Button :loading="loading" @click="load">刷新</Button>
          </Space>
        </div>

        <Form layout="vertical">
          <FormItem label="API 地址" required>
            <Input v-model:value="form.baseUrl" />
          </FormItem>
          <FormItem
            :label="
              appKeyMasked ? `appKey（已保存 ${appKeyMasked}）` : 'appKey'
            "
          >
            <Input
              v-model:value="form.appKey"
              :placeholder="configured ? '留空不改' : '必填'"
            />
          </FormItem>
          <FormItem
            :label="
              hasAppSecret ? 'appSecret（已保存，留空不改）' : 'appSecret'
            "
          >
            <InputPassword
              v-model:value="form.appSecret"
              :placeholder="configured ? '留空不改' : '必填'"
            />
          </FormItem>
          <FormItem label="备注">
            <Textarea v-model:value="form.remark" :rows="2" />
          </FormItem>
          <Button type="primary" :loading="saving" @click="handleSave">
            保存
          </Button>
        </Form>
      </div>
    </div>
  </Page>
</template>
