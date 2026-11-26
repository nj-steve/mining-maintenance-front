<script setup lang="ts">
import { ref, onMounted, h, reactive, computed } from 'vue';
import { NDataTable, useMessage, NDrawer, NDrawerContent, NSelect, NButton, NTag, useThemeVars } from 'naive-ui';
import { useMediaQuery } from '@vueuse/core';
import LogIcon from '~icons/ant-design/file-text-outlined';
import RefreshIcon from '~icons/ant-design/reload-outlined';
import ManagementStatusSummary from '@/components/custom/ManagementStatusSummary.vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchOperationLogs, fetchUser } from '@/service/api';
import type { OperationLog } from '@/service/api/log';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const message = useMessage();
const loading = ref(true);
const matchingCount = ref<number>();
const selectedLog = ref<OperationLog | null>(null);
const detailsOpen = ref(false);
const tableData = ref<OperationLog[]>([]);
const siteDailyReportModule = '场地日报';
const narrowLayout = useMediaQuery('(max-width: 760px)');
const theme = useThemeVars();
const themeStyle = computed(() => ({
  '--management-surface': theme.value.cardColor,
  '--management-line': theme.value.dividerColor,
  '--management-ink': theme.value.textColor1,
  '--management-muted': theme.value.textColor2,
  '--management-accent': theme.value.primaryColor
}));

const numberFormat = computed(() => new Intl.NumberFormat(locale.value));
const statusSummary = computed(() => [
  { label: t('page.operationLogs.status.success'), count: tableData.value.filter(row => row.status === 1).length, tone: '#168460' },
  { label: t('page.operationLogs.status.fail'), count: tableData.value.filter(row => row.status !== 1).length, tone: '#bd5268' }
]);

const searchParams = reactive({
  user_id: null as number | null,
  status: null as number | null,
  module: null as string | null,
  operation_type: null as string | null
});

const userOptions = ref<{ label: string; value: number }[]>([]);

const statusOptions = computed(() => [
  { label: t('page.operationLogs.status.success'), value: 1 },
  { label: t('page.operationLogs.status.fail'), value: 0 }
]);

const moduleOptions = computed(() => [
  { label: t('page.operationLogs.modules.site'), value: '场地' },
  { label: t('page.operationLogs.modules.siteDailyReport'), value: siteDailyReportModule },
  { label: t('page.operationLogs.modules.faultMachine'), value: '故障机' },
  { label: t('page.operationLogs.modules.workOrder'), value: '工单' },
  { label: t('page.operationLogs.modules.scrapMachine'), value: '报废机' },
  { label: t('page.operationLogs.modules.repairDetail'), value: '维修明细' }
]);

const operationTypeOptions = computed(() => [
  { label: t('page.operationLogs.operationTypes.create'), value: 'create' },
  { label: t('page.operationLogs.operationTypes.update'), value: 'update' },
  { label: t('page.operationLogs.operationTypes.delete'), value: 'delete' },
  { label: t('page.operationLogs.operationTypes.dispatch'), value: 'dispatch' },
  { label: t('page.operationLogs.operationTypes.import'), value: 'import' },
  { label: t('page.operationLogs.operationTypes.bindOrder'), value: 'bind_order' },
  { label: t('page.operationLogs.operationTypes.unbindOrder'), value: 'unbind_order' }
]);

