<script lang="ts" setup>
import type { XqGigaCredentialApi } from '#/api/xq/giga-credential';

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
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  deleteXqGigaCredential,
  getXqGigaCredentials,
  saveXqGigaCredential,
  setDefaultXqGigaCredential,
} from '#/api/xq/giga-credential';

defineOptions({ name: 'XqGigaCredential' });

const loading = ref(false);
const saving = ref(false);
const dialogOpen = ref(false);
const rows = ref<XqGigaCredentialApi.Credential[]>([]);

const form = reactive<XqGigaCredentialApi.SaveReq>({
  id: undefined,
  name: '',
  vendorCode: '',
  vendorName: '',
  clientId: '',
  clientSecret: '',
  sandbox: false,
  baseUrl: '',
  priceRole: 'dropship',
  enableScheduledSync: false,
  syncDedupeMode: 'skip_if_exists',
  isDefault: false,
  enabled: true,
  remark: '',
});

const columns = [
  { title: '商家', key: 'vendor', width: 140 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '价格角色', key: 'priceRole', width: 110 },
  { title: '定时拉取', key: 'sync', width: 100 },
  { title: '去重', key: 'dedupe', width: 120 },
  { title: 'Client ID', dataIndex: 'clientId', key: 'clientId', width: 160 },
  {
    title: 'Secret',
    dataIndex: 'clientSecretMask',
    key: 'clientSecretMask',
    width: 120,
  },
  { title: '环境', key: 'sandbox', width: 80 },
  { title: '默认', key: 'isDefault', width: 70 },
  { title: '启用', key: 'enabled', width: 70 },
  { title: '操作', key: 'actions', width: 200 },
];

