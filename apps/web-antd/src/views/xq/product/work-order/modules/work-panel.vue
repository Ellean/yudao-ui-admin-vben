<script lang="ts" setup>
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Empty,
  Image,
  Input,
  message,
  Steps,
  Textarea,
} from 'ant-design-vue';

import {
  completeXqWorkOrder,
  generateXqWorkOrderCopy,
  generateXqWorkOrderImage,
  getXqWorkOrder,
  updateXqWorkOrder,
} from '#/api/xq/work-order';

const props = defineProps<{
  taskId?: null | number;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const saving = ref(false);
const task = ref<null | XqWorkOrderApi.WorkOrder>(null);
/** 允许查看已完成步骤，当前可操作步骤由数据决定 */
const viewStep = ref(0);

const copyForm = reactive({
  contentTitle: '',
  contentSellingPoints: '',
});

const listForm = reactive({
  productSku: '',
  productName: '',
  categoryName: '',
});

const isDoing = computed(() => task.value?.status === 10);
const copyReady = computed(() => Boolean(task.value?.contentTitle?.trim()));
const imageReady = computed(() =>
  Boolean(task.value?.generatedImageUrl?.trim()),
);

/** 数据决定的当前应处理步骤 0文案 1图片 2上架 3完成 */
const progressStep = computed(() => {
  if (!task.value) return 0;
  if (task.value.status === 20) return 3;
  if (!copyReady.value) return 0;
  if (!imageReady.value) return 1;
  return 2;
});

const stepItems = computed(() => [
  {
    title: '文案',
    description: copyReady.value ? '已完成' : 'AI 生成 / 编辑',
    status: stepStatus(0),
  },
  {
    title: '图片',
    description: imageReady.value ? '已完成' : '需先完成文案',
    status: stepStatus(1),
  },
  {
    title: '上架',
    description: task.value?.status === 20 ? '已上架' : '需先完成图片',
    status: stepStatus(2),
  },
]);

function stepStatus(index: number): 'error' | 'finish' | 'process' | 'wait' {
  const cur = progressStep.value;
  if (cur === 3) return 'finish';
  if (index < cur) return 'finish';
  if (index === cur) return 'process';
  return 'wait';
}

function coverOf(row: null | XqWorkOrderApi.WorkOrder) {
  if (!row) return undefined;
  return row.generatedImageUrl || row.coverUrl || undefined;
}

async function loadTask(id: number) {
  loading.value = true;
  try {
    task.value = await getXqWorkOrder(id);
    copyForm.contentTitle = task.value.contentTitle || '';
    copyForm.contentSellingPoints = task.value.contentSellingPoints || '';
    listForm.productSku =
      task.value.productSku ||
      (task.value.externalSku ? `SKU-${task.value.externalSku}` : '');
    listForm.productName = task.value.contentTitle || task.value.title || '';
    listForm.categoryName = task.value.categoryName || '';
    viewStep.value = Math.min(progressStep.value, 2);
  } catch (error: any) {
    message.error(error?.message || '加载任务失败');
    task.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.taskId,
  (id) => {
    if (id) {
      loadTask(id);
    } else {
      task.value = null;
    }
  },
  { immediate: true },
);

function onStepChange(current: number) {
  // 只能点到已完成步骤或当前步骤
  if (current <= progressStep.value) {
    viewStep.value = current;
  } else {
    message.warning('请按顺序完成前面的步骤');
  }
}

async function handleGenCopy() {
  if (!task.value?.id || !isDoing.value) return;
  saving.value = true;
  try {
    task.value = await generateXqWorkOrderCopy(task.value.id);
    copyForm.contentTitle = task.value.contentTitle || '';
    copyForm.contentSellingPoints = task.value.contentSellingPoints || '';
    message.success('文案已生成');
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '生成文案失败');
  } finally {
    saving.value = false;
  }
}

async function handleSaveCopyAndNext() {
  if (!task.value?.id || !isDoing.value) return;
  if (!copyForm.contentTitle.trim()) {
    message.warning('请先填写或生成文案标题');
    return;
  }
  saving.value = true;
  try {
    await updateXqWorkOrder({
      id: task.value.id,
      contentTitle: copyForm.contentTitle.trim(),
      contentSellingPoints: copyForm.contentSellingPoints.trim(),
    });
    task.value = await getXqWorkOrder(task.value.id);
    message.success('文案已保存，进入图片步骤');
    viewStep.value = 1;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '保存文案失败');
  } finally {
    saving.value = false;
  }
}

async function handleGenImageAndNext() {
  if (!task.value?.id || !isDoing.value) return;
  if (!copyReady.value) {
    message.warning('请先完成文案');
    viewStep.value = 0;
    return;
  }
  saving.value = true;
  try {
    task.value = await generateXqWorkOrderImage(task.value.id);
    message.success('图片已生成，进入上架步骤');
    viewStep.value = 2;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '生成图片失败');
  } finally {
    saving.value = false;
  }
}

