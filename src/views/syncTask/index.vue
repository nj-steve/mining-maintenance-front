<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMediaQuery } from '@vueuse/core';
import TaskIcon from '~icons/ant-design/schedule-outlined';
import RefreshIcon from '~icons/ant-design/reload-outlined';
import WorkerIcon from '~icons/ant-design/hdd-outlined';
import RunningIcon from '~icons/ant-design/play-circle-outlined';
import QueueIcon from '~icons/ant-design/clock-circle-outlined';
import ErrorIcon from '~icons/ant-design/warning-outlined';
import {
  NAlert, NButton, NDataTable, NDrawer, NDrawerContent, NEmpty, NForm, NFormItem,
  NInputNumber, NModal, NPagination, NSpace, NSwitch, NTag, NTooltip, useDialog, useMessage, useThemeVars
} from 'naive-ui';
import type { DataTableColumns, TagProps } from 'naive-ui';
import {
  enqueueTask, fetchTaskOverview, fetchTaskRuns, updateTaskSettings,
  type ScheduledTask, type TaskRun, type TaskSettings
} from '@/service/api/task-management';
import { $t } from '@/locales';
import { taskMessages } from './locale';

const { t, te, locale } = useI18n({ useScope: 'local', messages: taskMessages });
const message = useMessage();
const dialog = useDialog();
const narrowLayout = useMediaQuery('(max-width: 760px)');
const theme = useThemeVars();
const themeStyle = computed(() => ({
  '--management-surface': theme.value.cardColor,
  '--management-line': theme.value.dividerColor,
  '--management-ink': theme.value.textColor1,
  '--management-muted': theme.value.textColor2,
  '--management-accent': theme.value.primaryColor
}));
const overview = ref<Awaited<ReturnType<typeof fetchTaskOverview>>['data']>(null);
const overviewError = ref('');
const loading = ref(true);
const refreshing = ref(false);
const busyTask = ref('');
const tasks = computed(() => overview.value?.tasks ?? []);
const worker = computed(() => overview.value?.worker);
const historyTask = ref<string | null>(null);
const historyOpen = ref(false);
const historyLoading = ref(false);
const historyRefreshing = ref(false);
const historyError = ref('');
const historyPage = ref(1);
const historyTotal = ref(0);
const history = ref<TaskRun[]>([]);
const historyPageSize = 20;
const settingsOpen = ref(false);
const settings = ref<ScheduledTask | null>(null);
const settingsInterval = ref<number | null>(null);
const settingsRunOnStart = ref(false);
const settingsTimeout = ref<number | null>(null);
const settingsRetries = ref<number | null>(null);
const maxInterval = 31 * 86400;
const maxTimeout = 86400;
const maxRetries = 5;
let overviewRequest = 0;
let historyRequest = 0;
let disposed = false;
let timer: ReturnType<typeof setInterval> | undefined;

const statusTone: Record<string, TagProps['type']> = {
  running: 'info', succeeded: 'success', failed: 'error', cancelled: 'warning', interrupted: 'warning', queued: 'warning'
};
const text = (key: string, values: Record<string, string | number> = {}) => t(key, values);
const workerStatus = computed(() => overviewError.value || !overview.value
  ? 'unknown'
  : worker.value?.online ? 'online' : 'offline');
const hasQueuedRun = (task: ScheduledTask) => task.status === 'queued' || Boolean(task.pending && task.next_run_at);
const taskMetrics = computed(() => [
  {
    key: 'runningTasks', icon: RunningIcon, tone: '#4179d9',
    count: worker.value?.online ? tasks.value.filter(task => task.status === 'running').length : 0
  },
  { key: 'queuedTasks', icon: QueueIcon, tone: '#b26713', count: tasks.value.filter(hasQueuedRun).length },
  {
    key: 'failedTasks', icon: ErrorIcon, tone: '#bd5268',
    count: tasks.value.filter(task => task.status === 'failed' || task.status === 'interrupted').length
  }
]);
const metricFormatter = computed(() => new Intl.NumberFormat(locale.value));
const renderHeader = (key: string) => () => h('span', { class: 'management-column-title' }, text(key));

