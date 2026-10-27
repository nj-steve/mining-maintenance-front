<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDivider,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NProgress,
  NSelect,
  NSpace,
  NStatistic,
  NTag,
  NText,
  NTooltip,
  useMessage
} from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';
import {
  fetchFaultImportSummary,
  type FaultImportSummaryItem,
  type FaultImportSummaryTotal
} from '@/service/api/faults';
import { fetchSites } from '@/service/api/site';
import FaultImportBatchDrawer from './components/FaultImportBatchDrawer.vue';

const { t } = useI18n();
const message = useMessage();

const searchForm = ref({
  site_id: null as number | null,
  time_range: null as [string, string] | null
});

// 当前选中的快捷时间范围：7 / 30 / 0（全部）/ null（自定义）
const activeRange = ref<number | null>(7);

const dataList = ref<FaultImportSummaryItem[]>([]);
const loading = ref(false);

// 汇总数据（来自后端 summary，全量筛选结果聚合）
const summary = ref<FaultImportSummaryTotal>({
  page: 1,
  page_size: 10,
  pages: 0,
  import_count: 0,
  success_count: 0,
  failure_count: 0,
  site_count: 0
});

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onChange: (page: number) => {
    pagination.value.page = page;
    loadData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    loadData();
  }
});

async function loadData() {
  loading.value = true;
  try {
    const res = await fetchFaultImportSummary({
      site_id: searchForm.value.site_id ?? undefined,
      start_time: searchForm.value.time_range?.[0] || undefined,
      end_time: searchForm.value.time_range?.[1] || undefined,
      page: pagination.value.page,
      page_size: pagination.value.pageSize
    });

    const payload = res.data;
    if (!payload) {
      dataList.value = [];
      pagination.value.itemCount = 0;
      return;
    }

    dataList.value = Array.isArray(payload.list) ? payload.list : [];

    // 总条数：后端 pagination.import_count 即筛选后总记录数
    pagination.value.itemCount = Number(payload.pagination?.import_count ?? 0);

    // 聚合统计：后端 summary 才是完整聚合（pagination 里只有 import_count 有值）
    if (payload.summary) {
      summary.value = { ...summary.value, ...payload.summary };
    }
  } catch (err) {
    message.error(t('page.faultImportSummary.loadFailed'));
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.value.page = 1;
  loadData();
}

function onReset() {
  searchForm.value = { site_id: null, time_range: buildTimeRange(7) };
  activeRange.value = 7;
  pagination.value.page = 1;
  loadData();
}

// 构造快捷时间范围：days=0 表示不限制
function buildTimeRange(days: number): [string, string] | null {
  if (days === 0) return null;
  return [
    dayjs().subtract(days, 'day').format('YYYY-MM-DD 00:00:00'),
    dayjs().format('YYYY-MM-DD 23:59:59')
  ];
}

function applyQuickRange(days: number) {
  searchForm.value.time_range = buildTimeRange(days);
  activeRange.value = days;
  onSearch();
}

// 手动选择时间范围后，取消快捷按钮的高亮
function onTimeRangeChange() {
  activeRange.value = null;
  onSearch();
}

const siteOptions = ref<SelectOption[]>([]);

// 场地名称渲染：超出宽度省略，鼠标悬停显示完整名称
function renderSiteLabel(option: SelectOption) {
  const label = String(option.label ?? '');
  return h(
    NTooltip,
    { trigger: 'hover', placement: 'bottom' },
    {
      trigger: () =>
        h(
          'div',
          {
            class: 'w-full overflow-hidden text-ellipsis whitespace-nowrap',
            style: { maxWidth: '100%' }
          },
          label
        ),
      default: () => h('div', { class: 'max-w-360px break-words' }, label)
    }
  );
}

async function loadSiteOptions() {
  try {
    const res = await fetchSites({ page: 1, limit: 500 });
    const list = res.data?.data?.list ?? res.data?.list ?? [];
    siteOptions.value = (list as any[]).map(s => ({
      label: s.name ?? s.site_name ?? `Site #${s.id}`,
      value: s.id
    }));
  } catch (err) {
    console.error(err);
    siteOptions.value = [];
  }
}

const successRate = computed(() => {
  const totalCount = summary.value.success_count + summary.value.failure_count;
  if (!totalCount) return 0;
  return Number(((summary.value.success_count / totalCount) * 100).toFixed(1));
});

const statCards = computed(() => [
  {
    key: 'import',
    label: t('page.faultImportSummary.statImportCount'),
    value: summary.value.import_count,
    icon: 'mdi:file-import-outline',
    bgClass: 'bg-#e8f1ff',
    iconClass: 'text-#2f6feb'
  },
  {
    key: 'success',
    label: t('page.faultImportSummary.statSuccessCount'),
    value: summary.value.success_count,
    icon: 'mdi:check-circle-outline',
    bgClass: 'bg-#e6f7ee',
    iconClass: 'text-#18a058'
  },
  {
    key: 'failure',
    label: t('page.faultImportSummary.statFailureCount'),
    value: summary.value.failure_count,
    icon: 'mdi:alert-circle-outline',
    bgClass: 'bg-#fdeeee',
    iconClass: 'text-#d03050'
  },
  {
    key: 'site',
    label: t('page.faultImportSummary.statSiteCount'),
    value: summary.value.site_count,
    icon: 'mdi:factory',
    bgClass: 'bg-#f3e8ff',
    iconClass: 'text-#7c4dff'
  }
]);

const statusTagType = (status: number) => (status === 1 ? 'success' : 'error');

// ============== 批次详情抽屉 ==============
const batchDrawerShow = ref(false);
const currentBatchId = ref<number | null>(null);

// 点击失败数：打开批次详情抽屉，按批次精确关联错误明细
function openBatchDetail(row: FaultImportSummaryItem) {
  if (!row.import_batch_id || row.import_batch_id <= 0) {
    message.warning(t('page.faultImportSummary.tipNoBatchId'));
    return;
  }
  currentBatchId.value = row.import_batch_id;
  console.log(row);
  console.log(row.import_batch_id);
  batchDrawerShow.value = true;
}

// 处理成功后刷新统计（失败数会变化）
function onBatchProcessed() {
  loadData();
}

const columns = computed<DataTableColumns<FaultImportSummaryItem>>(() => [
  { title: t('page.faultImportSummary.colId'), key: 'id', width: 80 },
  {
    title: t('page.faultImportSummary.colSiteName'),
    key: 'site_name',
    width: 180,
    ellipsis: { tooltip: true },
    render: row =>
      h(NSpace, { size: 6, align: 'center' }, {
        default: () => [
          h(NText, { depth: 1 }, { default: () => row.site_name || '-' }),
          h(NTag, { size: 'tiny', type: 'default', bordered: false }, { default: () => `#${row.site_id}` })
        ]
      })
  },
  {
    title: t('page.faultImportSummary.colFileName'),
    key: 'file_name',
    minWidth: 180,
    ellipsis: { tooltip: true },
    render: row =>
      h(NSpace, { size: 6, align: 'center' }, {
        default: () => [
          h(Icon, { icon: 'mdi:file-excel-outline', width: 16, height: 16, class: 'text-#18a058' }),
          h(NText, { depth: 1 }, { default: () => row.file_name || '-' })
        ]
      })
  },
  {
    title: t('page.faultImportSummary.colOperator'),
    key: 'user_name',
    width: 120,
    render: row => h(NText, { depth: 2 }, { default: () => row.user_name || '-' })
  },
  {
    title: t('page.faultImportSummary.colSuccessCount'),
    key: 'success_count',
    width: 110,
    align: 'center',
    render: row =>
      h(
        NTag,
        { type: row.success_count > 0 ? 'success' : 'default', size: 'small', bordered: false },
        { default: () => String(row.success_count ?? 0) }
      )
  },
  {
    title: t('page.faultImportSummary.colFailureCount'),
    key: 'failure_count',
    width: 110,
    align: 'center',
    render: row => {
      const count = Number(row.failure_count ?? 0);
      if (count <= 0) {
        return h(
          NTag,
          { type: 'default', size: 'small', bordered: false },
          { default: () => '0' }
        );
      }
      return h(
        NTooltip,
        { trigger: 'hover' },
        {
          trigger: () =>
            h(
              NTag,
              {
                type: 'error',
                size: 'small',
                bordered: false,
                style: { cursor: 'pointer' },
                onClick: () => openBatchDetail(row)
              },
              { default: () => String(count) }
            ),
          default: () => t('page.faultImportSummary.tipViewImportErrors')
        }
      );
    }
  },
  {
    title: t('page.faultImportSummary.colStatus'),
    key: 'status',
    width: 100,
    align: 'center',
    render: row =>
      h(
        NTag,
        { type: statusTagType(row.status), size: 'small', round: true },
        {
          default: () =>
            row.status === 1
              ? t('page.faultImportSummary.statusSuccess')
              : t('page.faultImportSummary.statusFailed')
        }
      )
  },
  {
    title: t('page.faultImportSummary.colCreateTime'),
    key: 'create_time',
    width: 170,
    render: row => h(NText, { depth: 2 }, { default: () => row.create_time || '-' })
  },
  {
    title: t('page.faultImportSummary.colErrorMessage'),
    key: 'error_message',
    minWidth: 220,
    ellipsis: { tooltip: true },
    render: row =>
      row.error_message
        ? h(NText, { type: 'error', depth: 1 }, { default: () => row.error_message })
        : h(NText, { depth: 3 }, { default: () => '-' })
  }
]);

onMounted(() => {
  // 默认展示近 3 天的导入信息
  searchForm.value.time_range = buildTimeRange(3);
  activeRange.value = 3;
  loadData();
  loadSiteOptions();
});
</script>

<template>
  <div class="p-16px">
    <NGrid cols="1 m:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
      <NGi v-for="card in statCards" :key="card.key">
        <NCard :bordered="false" class="rd-8px shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-13px text-gray-500 dark:text-gray-400">{{ card.label }}</p>
              <NStatistic :value="card.value" class="mt-8px" />
            </div>
            <div class="rd-10px p-10px" :class="card.bgClass">
              <Icon :icon="card.icon" :width="26" :height="26" :class="card.iconClass" />
            </div>
          </div>
        </NCard>
      </NGi>
    </NGrid>

    <NCard :bordered="false" class="mb-16px mt-16px rd-8px shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div class="flex flex-nowrap items-center gap-12px overflow-hidden whitespace-nowrap">
          <NForm
            :model="searchForm"
            label-placement="left"
            label-width="auto"
            :show-feedback="false"
            class="flex flex-nowrap items-center whitespace-nowrap"
          >
            <NFormItem  class="whitespace-nowrap" style="margin-right: 12px;">
              <NSelect
                v-model:value="searchForm.site_id"
                :options="siteOptions"
                :placeholder="t('page.faultImportSummary.placeholderSiteAll')"
                :render-label="renderSiteLabel"
                :theme-overrides="{
                  // fontSizeSmall: '13px',
                  // fontSizeMedium: '13px',
                  // heightSmall: '28px',
                  // heightMedium: '28px'
                }"
                filterable
                clearable
                size="small"
                style="width: 180px"
                @update:value="onSearch"
              />
            </NFormItem>

            <NFormItem :label="t('page.faultImportSummary.labelTimeRange')" class="whitespace-nowrap">
              <NDatePicker
                v-model:formatted-value="searchForm.time_range"
                type="datetimerange"
                value-format="yyyy-MM-dd HH:mm:ss"
                clearable
                start-placeholder="start"
                end-placeholder="end"
                size="small"
                style="width: 340px"
                @update:formatted-value="onTimeRangeChange"
              />
            </NFormItem>
          </NForm>
          <NSpace :size="8" :wrap="false">
            <!-- <NButton type="primary" @click="onSearch">
              <template #icon>
                <Icon icon="mdi:magnify" />
              </template>
              {{ t('page.faultImportSummary.btnSearch') }}
            </NButton> -->
            <NButton @click="onReset">{{ t('page.faultImportSummary.btnReset') }}</NButton>
            <NButton quaternary @click="loadData">
              <template #icon>
                <Icon icon="mdi:refresh" />
              </template>
              {{ t('page.faultImportSummary.btnRefresh') }}
            </NButton>
          </NSpace>
        </div>

        <NSpace :size="8">
          <NButton size="small" @click="applyQuickRange(7)">{{ t('page.faultImportSummary.last7Days') }}</NButton>
          <NButton size="small" @click="applyQuickRange(30)">{{ t('page.faultImportSummary.last30Days') }}</NButton>
          <NButton size="small" @click="applyQuickRange(0)">{{ t('page.faultImportSummary.all') }}</NButton>
        </NSpace>
      </div>
      <!-- <NDivider class="my-12px" /> -->
      <!-- <div class="flex flex-wrap items-center gap-24px">
        <div class="w-260px">
          <div class="flex items-center justify-between text-12px">
            <span class="text-gray-500 dark:text-gray-400">{{ t('page.faultImportSummary.statSuccessRate') }}</span>
            <span class="font-600 text-#18a058">{{ successRate }}%</span>
          </div>
          <NProgress
            type="line"
            :percentage="successRate"
            :height="8"
            :border-radius="4"
            color="#18a058"
            rail-color="rgba(24, 160, 88, 0.15)"
            indicator-placement="inside"
          />
        </div>
        <NText depth="3" class="text-12px">
          {{ t('page.faultImportSummary.statSuccessCount') }}: {{ summary.success_count }}
          &nbsp;·&nbsp;
          {{ t('page.faultImportSummary.statFailureCount') }}: {{ summary.failure_count }}
          &nbsp;·&nbsp;
          {{ t('page.faultImportSummary.statImportCount') }}: {{ summary.import_count }}
        </NText>
      </div> -->
    </NCard>

    <NCard :bordered="false" class="rd-8px shadow-sm">
      <NDataTable
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FaultImportSummaryItem) => row.id"
        :scroll-x="1500"
        remote
        striped
        flex-height
        style="min-height: 520px"
      />
    </NCard>

    <!-- 批次详情抽屉：按 import_batch_id 精确关联错误明细 -->
    <FaultImportBatchDrawer
      v-model:show="batchDrawerShow"
      :batch-id="currentBatchId"
      @processed="onBatchProcessed"
    />
  </div>
</template>
