<script lang="ts" setup>
import type { XqRpaConfigApi } from '#/api/xq/rpa-config';

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
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import {
  getXqRpaConfig,
  saveXqRpaConfig,
  triggerXqRpa,
} from '#/api/xq/rpa-config';

defineOptions({ name: 'XqRpaConfig' });

const loading = ref(false);
const saving = ref(false);
const triggering = ref(false);
const globalConfigured = ref(false);
const globalBaseUrl = ref('');
const globalAppKeyMasked = ref('');
const hasPassword = ref(false);
const jobKind = ref<'copy' | 'image'>('image');
const lastTrigger = ref<null | XqRpaConfigApi.TriggerResp>(null);

const form = reactive({
  imageJobUuid: '',
  copyJobUuid: '',
  erpSiteUrl: '',
  account: '',
  password: '',
});

async function load() {
  loading.value = true;
  try {
    const data = await getXqRpaConfig();
    globalConfigured.value = !!data?.globalConfigured;
    globalBaseUrl.value = data?.globalBaseUrl || '';
    globalAppKeyMasked.value = data?.globalAppKeyMasked || '';
    hasPassword.value = !!data?.hasPassword;
    form.imageJobUuid = data?.imageJobUuid || '';
    form.copyJobUuid = data?.copyJobUuid || '';
    form.erpSiteUrl = data?.erpSiteUrl || '';
    form.account = data?.account || '';
    form.password = '';
  } catch (error: any) {
    message.error(error?.message || '加载配置失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    await saveXqRpaConfig({
      imageJobUuid: form.imageJobUuid.trim() || undefined,
      copyJobUuid: form.copyJobUuid.trim() || undefined,
      erpSiteUrl: form.erpSiteUrl.trim() || undefined,
      account: form.account.trim() || undefined,
      password: form.password.trim() || undefined,
    });
    message.success('已保存');
    await load();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleTrigger() {
  if (!globalConfigured.value) {
    message.warning('管理员尚未配置控制中枢密钥，请到「系统管理 → 集成密钥」');
    return;
  }
  const uuid =
    jobKind.value === 'copy'
      ? form.copyJobUuid.trim()
      : form.imageJobUuid.trim();
  if (!uuid) {
    message.warning(
      jobKind.value === 'copy'
        ? '请先填写文案图文生任务 UUID'
        : '请先填写生图/拉取任务 UUID',
    );
    return;
  }
  triggering.value = true;
  try {
    const res = await triggerXqRpa({ jobKind: jobKind.value });
    lastTrigger.value = res;
    const parts = ['已触发'];
    if (res?.inputParamSent) parts.push('已下发入参');
    if (res?.workUuid) parts.push(`运行ID ${res.workUuid}`);
    message.success(parts.join(' · '));
  } catch (error: any) {
    message.error(error?.message || '触发失败');
  } finally {
    triggering.value = false;
  }
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <div class="mx-auto max-w-3xl space-y-4 p-1">
      <Alert
        type="info"
        show-icon
        message="个人 RPA 配置"
        description="密钥由管理员在「系统管理 → 集成密钥 → 控制中枢密钥」统一配置。本页只填你自己的任务 UUID 与登录入参。"
      />

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-base font-semibold">全局密钥状态</div>
          <Space>
            <Tag v-if="globalConfigured" color="success">管理员已配置</Tag>
            <Tag v-else color="error">管理员未配置</Tag>
            <Button :loading="loading" @click="load">刷新</Button>
          </Space>
        </div>
        <div class="space-y-1 text-sm text-muted-foreground">
          <div>API：{{ globalBaseUrl || '-' }}</div>
          <div>appKey：{{ globalAppKeyMasked || '-' }}</div>
        </div>
      </div>

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-4 text-base font-semibold">我的任务与入参</div>
        <Form layout="vertical" :model="form">
          <FormItem label="生图 / 拉取任务 UUID">
            <Input
              v-model:value="form.imageJobUuid"
              placeholder="对应旧项目个人任务 UUID"
            />
          </FormItem>
          <FormItem label="文案图文生任务 UUID">
            <Input
              v-model:value="form.copyJobUuid"
              placeholder="新文案 RPA 任务 UUID"
            />
          </FormItem>
          <FormItem label="ERP 站点">
            <Input
              v-model:value="form.erpSiteUrl"
              placeholder="写入入参 http"
            />
          </FormItem>
          <FormItem label="账户">
            <Input v-model:value="form.account" placeholder="入参「账户」" />
          </FormItem>
          <FormItem :label="hasPassword ? '密码（已保存，留空不改）' : '密码'">
            <InputPassword
              v-model:value="form.password"
              placeholder="入参「密码」"
            />
          </FormItem>
          <Button type="primary" :loading="saving" @click="handleSave">
            保存
          </Button>
        </Form>
      </div>

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 text-base font-semibold">触发</div>
        <Space direction="vertical" class="w-full" :size="12">
          <Select
            v-model:value="jobKind"
            style="width: 220px"
            :options="[
              { value: 'image', label: '生图 / 拉取' },
              { value: 'copy', label: '文案图文生' },
            ]"
          />
          <Button
            type="primary"
            :loading="triggering"
            :disabled="!globalConfigured"
            @click="handleTrigger"
          >
            触发 RPA
          </Button>
          <div v-if="lastTrigger" class="text-sm text-muted-foreground">
            最近：{{ lastTrigger.jobKind }} · job={{
              lastTrigger.jobUuid || '-'
            }}
            · work={{ lastTrigger.workUuid || '-' }}
          </div>
        </Space>
      </div>
    </div>
  </Page>
</template>