function localizedValue(namespace: string, value: string) {
  const key = `${namespace}.${value}`;
  return te(key) ? t(key) : value;
}

const timeFormatter = computed(() => new Intl.DateTimeFormat(locale.value, {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
}));
function formatTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? timeFormatter.value.format(date) : '—';
}

function formatDuration(seconds: number) {
  const parts: string[] = [];
  for (const [unit, size] of [['hour', 3600], ['minute', 60], ['second', 1]] as const) {
    const amount = Math.floor(seconds / size);
    if (amount > 0 || (unit === 'second' && !parts.length)) {
      parts.push(new Intl.NumberFormat(locale.value, { style: 'unit', unit, unitDisplay: 'short' }).format(amount));
    }
    seconds %= size;
  }
  return parts.join(' ');
}

const isIntervalTask = (task: ScheduledTask) => (!task.schedule || task.schedule === 'interval') && task.interval_seconds > 0;
const siteOffShelfCountsTask = 'site_off_shelf_counts_7d';
const macVerificationTask = 'repair_detail_mac_verification';
function scheduleLabel(task: ScheduledTask) {
  if (isIntervalTask(task)) return text('every', { duration: formatDuration(task.interval_seconds) });
  if (task.name === 'dashboard_stats') return text('dashboardSchedule');
  if (task.name === siteOffShelfCountsTask) return text('siteOffShelfCountsSchedule');
  return task.schedule === 'manual' ? text('manualOnly') : text('fixedSchedule');
}

function errorText(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { msg?: unknown; error?: unknown } } } | undefined)?.response?.data;
  const detail = response?.msg ?? response?.error;
  return typeof detail === 'string' && detail.trim() ? detail : fallback;
}

async function loadOverview(background = false) {
  const request = ++overviewRequest;
  refreshing.value = true;
  if (!background) loading.value = true;
  try {
    const { data, error } = await fetchTaskOverview();
    if (request !== overviewRequest || disposed) return;
    if (error || !Array.isArray(data?.tasks)) {
      overviewError.value = errorText(error, text('loadFailed'));
      return;
    }
    overview.value = data;
    overviewError.value = '';
  } finally {
    if (request === overviewRequest) {
      loading.value = false;
      refreshing.value = false;
    }
  }
}

async function loadHistory(background = false) {
  if (!historyTask.value || !historyOpen.value) return;
  const request = ++historyRequest;
  historyRefreshing.value = true;
  if (!background) historyLoading.value = true;
  try {
    const { data, error } = await fetchTaskRuns(historyTask.value, historyPage.value, historyPageSize);
    if (request !== historyRequest || disposed || !historyOpen.value) return;
    if (error || !data) {
      historyError.value = errorText(error, text('loadHistoryFailed'));
      return;
    }
    history.value = data.list ?? [];
    historyTotal.value = data.pagination.total;
    historyError.value = '';
  } finally {
    if (request === historyRequest) {
      historyLoading.value = false;
      historyRefreshing.value = false;
    }
  }
}

function showHistory(name: string) {
  historyTask.value = name;
  history.value = [];
  historyPage.value = 1;
  historyTotal.value = 0;
  historyError.value = '';
  historyOpen.value = true;
  void loadHistory();
}

function selectHistoryPage(page: number) {
  historyPage.value = page;
  history.value = [];
  void loadHistory();
}

function openSettings(task: ScheduledTask) {
  settings.value = task;
  settingsInterval.value = task.interval_seconds;
  settingsRunOnStart.value = task.run_on_start;
  settingsTimeout.value = task.timeout_seconds;
  settingsRetries.value = task.max_retries;
  settingsOpen.value = true;
}

