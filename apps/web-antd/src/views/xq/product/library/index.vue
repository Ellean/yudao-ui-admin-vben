<script lang="ts" setup>
import type { XqProductApi } from '#/api/xq/product';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Empty,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  getXqCategoryTree,
  getXqProduct,
  getXqProductPage,
} from '#/api/xq/product';

const loading = ref(false);
const catLoading = ref(false);
const catOpen = ref(false);
const keyword = ref('');
const categoryTree = ref<XqProductApi.CategoryNode[]>([]);
/** 面板内浏览态（展开 hover 用，不直接筛产品） */
const browseL1 = ref<null | XqProductApi.CategoryNode>(null);
const browseL2 = ref<null | XqProductApi.CategoryNode>(null);
/** 已确认筛选 */
const filterL1 = ref<null | XqProductApi.CategoryNode>(null);
const filterL2 = ref<null | XqProductApi.CategoryNode>(null);
const filterL3 = ref<null | XqProductApi.CategoryNode>(null);

const products = ref<XqProductApi.Product[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<null | XqProductApi.Product>(null);

const l2List = computed(() => browseL1.value?.children || []);
const l3List = computed(() => browseL2.value?.children || []);

const categoryLabel = computed(() => {
  const parts = [
    filterL1.value?.name,
    filterL2.value?.name,
    filterL3.value?.name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Categories 类别';
});

const filterCategoryId = computed(() => {
  return (
    filterL3.value?.id || filterL2.value?.id || filterL1.value?.id || undefined
  );
});

const queryParams = reactive({
  name: '' as string | undefined,
  gigaCategoryId: undefined as number | undefined,
});

function selectL1(item: XqProductApi.CategoryNode) {
  browseL1.value = item;
  browseL2.value = item.children?.[0] || null;
}

function selectL2(item: XqProductApi.CategoryNode) {
  browseL2.value = item;
}

function selectL3(item: XqProductApi.CategoryNode) {
  filterL1.value = browseL1.value;
  filterL2.value = browseL2.value;
  filterL3.value = item;
  catOpen.value = false;
}

function clearCategory() {
  filterL1.value = null;
  filterL2.value = null;
  filterL3.value = null;
}

function toggleCategoryPanel() {
  catOpen.value = !catOpen.value;
  if (catOpen.value && !browseL1.value && categoryTree.value.length > 0) {
    selectL1(categoryTree.value[0]!);
  }
}

async function loadCategories() {
  catLoading.value = true;
  try {
    categoryTree.value = (await getXqCategoryTree()) || [];
  } catch (error: any) {
    message.error(error?.message || '类目加载失败');
  } finally {
    catLoading.value = false;
  }
}

async function loadProducts() {
  loading.value = true;
  try {
    const res = await getXqProductPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      name: queryParams.name || undefined,
      gigaCategoryId: queryParams.gigaCategoryId,
    });
    products.value = res?.list || [];
    total.value = Number(res?.total || 0);
  } catch (error: any) {
    message.error(error?.message || '产品加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.name = keyword.value.trim() || undefined;
  pageNo.value = 1;
  loadProducts();
}

watch(filterCategoryId, (id) => {
  queryParams.gigaCategoryId = id;
  pageNo.value = 1;
  loadProducts();
});

async function openDetail(item: XqProductApi.Product) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = item;
  try {
    if (item.id) {
      detail.value = await getXqProduct(item.id);
    }
  } finally {
    detailLoading.value = false;
  }
}

function formatMoney(value?: null | number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  const n = Number(value);
  // 业务上 0 视为无价
  if (n <= 0) return null;
  return n.toFixed(2);
}

function imgBadgeText(item: XqProductApi.Product) {
  const n = item.imageCount || item.imageUrls?.length || 0;
  if (n > 1) return `${n} imgs`;
  return item.listedTag || '';
}

function detailGallery(item: null | XqProductApi.Product) {
  if (!item) return [];
  const urls = [...(item.imageUrls || [])];
  if (item.imageUrl && !urls.includes(item.imageUrl)) {
    urls.unshift(item.imageUrl);
  }
  return urls;
}

function formatCreateTime(value?: string) {
  if (!value) return '—';
  if (/^\d+$/.test(value)) {
    const n = Number(value);
    const d = new Date(n > 1e12 ? n : n * 1000);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString();
    }
  }
  return value.replace('T', ' ').slice(0, 19);
}

function onPageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  loadProducts();
}

onMounted(async () => {
  await loadCategories();
  await loadProducts();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-library">
      <div class="xq-toolbar">
        <button
          class="xq-cat-trigger"
          type="button"
          :class="{ open: catOpen }"
          @click="toggleCategoryPanel"
        >
          <IconifyIcon icon="lucide:menu" class="xq-cat-trigger-icon" />
          <span class="xq-cat-trigger-text">{{ categoryLabel }}</span>
          <IconifyIcon
            :icon="catOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="xq-cat-trigger-arrow"
          />
        </button>
        <button
          v-if="filterL1 || filterL2 || filterL3"
          class="xq-cat-clear"
          type="button"
          @click="clearCategory"
        >
          清除筛选
        </button>
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-search-input"
          placeholder="搜索 SKU / Item Code / 名称"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>

      <!-- Giga 三列级联分类：默认收起 -->
      <div v-show="catOpen" class="xq-cat-panel">
        <Spin :spinning="catLoading">
          <div v-if="categoryTree.length" class="category-cascader">
            <div class="col col-l1">
              <div
                v-for="item in categoryTree"
                :key="`l1-${item.id}`"
                class="l1-item"
                :class="{ active: browseL1?.id === item.id }"
                @mouseenter="selectL1(item)"
                @click="selectL1(item)"
              >
                <span class="name">{{ item.name }}</span>
                <span class="arrow">›</span>
              </div>
            </div>

            <div class="col col-l2">
              <div
                v-for="item in l2List"
                :key="`l2-${item.id}-${item.pathIds}`"
                class="l2-item"
                :class="{
                  active:
                    browseL2?.id === item.id &&
                    browseL2?.pathIds === item.pathIds,
                }"
                @mouseenter="selectL2(item)"
                @click="selectL2(item)"
              >
                <span
                  class="name"
                  :class="{ bold: browseL2?.id === item.id }"
                  >{{ item.name }}</span>
                <span v-if="item.children?.length" class="arrow">›</span>
              </div>
              <Empty
                v-if="!l2List.length"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无二级类目"
              />
            </div>

            <div class="col col-l3">
              <div class="l3-title">{{ browseL2?.name || '—' }}</div>
              <div v-if="l3List.length" class="l3-grid">
                <button
                  v-for="item in l3List"
                  :key="`l3-${item.id}-${item.pathIds}`"
                  class="l3-card"
                  :class="{ active: filterL3?.id === item.id }"
                  type="button"
                  @click="selectL3(item)"
                >
                  <div class="l3-avatar">
                    <img
                      v-if="item.imagePath"
                      :src="item.imagePath"
                      :alt="item.name"
                      loading="lazy"
                    />
                    <span v-else class="l3-fallback">{{
                      item.name?.slice(0, 1) || '?'
                    }}</span>
                  </div>
                  <div class="l3-name">{{ item.name }}</div>
                </button>
              </div>
              <Empty
                v-else
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无三级类目"
              />
            </div>
          </div>
          <Empty v-else-if="!catLoading" description="暂无类目数据" />
        </Spin>
      </div>

      <div class="xq-section-title">
        产品
        <span v-if="filterL1" class="xq-path">
          ·
          {{
            [filterL1?.name, filterL2?.name, filterL3?.name]
              .filter(Boolean)
              .join(' / ')
          }}
        </span>
      </div>

      <Spin :spinning="loading">
        <div v-if="products.length" class="xq-product-grid">
          <div
            v-for="item in products"
            :key="item.id"
            class="xq-product-card"
            @click="openDetail(item)"
          >
            <div class="xq-card-cover">
              <Image
                :src="item.imageUrl || undefined"
                :preview="false"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' text-anchor='middle' dy='.3em' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E"
              />
              <span v-if="imgBadgeText(item)" class="xq-img-badge">{{
                imgBadgeText(item)
              }}</span>
            </div>
            <div class="xq-card-body">
              <div class="xq-item-code">
                Item Code:
                <b>{{ item.itemCode || item.sku }}</b>
              </div>
              <div class="xq-price-block">
                <div class="xq-price-line">
                  <span class="xq-price-label">原价</span>
                  <span v-if="formatMoney(item.price)" class="xq-price-main">
                    ${{ formatMoney(item.price) }}
                  </span>
                  <span v-else class="xq-price-muted">—</span>
                </div>
                <div class="xq-price-line">
                  <span class="xq-price-label">折扣价</span>
                  <span
                    v-if="formatMoney(item.discountedPrice)"
                    class="xq-price-sale"
                  >
                    ${{ formatMoney(item.discountedPrice) }}
                  </span>
                  <span v-else class="xq-price-muted">—</span>
                </div>
              </div>
              <div class="xq-qty">
                Qty Available
                <span>{{ item.qtyAvailable ?? '---' }}</span>
              </div>
              <Tag v-if="item.listedTag" color="orange" class="xq-listed-tag">
                {{ item.listedTag }}
              </Tag>
              <div class="xq-supplier">
                <span>{{ item.supplierCode || '—' }}</span>
                <span class="xq-supplier-name">{{
                  item.supplierName || item.categoryName || ''
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <Empty v-else description="暂无产品" class="xq-empty" />
      </Spin>

      <div v-if="total > 0" class="xq-pager">
        <Pagination
          :current="pageNo"
          :page-size="pageSize"
          :total="total"
          show-size-changer
          :page-size-options="['12', '20', '40']"
          @change="onPageChange"
        />
      </div>
    </div>

    <Modal
      v-model:open="detailOpen"
      :title="detail?.name || '产品详情'"
      :footer="null"
      width="920px"
      destroy-on-close
      class="xq-detail-modal"
    >
      <Spin :spinning="detailLoading">
        <div v-if="detail" class="xq-detail">
          <div class="xq-detail-media">
            <Image.PreviewGroup>
              <div class="xq-gallery-main">
                <Image
                  :src="
                    detailGallery(detail)[0] || detail.imageUrl || undefined
                  "
                  :preview="true"
                  fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3C/svg%3E"
                />
              </div>
              <div
                v-if="detailGallery(detail).length > 1"
                class="xq-gallery-thumbs"
              >
                <Image
                  v-for="(url, idx) in detailGallery(detail).slice(0, 12)"
                  :key="`${url}-${idx}`"
                  :src="url"
                  :preview="true"
                  class="xq-thumb"
                />
              </div>
            </Image.PreviewGroup>
            <div v-if="detail.imageCount" class="xq-gallery-count">
              共 {{ detail.imageCount }} 张图
            </div>
          </div>
          <div class="xq-detail-info">
            <div class="row">
              <label>SKU</label><span>{{ detail.sku }}</span>
            </div>
            <div class="row">
              <label>Item Code</label><span>{{ detail.itemCode || '—' }}</span>
            </div>
            <div class="row">
              <label>分类</label><span>{{ detail.categoryName || '—' }}</span>
            </div>
            <div class="row">
              <label>原价</label>
              <span>
                <template v-if="formatMoney(detail.price)">
                  {{ detail.currency || 'USD' }}
                  {{ formatMoney(detail.price) }}
                </template>
                <template v-else>—</template>
              </span>
            </div>
            <div class="row">
              <label>折扣价</label>
              <span class="xq-sale-text">
                <template v-if="formatMoney(detail.discountedPrice)">
                  {{ detail.currency || 'USD' }}
                  {{ formatMoney(detail.discountedPrice) }}
                </template>
                <template v-else>—</template>
              </span>
            </div>
            <div v-if="formatMoney(detail.exclusivePrice)" class="row">
              <label>专享价</label>
              <span>
                {{ detail.currency || 'USD' }}
                {{ formatMoney(detail.exclusivePrice) }}
              </span>
            </div>
            <div class="row">
              <label>库存</label><span>{{ detail.qtyAvailable ?? '—' }}</span>
            </div>
            <div class="row">
              <label>供应商</label>
              <span>{{ detail.supplierCode || '' }}
                {{ detail.supplierName || '' }}</span>
            </div>
            <div class="row">
              <label>备注</label><span>{{ detail.remark || '—' }}</span>
            </div>
            <div class="row">
              <label>同步时间</label><span>{{ formatCreateTime(detail.createTime) }}</span>
            </div>
          </div>
          <div v-if="detail.description" class="xq-detail-copy">
            <div class="xq-copy-title">产品文案</div>
            <div class="xq-copy-body" v-html="detail.description"></div>
          </div>
        </div>
      </Spin>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-library {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  padding: 4px 2px 16px;
}

.xq-search-bar {
  max-width: 720px;
}

.xq-search-input {
  width: 100%;
}

.xq-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.xq-cat-trigger {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  max-width: 360px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #121212;
  cursor: pointer;
  background: #111;
  border: 0;
  border-radius: 6px;
}

.xq-cat-trigger.open {
  background: #333;
}

.xq-cat-trigger-icon,
.xq-cat-trigger-arrow {
  flex: none;
  color: #fff;
}

.xq-cat-trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  white-space: nowrap;
}

.xq-cat-clear {
  padding: 8px 12px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.xq-toolbar .xq-search-input {
  flex: 1;
  min-width: 220px;
  max-width: 480px;
}

.xq-cat-panel {
  margin-top: -4px;
}

.category-cascader {
  display: grid;
  grid-template-columns: 240px 260px 1fr;
  min-height: 420px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.col {
  max-height: 520px;
  overflow: auto;
}

.col-l1 {
  padding: 12px 0;
  background: #fafafa;
  border-right: 1px solid #eee;
}

.col-l2 {
  padding: 12px 0;
  background: #fff;
  border-right: 1px solid #eee;
}

.col-l3 {
  padding: 16px 20px 24px;
}

.l1-item,
.l2-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  font-size: 14px;
  color: #121212;
  cursor: pointer;
}

.l1-item:hover,
.l2-item:hover,
.l1-item.active,
.l2-item.active {
  background: #f0f0f0;
}

.l2-item .name.bold {
  font-weight: 700;
}

.arrow {
  font-size: 16px;
  line-height: 1;
  color: #999;
}

.l3-title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #121212;
}

.l3-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px 16px;
}

.l3-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  color: #121212;
  text-align: center;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.l3-card:hover .l3-name,
.l3-card.active .l3-name {
  color: #004bd8;
}

.l3-card.active .l3-avatar {
  box-shadow: 0 0 0 2px #004bd8;
}

.l3-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 8px;
  overflow: hidden;
  background: #f3f3f3;
  border-radius: 40px;
}

