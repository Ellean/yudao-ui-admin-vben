<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Checkbox,
  Empty,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getSimpleUserList } from '#/api/system/user';
import { getXqListingPlatforms, getXqListingShops } from '#/api/xq/listing';
import {
  batchAssignXqWorkOrderImage,
  getXqWorkOrderPage,
} from '#/api/xq/work-order';

const userStore = useUserStore();
const myUserId = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  return Number(info?.userId || info?.id || 0) || undefined;
});

const loading = ref(false);
const assigning = ref(false);
const keyword = ref('');
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const selectedMap = ref<Record<number, XqWorkOrderApi.WorkOrder>>({});

const assignOpen = ref(false);
const imageUserId = ref<number | undefined>();
const platformId = ref<string | undefined>();
const shopId = ref<string | undefined>();
const users = ref<SystemUserApi.User[]>([]);
const platforms = ref<XqListingApi.Platform[]>([]);
const shops = ref<XqListingApi.Shop[]>([]);

const selectedCount = computed(() => Object.keys(selectedMap.value).length);
const unassignedSelected = computed(() =>
  Object.values(selectedMap.value).filter((t) => !t.imageUserId),
);

const queryParams = reactive({
  keyword: '' as string | undefined,
});

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  return row.generatedImageUrl || row.coverUrl || undefined;
}

function isSelected(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.id && selectedMap.value[row.id]);
}

function toggleSelect(row: XqWorkOrderApi.WorkOrder, checked?: boolean) {
  if (!row.id) return;
  const id = row.id;
  const on = checked === undefined ? !selectedMap.value[id] : checked;
  selectedMap.value = on
    ? { ...selectedMap.value, [id]: row }
    : Object.fromEntries(
        Object.entries(selectedMap.value).filter(([k]) => Number(k) !== id),
      );
}

function clearSelection() {
  selectedMap.value = {};
}

async function loadTasks() {
  if (!myUserId.value) {
    message.warning('未获取到当前用户，请重新登录');
    return;
  }
  loading.value = true;
  try {
    const res = await getXqWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: queryParams.keyword || undefined,
      status: 10,
      copyUserId: myUserId.value,
      copyReady: true,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.keyword = keyword.value.trim() || undefined;
  pageNo.value = 1;
  loadTasks();
}

function onPageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  loadTasks();
}

async function openAssign() {
  if (unassignedSelected.value.length === 0) {
    message.warning('请勾选尚未分配美工、且文案已完成的任务');
    return;
  }
  assignOpen.value = true;
  if (users.value.length === 0) {
    users.value = (await getSimpleUserList()) || [];
  }
  if (platforms.value.length === 0) {
    try {
      platforms.value = (await getXqListingPlatforms()) || [];
    } catch {
      platforms.value = [];
    }
  }
}

async function onPlatformChange(id?: string) {
  platformId.value = id;
  shopId.value = undefined;
  if (!id) {
    shops.value = [];
    return;
  }
  shops.value = (await getXqListingShops(id)) || [];
}

async function confirmAssign() {
  if (!imageUserId.value) {
    message.warning('请选择美工人员');
    return;
  }
  const ids = unassignedSelected.value
    .map((t) => t.id)
    .filter((id): id is number => Boolean(id));
  if (ids.length === 0) return;
  assigning.value = true;
  try {
    const n = await batchAssignXqWorkOrderImage({
      ids,
      imageUserId: imageUserId.value,
      listingPlatformId: platformId.value,
      listingShopId: shopId.value,
    });
    message.success(`已分配 ${n} 个任务给美工`);
    assignOpen.value = false;
    clearSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '分配失败');
  } finally {
    assigning.value = false;
  }
}

onMounted(loadTasks);
</script>