async function applySettings(name: string, values: TaskSettings) {
  if (busyTask.value) return false;
  busyTask.value = name;
  try {
    const { error } = await updateTaskSettings(name, values);
    if (disposed) return false;
    if (error) {
      message.error(errorText(error, text('saveFailed')));
      return false;
    }
    message.success(text('settingsSaved'));
    await loadOverview();
    return true;
  } finally {
    busyTask.value = '';
  }
}

async function saveSettings() {
  const job = settings.value;
  if (!job) return;
  const timeout = settingsTimeout.value;
  const retries = settingsRetries.value;
  if (!isIntegerWithin(timeout, 1, maxTimeout) || !isIntegerWithin(retries, 0, maxRetries)) {
    message.warning(text('invalidSettings'));
    return;
  }
  const data: TaskSettings = { timeout_seconds: timeout, max_retries: retries };
  if (job.schedule !== 'manual') data.run_on_start = settingsRunOnStart.value;
  if (isIntervalTask(job)) {
    const interval = settingsInterval.value;
    if (!isIntegerWithin(interval, 1, maxInterval)) {
      message.warning(text('invalidSettings'));
      return;
    }
    data.interval_seconds = interval;
  }
  if (await applySettings(job.name, data)) settingsOpen.value = false;
}

function isIntegerWithin(value: number | null, min: number, max: number): value is number {
  return value !== null && Number.isInteger(value) && value >= min && value <= max;
}

async function submitTask(name: string, action: 'run' | 'retry') {
  if (busyTask.value) return;
  busyTask.value = name;
  try {
    const { error } = await enqueueTask(name, action);
    if (disposed) return;
    if (error) {
      message.error(errorText(error, text('queueFailed')));
      return;
    }
    message.success(text('queuedNotice'));
    await loadOverview(true);
  } finally {
    busyTask.value = '';
  }
}

function confirmTask(row: ScheduledTask, action: 'run' | 'retry') {
  const title = text(action);
  dialog.info({
    title,
    content: text('confirmQueue', { task: localizedValue('names', row.name) }),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => submitTask(row.name, action)
  });
}

function statusTag(status: string, online?: boolean) {
  const workerOffline = status === 'running' && online === false;
  return h(NTag, {
    class: 'management-status-tag',
    size: 'small',
    round: true,
    bordered: false,
    type: workerOffline ? 'warning' : statusTone[status] ?? 'default'
  }, () => workerOffline ? text('workerUnreachable') : localizedValue('status', status));
}

