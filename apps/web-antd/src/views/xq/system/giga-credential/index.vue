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
  clientId: '',
  clientSecret: '',
  sandbox: false,
  baseUrl: '',
  isDefault: false,
  enabled: true,
  remark: '',
});

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: 'Client ID', dataIndex: 'clientId', key: 'clientId', width: 180 },
  {
    title: 'Secret',
    dataIndex: 'clientSecretMask',
    key: 'clientSecretMask',
    width: 140,
  },
  { title: '环境', key: 'sandbox', width: 90 },
  { title: '默认', key: 'isDefault', width: 80 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '操作', key: 'actions', width: 220 },
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
  form.clientId = '';
  form.clientSecret = '';
  form.sandbox = false;
  form.baseUrl = '';
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
  form.clientId = row.clientId;
  form.clientSecret = '';
  form.sandbox = !!row.sandbox;
  form.baseUrl = row.baseUrl || '';
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
  if (!form.id && !form.clientSecret?.trim()) {
    message.warning('新建必须填写 Client Secret');
    return;
  }
  saving.value = true;
  try {
    await saveXqGigaCredential({
      ...form,
      name: form.name.trim(),
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
  message.success('已设为默认');
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
        message="产品库凭证（特殊设计）"
        description="Giga OpenAPI 使用 Client ID + Client Secret。Secret 加密入库，界面仅显示掩码，更新时可留空保留原值。支持多凭证、沙箱、默认凭证；选品同步将使用默认且启用的那一套。"
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
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sandbox'">
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
      destroy-on-close
      @ok="handleSave"
    >
      <Form layout="vertical" class="mt-2">
        <FormItem label="名称" required>
          <Input v-model:value="form.name" placeholder="如 主账号 / 沙箱" />
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
        <FormItem label="自定义 Base URL">
          <Input
            v-model:value="form.baseUrl"
            placeholder="可空，默认官方 openapi.gigab2b.com"
          />
        </FormItem>
        <FormItem label="沙箱环境">
          <Switch v-model:checked="form.sandbox" />
        </FormItem>
        <FormItem label="设为默认">
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
