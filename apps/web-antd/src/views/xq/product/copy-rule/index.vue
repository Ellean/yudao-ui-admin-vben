<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  Input,
  InputNumber,
  message,
  Select,
  Spin,
  Switch,
  Textarea,
} from 'ant-design-vue';

import {
  getXqCopyRules,
  getXqListingPlatforms,
  saveXqCopyRule,
} from '#/api/xq/listing';

const loading = ref(false);
const saving = ref(false);
const platforms = ref<XqListingApi.Platform[]>([]);
const rules = ref<XqListingApi.CopyRule[]>([]);
const activePlatformId = ref<string>('');

const form = reactive({
  name: '',
  enabled: true,
  remark: '',
  titleMaxLen: 200,
  descriptionMaxLen: 2000,
  featureMaxLen: 200,
  defaultFeatureCount: 5 as number,
  generateTitle: true,
  configJson: '',
});

const activeRule = computed(() =>
  rules.value.find(
    (r) => (r.platformId || '') === (activePlatformId.value || ''),
  ),
);

const platformOptions = computed(() => {
  const opts = [
    { label: '通用规则', value: '' },
    ...platforms.value.map((p) => ({
      label: `${p.name} (${p.code})`,
      value: p.id,
    })),
  ];
  return opts;
});

function parseConfig(json?: string) {
  try {
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

function fillForm(rule?: XqListingApi.CopyRule) {
  const cfg = parseConfig(rule?.configJson);
  form.name = rule?.name || '文案生成规则';
  form.enabled = rule?.enabled !== false;
  form.remark = rule?.remark || '';
  form.titleMaxLen = Number(cfg?.limits?.titleMaxLen || 200);
  form.descriptionMaxLen = Number(cfg?.limits?.descriptionMaxLen || 2000);
  form.featureMaxLen = Number(cfg?.limits?.featureMaxLen || 200);
  form.defaultFeatureCount = Number(cfg?.defaultFeatureCount || 5);
  form.generateTitle = cfg?.generateTitle !== false;
  form.configJson =
    rule?.configJson ||
    JSON.stringify(
      {
        defaultFeatureCount: form.defaultFeatureCount,
        allowedFeatureCounts: [5, 8],
        generateTitle: form.generateTitle,
        limits: {
          titleMaxLen: form.titleMaxLen,
          descriptionMaxLen: form.descriptionMaxLen,
          featureMaxLen: form.featureMaxLen,
        },
      },
      null,
      2,
    );
}

function syncJsonFromFields() {
  let cfg: Record<string, any>;
  try {
    cfg = form.configJson ? JSON.parse(form.configJson) : {};
  } catch {
    cfg = {};
  }
  cfg.defaultFeatureCount = form.defaultFeatureCount;
  cfg.allowedFeatureCounts = cfg.allowedFeatureCounts || [5, 8];
  cfg.generateTitle = form.generateTitle;
  cfg.limits = {
    ...cfg.limits,
    titleMaxLen: form.titleMaxLen,
    descriptionMaxLen: form.descriptionMaxLen,
    featureMaxLen: form.featureMaxLen,
  };
  form.configJson = JSON.stringify(cfg, null, 2);
}

function onSelectPlatform(id: string) {
  activePlatformId.value = id;
  fillForm(activeRule.value);
}

async function loadAll() {
  loading.value = true;
  try {
    const [p, r] = await Promise.all([
      getXqListingPlatforms(),
      getXqCopyRules(),
    ]);
    platforms.value = p || [];
    rules.value = r || [];
    if (!activePlatformId.value && platforms.value[0]) {
      activePlatformId.value = platforms.value[0].id;
    }
    fillForm(activeRule.value);
  } catch (error: any) {
    message.error(error?.message || '加载平台/规则失败（请确认原库已配置）');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  syncJsonFromFields();
  try {
    JSON.parse(form.configJson);
  } catch {
    message.error('configJson 不是合法 JSON');
    return;
  }
  saving.value = true;
  try {
    await saveXqCopyRule({
      platformId: activePlatformId.value || '',
      name: form.name,
      configJson: form.configJson,
      enabled: form.enabled,
      remark: form.remark,
    });
    message.success('已保存到原库文案规则');
    await loadAll();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <Page auto-content-height>
    <div class="xq-rule">
      <div class="xq-rule-head">
        <div>
          <h2>文案管理</h2>
          <p>
            按平台配置文案规则与内容限制，平台/店铺数据来自原库
            xq_finance_test。
          </p>
        </div>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存规则
        </Button>
      </div>

      <Spin :spinning="loading">
        <div v-if="platforms.length || rules.length" class="xq-rule-layout">
          <div class="xq-rule-side">
            <div class="side-title">平台</div>
            <button
              class="side-item"
              type="button"
              :class="{ active: activePlatformId === '' }"
              @click="onSelectPlatform('')"
            >
              通用规则
            </button>
            <button
              v-for="p in platforms"
              :key="p.id"
              class="side-item"
              type="button"
              :class="{ active: activePlatformId === p.id }"
              @click="onSelectPlatform(p.id)"
            >
              <span>{{ p.name }}</span>
              <span class="code">{{ p.code }}</span>
            </button>
          </div>

          <div class="xq-rule-main">
            <div class="field">
              <label>当前平台</label>
              <Select
                :value="activePlatformId"
                :options="platformOptions"
                @change="(v: any) => onSelectPlatform(v)"
              />
            </div>
            <div class="field">
              <label>规则名称</label>
              <Input v-model:value="form.name" />
            </div>
            <div class="field row">
              <label>启用</label>
              <Switch v-model:checked="form.enabled" />
            </div>
            <div class="grid-3">
              <div class="field">
                <label>标题最大字数</label>
                <InputNumber
                  v-model:value="form.titleMaxLen"
                  :min="50"
                  :max="500"
                  class="w-full"
                  @change="syncJsonFromFields"
                />
              </div>
              <div class="field">
                <label>描述最大字数</label>
                <InputNumber
                  v-model:value="form.descriptionMaxLen"
                  :min="100"
                  :max="5000"
                  class="w-full"
                  @change="syncJsonFromFields"
                />
              </div>
              <div class="field">
                <label>卖点单条字数</label>
                <InputNumber
                  v-model:value="form.featureMaxLen"
                  :min="20"
                  :max="500"
                  class="w-full"
                  @change="syncJsonFromFields"
                />
              </div>
            </div>
            <div class="grid-2">
              <div class="field">
                <label>默认卖点数</label>
                <Select
                  v-model:value="form.defaultFeatureCount"
                  :options="[
                    { label: '5 条', value: 5 },
                    { label: '8 条', value: 8 },
                  ]"
                  @change="syncJsonFromFields"
                />
              </div>
              <div class="field row">
                <label>生成标题</label>
                <Switch
                  v-model:checked="form.generateTitle"
                  @change="syncJsonFromFields"
                />
              </div>
            </div>
            <div class="field">
              <label>备注</label>
              <Input v-model:value="form.remark" />
            </div>
            <div class="field">
              <label>完整规则 JSON（高级）</label>
              <Textarea v-model:value="form.configJson" :rows="14" />
            </div>
          </div>
        </div>
        <Empty v-else description="原库暂无平台数据" />
      </Spin>
    </div>
  </Page>
</template>

<style scoped>
.xq-rule {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 16px;
}

.xq-rule-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.xq-rule-head h2 {
  margin: 0;
  font-size: 18px;
}

.xq-rule-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.xq-rule-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 16px;
  min-height: 560px;
}

.xq-rule-side,
.xq-rule-main {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.xq-rule-side {
  padding: 12px;
}

.side-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
}

.side-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.side-item:hover,
.side-item.active {
  background: #f0f7ff;
}

.side-item .code {
  font-size: 11px;
  color: #9ca3af;
}

.xq-rule-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.row {
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.field label {
  font-size: 12px;
  color: #6b7280;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.w-full {
  width: 100%;
}

@media (max-width: 900px) {
  .xq-rule-layout,
  .grid-3,
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