const fetchUserList = async () => {
  try {
    const { data, error } = await fetchUser({ page: 1, page_size: 1000, status: 1 });
    if (!error && data?.list) {
      userOptions.value = data.list.map((user: any) => ({
        label: user.real_name || user.user_name,
        value: user.id
      }));
    }
  } catch (err) {
    console.error('Fetch users error:', err);
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  fetchData();
};

const handleReset = () => {
  searchParams.user_id = null;
  searchParams.status = null;
  searchParams.module = null;
  searchParams.operation_type = null;
  handleSearch();
};

onMounted(() => {
  fetchUserList();
  fetchData();
});

const header = (label: string) => h('span', { class: 'management-column-title' }, label);
const statusLabel = (status: number) => t(status === 1 ? 'page.operationLogs.status.success' : 'page.operationLogs.status.fail');
const formatTime = (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '—';
const moduleLabel = (value: string) => moduleOptions.value.find(option => option.value === value)?.label || value || '—';
const operationLabel = (value: string) => operationTypeOptions.value.find(option => option.value === value)?.label || value || '—';

function offShelfChange(row: OperationLog) {
  const before = row.site_daily_report?.before_off_shelf_count;
  const after = row.site_daily_report?.after_off_shelf_count;
  if (before == null && after == null) return '—';
  const count = (value?: number | null) => value == null ? '—' : numberFormat.value.format(value);
  const change = `${count(before)} → ${count(after)}`;
  if (before == null || after == null) return change;
  const delta = after - before;
  return `${change} (${delta > 0 ? '+' : ''}${count(delta)})`;
}

const siteName = (row: OperationLog) => row.site_daily_report?.site_name
  || (row.site_daily_report?.site_id ? `#${row.site_daily_report.site_id}` : '—');

function showDetails(row: OperationLog) {
  selectedLog.value = row;
  detailsOpen.value = true;
}

function formatPayload(payload?: string) {
  if (!payload) return '—';
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

const detailFields = computed(() => {
  const row = selectedLog.value;
  if (!row) return [];
  return [
    { key: 'createTime', value: formatTime(row.create_time) },
    { key: 'username', value: row.user_name },
    { key: 'module', value: moduleLabel(row.module) },
    { key: 'operationType', value: operationLabel(row.operation_type) },
    { key: 'targetTable', value: row.target_table },
    { key: 'targetId', value: row.target_id },
    { key: 'requestMethod', value: row.request_method },
    { key: 'ipAddress', value: row.ip_address },
    ...(row.site_daily_report ? [
      { key: 'siteName', value: siteName(row) },
      { key: 'downDate', value: row.site_daily_report.down_date },
      { key: 'offShelfChange', value: offShelfChange(row) }
    ] as const : [])
  ] as const;
});

const detailContent = computed(() => {
  const row = selectedLog.value;
  if (!row) return [];
  return [
    { key: 'errorMessage', value: row.error_message },
    { key: 'requestUrl', value: row.request_url },
    { key: 'requestParams', value: row.request_params },
    { key: 'beforeData', value: row.before_data },
    { key: 'afterData', value: row.after_data },
    { key: 'userAgent', value: row.user_agent }
  ] as const;
});

const showReportColumns = computed(() => searchParams.module === siteDailyReportModule
  || tableData.value.some(row => row.site_daily_report));

const reportColumns: DataTableColumns<OperationLog> = [
  {
    title: () => header(t('page.operationLogs.columns.siteName')),
    key: 'site_daily_report.site_name', width: 148, ellipsis: { tooltip: true }, render: siteName
  },
  {
    title: () => header(t('page.operationLogs.columns.downDate')),
    key: 'site_daily_report.down_date', width: 124,
    render: row => h('span', { class: 'management-contact' }, row.site_daily_report?.down_date || '—')
  },
  {
    title: () => header(t('page.operationLogs.columns.offShelfChange')),
    key: 'site_daily_report.off_shelf_change', width: 166,
    render: row => h('span', { class: 'management-entity-name logs-off-shelf-change' }, offShelfChange(row))
  }
];

const columns = computed<DataTableColumns<OperationLog>>(() => [
  {
    title: () => header(t('page.operationLogs.result')),
    key: 'status', width: 82,
    render: row => h(NTag, {
      class: 'management-status-tag', type: row.status === 1 ? 'success' : 'error', bordered: false, round: true, size: 'small'
    }, () => statusLabel(row.status))
  },
  {
    title: () => header(t('page.operationLogs.columns.createTime')),
    key: 'create_time', width: narrowLayout.value ? 154 : 178,
    render: row => h('span', { class: 'management-contact logs-time' }, formatTime(row.create_time))
  },
  {
    title: () => header(t('page.operationLogs.columns.module')),
    key: 'module', width: 122, ellipsis: { tooltip: true },
    render: row => h('span', { class: 'management-entity-name' }, moduleLabel(row.module))
  },
  {
    title: () => header(t('page.operationLogs.columns.operationType')),
    key: 'operation_type', width: 176,
    render: row => h('div', [
      h('span', operationLabel(row.operation_type)),
      row.error_message
        ? h('span', { class: 'logs-error-text', title: row.error_message }, row.error_message)
        : null
    ])
  },
  {
    title: () => header(t('page.operationLogs.columns.username')),
    key: 'user_name', width: 124, ellipsis: { tooltip: true }, render: row => row.user_name || '—'
  },
  ...(showReportColumns.value ? reportColumns : []),
  {
    title: () => header(t('page.operationLogs.details')),
    key: 'details', width: narrowLayout.value ? 82 : 99, align: 'center', fixed: 'right',
    render: row => h(NButton, { type: 'primary', quaternary: true, size: 'small', onClick: () => showDetails(row) },
      () => t('page.operationLogs.details'))
  }
]);
const tableWidth = computed(() => columns.value.reduce((sum, column) => sum + Number(column.width ?? 0), 0));

const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  prefix({ itemCount }) {
    return t('page.operationLogs.pagination.total', { count: itemCount })
  },
  onChange: (page: number) => {
    pagination.value.page = page;
    fetchData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    fetchData();
  }
});

let latestRequest = 0;
async function fetchData() {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const { data, error } = await fetchOperationLogs({
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      ...searchParams
    });
    if (request !== latestRequest) return;
    if (error || !data) throw error;
    tableData.value = data.list ?? [];
    matchingCount.value = Number(data.pagination.total) || 0;
    pagination.value.itemCount = matchingCount.value;
  } catch {
    if (request !== latestRequest) return;
    tableData.value = [];
    matchingCount.value = undefined;
    pagination.value.itemCount = 0;
    message.error(t('page.operationLogs.messages.fetchFail'));
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}
</script>

<template>
  <div class="management-page logs-page" :style="themeStyle">
    <header class="management-heading">
      <div class="management-heading__title">
        <span class="management-heading__icon" aria-hidden="true"><LogIcon /></span>
        <h1>{{ t('page.operationLogs.title') }}</h1>
      </div>
      <NButton size="small" :loading="loading" @click="fetchData">
        <template #icon><RefreshIcon /></template>
        {{ t('common.refresh') }}
      </NButton>
    </header>

    <ManagementStatusSummary
      :total="matchingCount"
      :total-label="t('page.operationLogs.matchingLogs')"
      :status-label="t('page.operationLogs.currentPageStatus')"
      :statuses="statusSummary"
      :loading="loading"
    />

    <div class="management-filters logs-filters">
      <NSelect
        v-model:value="searchParams.status"
        class="management-select logs-status-filter"
        :placeholder="t('page.operationLogs.searchBar.selectStatus')"
        :options="statusOptions"
        size="small"
        clearable
        @update:value="handleSearch"
      />
      <NSelect
        v-model:value="searchParams.module"
        class="management-select logs-module-filter"
        :placeholder="t('page.operationLogs.searchBar.selectModule')"
        :options="moduleOptions"
        size="small"
        clearable
        @update:value="handleSearch"
      />
      <NSelect
        v-model:value="searchParams.operation_type"
        class="management-select"
        :placeholder="t('page.operationLogs.searchBar.selectOperationType')"
        :options="operationTypeOptions"
        size="small"
        clearable
        @update:value="handleSearch"
      />
      <NSelect
        v-model:value="searchParams.user_id"
        class="management-select"
        :placeholder="t('page.operationLogs.searchBar.selectUser')"
        :options="userOptions"
        size="small"
        filterable
        clearable
        @update:value="handleSearch"
      />
      <NButton size="small" @click="handleReset">{{ t('page.operationLogs.searchBar.reset') }}</NButton>
    </div>

    <section class="management-table-panel" :aria-label="t('page.operationLogs.title')">
      <NDataTable
        class="management-table"
        flex-height
        remote
        size="small"
        :bordered="false"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="tableWidth"
        :row-key="row => row.id"
      />
    </section>

    <NDrawer v-model:show="detailsOpen" :width="660" style="max-width: 100vw">
      <NDrawerContent :title="t('page.operationLogs.details')" closable>
        <template v-if="selectedLog">
          <div class="logs-detail-header">
            <NTag :type="selectedLog.status === 1 ? 'success' : 'error'" :bordered="false" size="small" round>
              {{ statusLabel(selectedLog.status) }}
            </NTag>
            <strong>#{{ selectedLog.id }}</strong>
          </div>
          <dl class="logs-detail-fields">
            <div v-for="field in detailFields" :key="field.key">
              <dt>{{ t(`page.operationLogs.columns.${field.key}`) }}</dt>
              <dd>{{ field.value ?? '—' }}</dd>
            </div>
          </dl>
          <section v-for="field in detailContent" v-show="field.value" :key="field.key" class="logs-detail-block">
            <h3>{{ t(`page.operationLogs.columns.${field.key}`) }}</h3>
            <pre>{{ formatPayload(field.value) }}</pre>
          </section>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style src="@/styles/css/management-list.css"></style>

<style scoped>
.logs-page :deep(.logs-time),
.logs-page :deep(.logs-off-shelf-change) {
  white-space: nowrap;
  font-size: 12px;
}

.logs-page :deep(.logs-error-text) {
  display: block;
  overflow: hidden;
  color: #a54855;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logs-detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.logs-detail-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(136px, 1fr));
  gap: 12px;
  margin: 0 0 16px;
}

.logs-detail-fields dt {
  opacity: 0.68;
  font-size: 12px;
}

.logs-detail-fields dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
  font-weight: 600;
}

.logs-detail-block {
  margin-top: 12px;
}

.logs-detail-block h3 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 650;
}

.logs-detail-block pre {
  max-height: 260px;
  overflow: auto;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