const taskColumns = computed<DataTableColumns<ScheduledTask>>(() => [
  {
    title: renderHeader('task'), key: 'name', width: narrowLayout.value ? 172 : 242,
    render: row => h('div', [
      h('div', { class: 'management-entity-name task-name' }, localizedValue('names', row.name)),
      h('div', { class: 'task-code', title: row.name }, row.name),
      narrowLayout.value
        ? h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => showHistory(row.name) }, () => text('history'))
        : null
    ])
  },
  {
    title: renderHeader('state'), key: 'status', width: narrowLayout.value ? 124 : 142,
    render: row => h('div', { class: 'task-state' }, [
      statusTag(row.status || 'idle', overviewError.value ? undefined : worker.value?.online),
      hasQueuedRun(row) && row.status !== 'queued' ? statusTag('queued') : null
    ])
  },
  {
    title: renderHeader('enabled'), key: 'enabled', width: 100,
    render: row => h(NSwitch, {
      value: row.enabled, size: 'small', disabled: Boolean(overviewError.value || busyTask.value),
      loading: busyTask.value === row.name, 'aria-label': `${text('enabled')} – ${localizedValue('names', row.name)}`,
      onUpdateValue: (enabled: boolean) => { void applySettings(row.name, { enabled }); }
    })
  },
  { title: renderHeader('schedule'), key: 'schedule', width: 176, render: scheduleLabel },
  {
    title: renderHeader('latestRun'), key: 'last_finished_at', width: 188,
    render: row => h('div', [
      h('div', { class: 'management-contact' }, formatTime(row.status === 'running' ? row.last_started_at : row.last_finished_at ?? row.last_started_at)),
      row.last_error ? h(NTooltip, { style: { maxWidth: 'min(80vw, 520px)', whiteSpace: 'pre-wrap' } }, {
        trigger: () => h('span', { class: 'task-error-preview', tabindex: 0 }, row.last_error),
        default: () => row.last_error
      }) : null
    ])
  },
  {
    title: renderHeader('nextRun'), key: 'next_run_at', width: 179,
    render: row => h('span', { class: 'management-contact' }, formatTime(row.next_run_at))
  },
  {
    title: renderHeader('actions'), key: 'actions', width: narrowLayout.value ? 130 : 188,
    fixed: narrowLayout.value ? undefined : 'right',
    render: row => {
      const action = ['failed', 'interrupted', 'cancelled'].includes(row.status) ? 'retry' : 'run';
      const disabled = Boolean(overviewError.value || busyTask.value || (row.pending && row.next_run_at) || row.status === 'running');
      return h('div', { class: 'task-row-actions' }, [
        !narrowLayout.value
          ? h(NButton, { quaternary: true, size: 'small', onClick: () => showHistory(row.name) }, () => text('history'))
          : null,
        h(NButton, { quaternary: true, size: 'small', disabled: Boolean(overviewError.value || busyTask.value), onClick: () => openSettings(row) }, () => text('settings')),
        h(NButton, { quaternary: true, size: 'small', type: 'primary', disabled, onClick: () => confirmTask(row, action) }, () => text(action))
      ]);
    }
  }
]);
const taskTableWidth = computed(() => taskColumns.value.reduce((sum, column) => sum + Number(column.width ?? 0), 0));

const isMacVerificationHistory = computed(() => historyTask.value === macVerificationTask);
const macRunMetrics = [
  { key: 'verified_count', label: 'verifiedCount', width: 110 },
  { key: 'skipped_empty_count', label: 'skippedEmptyCount', width: 110 },
  { key: 'skipped_invalid_count', label: 'skippedInvalidCount', width: 130 },
  { key: 'skipped_duplicate_count', label: 'skippedDuplicateCount', width: 120 }
];
const formatRunCount = (count?: number | null) => count == null ? '—' : count.toLocaleString(locale.value);

const runColumns = computed<DataTableColumns<TaskRun>>(() => [
  { title: text('state'), key: 'status', width: 123, render: row => statusTag(row.status, overviewError.value ? undefined : worker.value?.online) },
  { title: text('runID'), key: 'id', width: 74 },
  { title: text('trigger'), key: 'trigger', width: 114, render: row => h('div', [
    h('div', localizedValue('triggers', row.trigger)),
    row.attempt && row.attempt > 1 ? h('div', { class: 'task-code' }, text('attempt', { count: row.attempt })) : null
  ]) },
  ...(isMacVerificationHistory.value ? macRunMetrics.map(({ key, label, width }) => ({
    title: text(label), key, width, align: 'right' as const,
    render: (row: TaskRun) => formatRunCount(row.metrics?.[key])
  })) : []),
  { title: text('startedAt'), key: 'started_at', width: 178, render: row => formatTime(row.started_at) },
  { title: text('finishedAt'), key: 'finished_at', width: 178, render: row => formatTime(row.finished_at) },
  { title: text('duration'), key: 'duration', width: 110, render: row => {
    if (!row.finished_at || !row.started_at) return '—';
    const ms = row.duration_ms ?? Date.parse(row.finished_at) - Date.parse(row.started_at);
    return Number.isFinite(ms) && ms >= 0 ? formatDuration(ms / 1000) : '—';
  } },
  { title: text('processed'), key: 'processed_count', width: 96, render: row => formatRunCount(row.processed_count) },
  { title: text('failedCount'), key: 'failed_count', width: 96, render: row => formatRunCount(row.failed_count) },
  { title: text('error'), key: 'error', width: 230, render: row => h('span', { class: 'history-error' }, row.error || '—') }
]);