async function handleList() {
  if (!task.value?.id || !isDoing.value) return;
  if (!copyReady.value) {
    message.warning('请先完成文案');
    viewStep.value = 0;
    return;
  }
  if (!imageReady.value) {
    message.warning('请先完成图片');
    viewStep.value = 1;
    return;
  }
  if (!listForm.productSku.trim() || !listForm.productName.trim()) {
    message.warning('请填写上架 SKU 与产品名称');
    return;
  }
  saving.value = true;
  try {
    const productId = await completeXqWorkOrder({
      id: task.value.id,
      productSku: listForm.productSku.trim(),
      productName: listForm.productName.trim(),
      categoryName: listForm.categoryName.trim() || undefined,
    });
    message.success(`上架完成，品库 ID=${productId}`);
    task.value = await getXqWorkOrder(task.value.id);
    viewStep.value = 2;
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '上架失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="work-panel">
    <div v-if="!taskId" class="work-empty">
      <Empty description="从左侧选择任务，按步骤处理：文案 → 图片 → 上架" />
    </div>
    <template v-else>
      <div class="work-head">
        <div class="work-head-main">
          <div class="work-sku">
            Item Code: <b>{{ task?.externalSku || '—' }}</b>
          </div>
          <div class="work-title">{{ task?.title || '加载中…' }}</div>
          <div class="work-sub">
            {{ task?.no }} · {{ task?.categoryName || '未分类' }}
          </div>
        </div>
        <Button type="text" @click="emit('close')">关闭</Button>
      </div>

      <Steps
        class="work-steps"
        size="small"
        :current="Math.min(viewStep, 2)"
        :items="stepItems"
        @change="onStepChange"
      />

      <div v-if="loading" class="work-loading">加载任务中…</div>

      <!-- Step 0: 文案 -->
      <div v-else-if="viewStep === 0" class="work-body">
        <div class="work-step-title">第 1 步 · 文案</div>
        <p class="work-hint">先生成或编辑文案，保存后才能进入图片步骤。</p>
        <div class="work-field">
          <label>文案标题</label>
          <Input
            v-model:value="copyForm.contentTitle"
            :disabled="!isDoing"
            placeholder="文案标题"
          />
        </div>
        <div class="work-field">
          <label>卖点</label>
          <Textarea
            v-model:value="copyForm.contentSellingPoints"
            :disabled="!isDoing"
            :rows="5"
            placeholder="卖点，一行一条"
          />
        </div>
        <div class="work-footer">
          <Button :disabled="!isDoing" :loading="saving" @click="handleGenCopy">
            AI 生成文案
          </Button>
          <Button
            type="primary"
            :disabled="!isDoing"
            :loading="saving"
            @click="handleSaveCopyAndNext"
          >
            保存并进入下一步
          </Button>
        </div>
      </div>

      <!-- Step 1: 图片 -->
      <div v-else-if="viewStep === 1" class="work-body">
        <div class="work-step-title">第 2 步 · 图片</div>
        <p class="work-hint">文案完成后生成图片，确认后进入上架。</p>
        <div class="work-preview">
          <Image
            :src="coverOf(task)"
            :preview="Boolean(coverOf(task))"
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' text-anchor='middle' dy='.3em' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E"
          />
        </div>
        <div v-if="imageReady" class="work-ok">AI 图片已生成</div>
        <div class="work-footer">
          <Button :disabled="progressStep < 1" @click="viewStep = 0">
            上一步
          </Button>
          <Button
            type="primary"
            :disabled="!isDoing || !copyReady"
            :loading="saving"
            @click="handleGenImageAndNext"
          >
            {{ imageReady ? '重新生成并进入上架' : 'AI 生成图片并进入下一步' }}
          </Button>
          <Button
            v-if="imageReady"
            type="primary"
            ghost
            :disabled="!isDoing"
            @click="viewStep = 2"
          >
            已有图片，进入上架
          </Button>
        </div>
      </div>

      <!-- Step 2: 上架 -->
      <div v-else class="work-body">
        <div class="work-step-title">第 3 步 · 上架</div>
        <p class="work-hint">确认文案与图片后填写上架信息并提交。</p>
        <div class="work-summary">
          <div>
            <label>文案</label>
            <div>{{ task?.contentTitle || '—' }}</div>
          </div>
          <div>
            <label>图片</label>
            <div class="work-summary-img">
              <Image
                :src="coverOf(task)"
                :width="72"
                :height="72"
                :preview="Boolean(coverOf(task))"
              />
            </div>
          </div>
        </div>
        <div class="work-field">
          <label>上架 SKU</label>
          <Input
            v-model:value="listForm.productSku"
            :disabled="!isDoing"
            placeholder="公司 SKU"
          />
        </div>
        <div class="work-field">
          <label>产品名称</label>
          <Input
            v-model:value="listForm.productName"
            :disabled="!isDoing"
            placeholder="上架名称"
          />
        </div>
        <div class="work-field">
          <label>分类</label>
          <Input
            v-model:value="listForm.categoryName"
            :disabled="!isDoing"
            placeholder="分类名"
          />
        </div>
        <div class="work-footer">
          <Button :disabled="progressStep < 2" @click="viewStep = 1">
            上一步
          </Button>
          <Button
            type="primary"
            :disabled="!isDoing || !copyReady || !imageReady"
            :loading="saving"
            @click="handleList"
          >
            {{ task?.status === 20 ? '已上架' : '确认上架' }}
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.work-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 520px;
  padding: 16px 18px 20px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.work-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.work-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.work-sku {
  font-size: 13px;
  color: #111;
}

.work-title {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #121212;
}

.work-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.work-steps {
  margin-bottom: 20px;
}

.work-loading {
  padding: 48px 0;
  color: #6b7280;
  text-align: center;
}

.work-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
}

.work-step-title {
  font-size: 15px;
  font-weight: 700;
  color: #121212;
}

.work-hint {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.work-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.work-field label,
.work-summary label {
  font-size: 12px;
  color: #6b7280;
}

.work-preview {
  max-width: 280px;
  overflow: hidden;
  background: #f8fafc;
  border-radius: 10px;
}

.work-preview :deep(.ant-image),
.work-preview :deep(img) {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.work-ok {
  font-size: 13px;
  font-weight: 600;
  color: #15803d;
}

.work-summary {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.work-summary-img {
  overflow: hidden;
  border-radius: 8px;
}

.work-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  margin-top: auto;
}
</style>