async function load() {
  loading.value = true;
  try {
    rows.value = (await getXqGigaCredentials()) || [];
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = undefined;
  form.name = '';
  form.vendorCode = '';
  form.vendorName = '';
  form.clientId = '';
  form.clientSecret = '';
  form.sandbox = false;
  form.baseUrl = '';
  form.priceRole = 'dropship';
  form.enableScheduledSync = false;
  form.syncDedupeMode = 'skip_if_exists';
  form.isDefault = false;
  form.enabled = true;
  form.remark = '';
}

function openCreate() {
  resetForm();
  dialogOpen.value = true;
}

function openEdit(row: XqGigaCredentialApi.Credential) {
  form.id = row.id;
  form.name = row.name;
  form.vendorCode = row.vendorCode || '';
  form.vendorName = row.vendorName || '';
  form.clientId = row.clientId;
  form.clientSecret = '';
  form.sandbox = !!row.sandbox;
  form.baseUrl = row.baseUrl || '';
  form.priceRole = row.priceRole === 'pickup' ? 'pickup' : 'dropship';
  form.enableScheduledSync = !!row.enableScheduledSync;
  form.syncDedupeMode =
    row.syncDedupeMode === 'always_refresh'
      ? 'always_refresh'
      : 'skip_if_exists';
  form.isDefault = !!row.isDefault;
  form.enabled = row.enabled !== false;
  form.remark = row.remark || '';
  dialogOpen.value = true;
}

async function handleSave() {
  if (!form.name.trim() || !form.clientId.trim()) {
    message.warning('请填写名称与 Client ID');
    return;
  }
  if (!form.priceRole) {
    message.warning('请先标记价格角色（自提 / 一键代发）');
    return;
  }
  if (!form.id && !form.clientSecret?.trim()) {
    message.warning('新建必须填写 Client Secret');
    return;
  }
  saving.value = true;
  try {
    await saveXqGigaCredential({
      ...form,
      name: form.name.trim(),
      vendorCode: form.vendorCode?.trim() || undefined,
      vendorName: form.vendorName?.trim() || undefined,
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret?.trim() || undefined,
      baseUrl: form.baseUrl?.trim() || undefined,
      remark: form.remark?.trim() || undefined,
    });
    message.success('已保存');
    dialogOpen.value = false;
    await load();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: XqGigaCredentialApi.Credential) {
  Modal.confirm({
    title: '删除凭证？',
    content: `确认删除「${row.name}」？Secret 不可恢复。`,
    async onOk() {
      await deleteXqGigaCredential(row.id);
      message.success('已删除');
      await load();
    },
  });
}

async function handleSetDefault(row: XqGigaCredentialApi.Credential) {
  await setDefaultXqGigaCredential(row.id);
  message.success('已设为该商家+价格角色下的默认凭证');
  await load();
}

onMounted(load);
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4 p-1">
      <Alert
        type="info"
        show-icon
        message="产品库凭证（多家 · 双价格 · 定时拉取）"
        description="一家商家可挂多套 Client ID/Secret。必须先标记价格角色：自提(pickup) 或 一键代发(dropship)。勾选「定时拉取」的凭证参与定期同步选品库；默认去重为「库中已有 SKU 则不扩」，避免同密钥重复扩品。默认标记按「商家 + 价格角色」互斥。"
      />

      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-base font-semibold">凭证池</div>
          <Space>
            <Button :loading="loading" @click="load">刷新</Button>
            <Button type="primary" @click="openCreate">新增凭证</Button>
          </Space>
        </div>

        <Table
          :loading="loading"
          :columns="columns"
          :data-source="rows"
          :pagination="false"
          row-key="id"
          size="small"
          :scroll="{ x: 1400 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'vendor'">
              <div class="text-sm">
                {{ record.vendorName || record.vendorCode || '-' }}
              </div>
              <div
                v-if="record.vendorCode && record.vendorName"
                class="text-xs text-muted-foreground"
              >
                {{ record.vendorCode }}
              </div>
            </template>
            <template v-else-if="column.key === 'priceRole'">
              <Tag :color="record.priceRole === 'pickup' ? 'purple' : 'cyan'">
                {{ record.priceRole === 'pickup' ? '自提' : '一键代发' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'sync'">
              <Tag :color="record.enableScheduledSync ? 'success' : 'default'">
                {{ record.enableScheduledSync ? '参与' : '不参与' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'dedupe'">
              <span class="text-xs">
                {{
                  record.syncDedupeMode === 'always_refresh'
                    ? '始终刷新'
                    : '存在则不扩'
                }}
              </span>
            </template>
            <template v-else-if="column.key === 'sandbox'">
              <Tag :color="record.sandbox ? 'orange' : 'blue'">
                {{ record.sandbox ? '沙箱' : '正式' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'isDefault'">
              <Tag v-if="record.isDefault" color="success">默认</Tag>
              <span v-else>-</span>
            </template>
            <template v-else-if="column.key === 'enabled'">
              <Tag :color="record.enabled === false ? 'default' : 'processing'">
                {{ record.enabled === false ? '停用' : '启用' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button type="link" size="small" @click="openEdit(record)">
                  编辑
                </Button>
                <Button
                  v-if="!record.isDefault"
                  type="link"
                  size="small"
                  @click="handleSetDefault(record)"
                >
                  设默认
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record)"
                >
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <Modal
      v-model:open="dialogOpen"
      :title="form.id ? '编辑产品库凭证' : '新增产品库凭证'"
      :confirm-loading="saving"
      width="560px"
      destroy-on-close
      @ok="handleSave"
    >
      <Form layout="vertical" class="mt-2">
        <FormItem label="商家编码" extra="同一商家多套密钥填相同编码，便于分组">
          <Input
            v-model:value="form.vendorCode"
            placeholder="如 W1710 / vendor-a"
          />
        </FormItem>
        <FormItem label="商家名称">
          <Input v-model:value="form.vendorName" placeholder="展示名，可选" />
        </FormItem>
        <FormItem label="凭证名称" required>
          <Input
            v-model:value="form.name"
            placeholder="如 代发主号 / 自提定时"
          />
        </FormItem>
        <FormItem label="价格角色（必标）" required>
          <Select
            v-model:value="form.priceRole"
            :options="[
              { value: 'dropship', label: '一键代发（含运费价）' },
              { value: 'pickup', label: '自提（不含运费价）' },
            ]"
          />
        </FormItem>
        <FormItem label="Client ID" required>
          <Input v-model:value="form.clientId" />
        </FormItem>
        <FormItem
          :label="form.id ? 'Client Secret（留空不改）' : 'Client Secret'"
          :required="!form.id"
        >
          <InputPassword
            v-model:value="form.clientSecret"
            placeholder="仅写入时可见，保存后加密"
          />
        </FormItem>
        <FormItem label="用于定时拉取选品库">
          <Switch v-model:checked="form.enableScheduledSync" />
          <span class="ml-2 text-xs text-muted-foreground">
            开启后参与定期同步；拉取时按去重策略判断是否扩品
          </span>
        </FormItem>
        <FormItem label="拉取去重策略">
          <Select
            v-model:value="form.syncDedupeMode"
            :options="[
              {
                value: 'skip_if_exists',
                label: '存在则不扩（推荐，避免同密钥重复扩品）',
              },
              { value: 'always_refresh', label: '始终刷新已有 SKU 数据' },
            ]"
          />
        </FormItem>
        <FormItem label="自定义 Base URL">
          <Input
            v-model:value="form.baseUrl"
            placeholder="可空，默认官方 openapi.gigab2b.com"
          />
        </FormItem>
        <FormItem label="沙箱环境">
          <Switch v-model:checked="form.sandbox" />
        </FormItem>
        <FormItem
          label="设为默认"
          extra="同一「商家编码 + 价格角色」下仅能有一个默认"
        >
          <Switch v-model:checked="form.isDefault" />
        </FormItem>
        <FormItem label="启用">
          <Switch v-model:checked="form.enabled" />
        </FormItem>
        <FormItem label="备注">
          <Textarea v-model:value="form.remark" :rows="2" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