const runTableWidth = computed(() => runColumns.value.reduce((sum, column) => sum + Number(column.width ?? 0), 0));

onMounted(() => {
  void loadOverview();
  timer = setInterval(() => {
    if (document.visibilityState !== 'visible' || busyTask.value) return;
    if (!overviewError.value && !refreshing.value) void loadOverview(true);
    if (historyOpen.value && historyPage.value === 1 && !historyRefreshing.value && !historyError.value) void loadHistory(true);
  }, 15000);
});

onBeforeUnmount(() => {
  disposed = true;
  clearInterval(timer);
});
</script>

<template>
  <div class="management-page task-page" :style="themeStyle">
    <header class="management-heading">
      <div class="management-heading__title">
        <span class="management-heading__icon" aria-hidden="true"><TaskIcon /></span>
        <h1>{{ text('title') }}</h1>
      </div>
      <NButton size="small" :loading="loading" @click="loadOverview()">
        <template #icon><RefreshIcon /></template>
        {{ text('refresh') }}
      </NButton>
    </header>

    <div class="task-overview">
      <section class="task-summary worker-summary" :class="`worker-summary--${workerStatus}`" aria-live="polite">
        <h2><span class="task-summary-icon" aria-hidden="true"><WorkerIcon /></span>{{ text('worker') }}</h2>
        <strong class="worker-state">{{ text(workerStatus) }}</strong>
        <div class="worker-detail">{{ text('heartbeat', { time: formatTime(worker?.heartbeat_at) }) }}</div>
        <div v-if="worker?.worker_id" class="task-code">{{ worker.worker_id }}</div>
        <div v-if="workerStatus === 'offline'" class="worker-detail">{{ text('offlineHint') }}</div>
      </section>
      <section v-for="metric in taskMetrics" :key="metric.key" class="task-summary" :style="{ '--task-tone': metric.tone }">
        <h2><span class="task-summary-icon" aria-hidden="true"><component :is="metric.icon" /></span>{{ text(metric.key) }}</h2>
        <strong>{{ overview && !overviewError ? metricFormatter.format(metric.count) : '—' }}</strong>
      </section>
    </div>

    <NAlert v-if="overviewError" type="error" :title="text('loadFailed')">
      {{ overviewError === text('loadFailed') ? text('refreshHint') : overviewError }}
    </NAlert>

    <section class="management-table-panel" :aria-label="text('title')">
      <NDataTable
        class="management-table"
        :columns="taskColumns"
        :data="tasks"
        :loading="loading"
        :row-key="row => row.name"
        :scroll-x="taskTableWidth"
        :bordered="false"
        size="small"
        flex-height
      >
        <template #empty><NEmpty :description="text(overviewError ? 'loadFailed' : 'noTasks')" /></template>
      </NDataTable>
    </section>

    <NDrawer v-model:show="historyOpen" :width="960" style="max-width: 100vw">
      <NDrawerContent :title="text('historyTitle', { task: localizedValue('names', historyTask || '') })" closable>
        <div class="history-toolbar">
          <span>{{ text('timezone') }}</span>
          <NButton size="small" :loading="historyLoading" @click="loadHistory()">{{ text('refresh') }}</NButton>
        </div>
        <NAlert v-if="historyError" type="error" class="mb-12px">{{ historyError }}</NAlert>
        <NDataTable class="task-history-table" :columns="runColumns" :data="history" :loading="historyLoading" :row-key="row => row.id" :scroll-x="runTableWidth" size="small">
          <template #empty><NEmpty :description="text(historyError ? 'loadHistoryFailed' : 'noRuns')" /></template>
        </NDataTable>
        <template #footer>
          <NPagination :page="historyPage" :page-size="historyPageSize" :item-count="historyTotal" @update:page="selectHistoryPage" />
        </template>
      </NDrawerContent>
    </NDrawer>

    <NModal v-model:show="settingsOpen" preset="card" :title="text('settings')" style="width: min(480px, calc(100vw - 32px))">
      <NForm v-if="settings" label-placement="top" @submit.prevent="saveSettings">
        <p class="mb-16px font-medium">{{ localizedValue('names', settings.name) }}</p>
        <NFormItem :label="text('schedule')">
          <NInputNumber
            v-if="isIntervalTask(settings)"
            v-model:value="settingsInterval"
            :min="1"
            :max="maxInterval"
            :precision="0"
            class="w-full"
          >
            <template #suffix>{{ text('seconds') }}</template>
          </NInputNumber>
          <span v-else>{{ scheduleLabel(settings) }}</span>
        </NFormItem>
        <NFormItem
          v-if="settings.schedule !== 'manual'"
          :label="text(settings.name === siteOffShelfCountsTask || settings.name === macVerificationTask ? 'runOnEachStartup' : 'runOnStart')"
        >
          <NSwitch v-model:value="settingsRunOnStart" />
        </NFormItem>
        <NFormItem :label="text('timeout')">
          <NInputNumber v-model:value="settingsTimeout" :min="1" :max="maxTimeout" :precision="0" class="w-full">
            <template #suffix>{{ text('seconds') }}</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem :label="text('maxRetries')">
          <NInputNumber v-model:value="settingsRetries" :min="0" :max="maxRetries" :precision="0" class="w-full" />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="settingsOpen = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" attr-type="submit" :loading="busyTask === settings.name">{{ text('save') }}</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </div>