<template>
  <Page auto-content-height>
    <div class="xq-copy-pool">
      <div class="xq-toolbar">
        <div class="xq-title-block">
          <h2>我的文案</h2>
          <p>仅显示：本人领取 + 文案已完成。可批量分配给美工。</p>
        </div>
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-search"
          placeholder="搜索任务号 / Item Code / 标题"
          enter-button="搜索"
          @search="handleSearch"
        />
        <Button
          type="primary"
          :disabled="unassignedSelected.length === 0"
          @click="openAssign"
        >
          批量分配美工
          {{
            unassignedSelected.length ? `(${unassignedSelected.length})` : ''
          }}
        </Button>
        <Button v-if="selectedCount" @click="clearSelection">清空选择</Button>
      </div>

      <Spin :spinning="loading">
        <div v-if="tasks.length" class="xq-grid">
          <div
            v-for="row in tasks"
            :key="row.id"
            class="xq-card"
            :class="{ selected: isSelected(row) }"
          >
            <div
              class="xq-check"
              @click.stop="toggleSelect(row, !isSelected(row))"
            >
              <Checkbox :checked="isSelected(row)" />
            </div>
            <div class="xq-cover">
              <Image :src="coverOf(row)" :preview="false" />
              <Tag
                class="xq-badge"
                :color="row.imageUserId ? 'success' : 'processing'"
              >
                {{ row.imageUserId ? '已分配美工' : '待分配美工' }}
              </Tag>
            </div>
            <div class="xq-body">
              <div class="xq-sku">
                Item Code: <b>{{ row.externalSku }}</b>
              </div>
              <div class="xq-name">{{ row.title }}</div>
              <div class="xq-copy">{{ row.contentTitle }}</div>
              <div class="xq-meta">
                <span>{{ row.no }}</span>
                <span>{{ row.categoryName || '未分类' }}</span>
              </div>
            </div>
          </div>
        </div>
        <Empty
          v-else
          description="暂无数据：请先在任务列表多选「批量生成文案」"
        />
      </Spin>

      <div v-if="total > 0" class="xq-pager">
        <Pagination
          :current="pageNo"
          :page-size="pageSize"
          :total="total"
          show-size-changer
          @change="onPageChange"
        />
      </div>
    </div>

    <Modal
      v-model:open="assignOpen"
      title="批量分配美工"
      :confirm-loading="assigning"
      ok-text="确认分配"
      @ok="confirmAssign"
    >
      <div class="xq-assign-form">
        <label>美工人员</label>
        <Select
          v-model:value="imageUserId"
          show-search
          option-filter-prop="label"
          placeholder="选择美工"
          :options="
            users.map((u) => ({
              label: `${u.nickname || u.username} (#${u.id})`,
              value: u.id,
            }))
          "
        />
        <label>上架平台（原库，可选）</label>
        <Select
          v-model:value="platformId"
          allow-clear
          placeholder="选择平台"
          :options="
            platforms.map((p) => ({
              label: `${p.name} (${p.code})`,
              value: p.id,
            }))
          "
          @change="(v: any) => onPlatformChange(v)"
        />
        <label>店铺（可选）</label>
        <Select
          v-model:value="shopId"
          allow-clear
          placeholder="选择店铺"
          :options="shops.map((s) => ({ label: s.name, value: s.id }))"
        />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-copy-pool {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px 16px;
}

.xq-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.xq-title-block {
  flex: 1;
  min-width: 220px;
}

.xq-title-block h2 {
  margin: 0;
  font-size: 18px;
}

.xq-title-block p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.xq-search {
  width: 280px;
}

.xq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.xq-card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.xq-card.selected {
  border-color: #1677ff;
}

.xq-check {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 2px 4px;
  background: rgb(255 255 255 / 92%);
  border-radius: 6px;
}

.xq-cover {
  position: relative;
  aspect-ratio: 1;
  background: #f8fafc;
}

.xq-cover :deep(.ant-image),
.xq-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  margin: 0;
}

.xq-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.xq-sku {
  font-size: 12px;
}

.xq-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  white-space: nowrap;
}

.xq-copy {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 12px;
  color: #4b5563;
  -webkit-box-orient: vertical;
}

.xq-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
}

.xq-pager {
  display: flex;
  justify-content: flex-end;
}

.xq-assign-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-assign-form label {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}
</style>