.l3-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.l3-fallback {
  font-size: 22px;
  color: #999;
}

.l3-name {
  max-width: 140px;
  font-size: 13px;
  line-height: 1.35;
}

.xq-section-title {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #121212;
}

.xq-path {
  font-size: 13px;
  font-weight: 400;
  color: #666;
}

.xq-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.xq-product-card {
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.xq-product-card:hover {
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  transform: translateY(-2px);
}

.xq-card-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
}

.xq-card-cover :deep(.ant-image) {
  width: 100%;
  height: 100%;
}

.xq-card-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-img-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 8px;
  font-size: 11px;
  color: #fff;
  background: rgb(0 0 0 / 45%);
  border-radius: 999px;
}

.xq-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.xq-item-code {
  font-size: 13px;
  color: #111;
}

.xq-price-row {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.xq-price-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.xq-price-line {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 13px;
}

.xq-price-label {
  width: 42px;
  font-size: 12px;
  color: #9ca3af;
}

.xq-price-main {
  font-weight: 600;
  color: #111;
}

.xq-price-sale {
  font-weight: 700;
  color: #dc2626;
}

.xq-price-muted {
  color: #9ca3af;
}

.xq-lock {
  font-size: 12px;
  color: #9ca3af;
}

.xq-qty {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.xq-listed-tag {
  align-self: flex-start;
  margin: 0;
}

.xq-supplier {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.xq-supplier-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.xq-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.xq-empty {
  padding: 48px 0;
}

.xq-detail {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

.xq-detail-media :deep(img) {
  width: 100%;
  border-radius: 10px;
}

.xq-gallery-main {
  overflow: hidden;
  background: #f8fafc;
  border-radius: 10px;
}

.xq-gallery-thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.xq-gallery-thumbs :deep(.ant-image) {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 6px;
}

.xq-gallery-thumbs :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-gallery-count {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.xq-detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.xq-detail-info .row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  font-size: 14px;
}

.xq-detail-info label {
  color: #6b7280;
}

.xq-sale-text {
  font-weight: 700;
  color: #dc2626;
}

.xq-detail-copy {
  grid-column: 1 / -1;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.xq-copy-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
}

.xq-copy-body {
  max-height: 360px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.xq-copy-body :deep(img) {
  max-width: 100%;
  height: auto;
}

@media (max-width: 1100px) {
  .category-cascader {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .col {
    max-height: none;
    border-right: 0;
    border-bottom: 1px solid #eee;
  }

  .l3-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .xq-detail {
    grid-template-columns: 1fr;
  }
}
</style>