</template>

<style src="@/styles/css/management-list.css"></style>

<style scoped>
.task-overview {
  display: grid;
  flex: none;
  grid-template-columns: minmax(260px, 1.6fr) repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.task-summary {
  --task-tone: var(--management-accent);

  min-width: 0;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--task-tone) 20%, var(--management-line));
  border-radius: 10px;
  background: color-mix(in srgb, var(--task-tone) 4%, var(--management-surface));
}

.task-summary h2 {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--management-muted);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.25;
}

.task-summary-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--task-tone) 13%, var(--management-surface));
  color: color-mix(in srgb, var(--task-tone) 72%, var(--management-ink));
  font-size: 15px;
}

.task-summary strong {
  display: block;
  margin-top: 6px;
  color: color-mix(in srgb, var(--task-tone) 55%, var(--management-ink));
  font-size: clamp(22px, 2.15vw, 30px);
  font-weight: 720;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.worker-summary--online { --task-tone: #168460; }
.worker-summary--offline { --task-tone: #bd5268; }
.worker-summary--unknown { --task-tone: #68758a; }

.worker-detail {
  margin-top: 4px;
  color: var(--management-muted);
  font-size: 11px;
}

.task-code,
.task-page :deep(.task-code) {
  color: var(--management-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.task-page :deep(.task-name) {
  line-height: 1.4;
}

.task-page :deep(.task-state),
.task-page :deep(.task-row-actions) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.task-page :deep(.task-row-actions .n-button) {
  padding-inline: 6px;
}

.task-page :deep(.task-error-preview) {
  display: block;
  overflow: hidden;
  color: #a54855;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-history-table :deep(.history-error) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 12px;
}

.task-history-table :deep(.task-code) {
  color: inherit;
  opacity: 0.67;
  font-size: 11px;
}

.history-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 12px;
}

@media (max-width: 850px) {
  .task-overview {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .worker-summary {
    grid-column: 1 / -1;
  }
}

@media (max-width: 420px) {
  .task-summary {
    padding: 9px 8px;
  }

  .task-summary h2 {
    flex-wrap: wrap;
    font-size: 12px;
  }

  .task-summary-icon {
    width: 22px;
    height: 22px;
  }

  .task-summary:not(.worker-summary) {
    display: flex;
    flex-direction: column;
  }

  .task-summary:not(.worker-summary) strong {
    margin-top: auto;
    padding-top: 6px;
  }

  .task-page :deep(.management-table .task-code) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
