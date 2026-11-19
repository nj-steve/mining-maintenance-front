<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  NAlert, NButton, NCard, NDataTable, NDrawer, NDrawerContent, NEmpty, NForm, NFormItem,
  NInputNumber, NModal, NPagination, NSpace, NSwitch, NTag, NTooltip, useDialog, useMessage
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
const overview = ref<Awaited<ReturnType<typeof fetchTaskOverview>>['data']>(null);
const overviewError = ref('');
const loading = ref(false);
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
function scheduleLabel(task: ScheduledTask) {
  if (isIntervalTask(task)) return text('every', { duration: formatDuration(task.interval_seconds) });
  if (task.name === 'dashboard_stats') return text('dashboardSchedule');
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
  return h(NTag, { size: 'small', bordered: false, type: statusTone[status] ?? 'default' }, () =>
    status === 'running' && online === false ? text('workerUnreachable') : localizedValue('status', status));
}

const taskColumns = computed<DataTableColumns<ScheduledTask>>(() => [
  { title: text('task'), key: 'name', width: 208, render: row => h('div', [
    h('div', { class: 'font-medium' }, localizedValue('names', row.name)),
    h('div', { class: 'task-code' }, row.name)
  ]) },
  { title: text('enabled'), key: 'enabled', width: 94, render: row => h(NSwitch, {
    value: row.enabled, size: 'small', disabled: Boolean(overviewError.value || busyTask.value),
    loading: busyTask.value === row.name, 'aria-label': `${text('enabled')} – ${localizedValue('names', row.name)}`,
    onUpdateValue: (enabled: boolean) => { void applySettings(row.name, { enabled }); }
  }) },
  { title: text('schedule'), key: 'schedule', width: 150, render: scheduleLabel },
  { title: text('state'), key: 'status', width: 180, render: row => h(NSpace, { size: 6 }, () => [
    statusTag(row.status || 'idle', worker.value?.online ?? false),
    row.pending && row.next_run_at && row.status !== 'queued' ? statusTag('queued') : null
  ]) },
  { title: text('latestRun'), key: 'last_finished_at', width: 190, render: row => h('div', [
    h('div', formatTime(row.status === 'running' ? row.last_started_at : row.last_finished_at ?? row.last_started_at)),
    row.last_error ? h(NTooltip, { style: { maxWidth: 'min(80vw, 520px)', whiteSpace: 'pre-wrap' } }, {
      trigger: () => h('div', { class: 'task-error-preview' }, row.last_error), default: () => row.last_error
    }) : null
  ]) },
  { title: text('nextRun'), key: 'next_run_at', width: 184, render: row => formatTime(row.next_run_at) },
  { title: text('actions'), key: 'actions', width: 230, render: row => {
    const action = ['failed', 'interrupted', 'cancelled'].includes(row.status) ? 'retry' : 'run';
    const disabled = Boolean(overviewError.value || busyTask.value || (row.pending && row.next_run_at) || row.status === 'running');
    return h(NSpace, { size: 12 }, () => [
      h(NButton, { text: true, size: 'small', onClick: () => showHistory(row.name) }, () => text('history')),
      h(NButton, { text: true, size: 'small', disabled: Boolean(overviewError.value || busyTask.value), onClick: () => openSettings(row) }, () => text('settings')),
      h(NButton, { text: true, size: 'small', type: 'primary', disabled, onClick: () => confirmTask(row, action) }, () => text(action))
    ]);
  } }
]);

const runColumns = computed<DataTableColumns<TaskRun>>(() => [
  { title: text('runID'), key: 'id', width: 74 },
  { title: text('trigger'), key: 'trigger', width: 114, render: row => h('div', [
    h('div', localizedValue('triggers', row.trigger)),
    row.attempt && row.attempt > 1 ? h('div', { class: 'task-code' }, text('attempt', { count: row.attempt })) : null
  ]) },
  { title: text('state'), key: 'status', width: 116, render: row => statusTag(row.status, worker.value?.online ?? false) },
  { title: text('startedAt'), key: 'started_at', width: 178, render: row => formatTime(row.started_at) },
  { title: text('finishedAt'), key: 'finished_at', width: 178, render: row => formatTime(row.finished_at) },
  { title: text('duration'), key: 'duration', width: 110, render: row => {
    if (!row.finished_at || !row.started_at) return '—';
    const ms = row.duration_ms ?? Date.parse(row.finished_at) - Date.parse(row.started_at);
    return Number.isFinite(ms) && ms >= 0 ? formatDuration(ms / 1000) : '—';
  } },
  { title: text('processed'), key: 'processed_count', width: 96, render: row =>
    row.processed_count == null ? '—' : row.processed_count.toLocaleString(locale.value) },
  { title: text('failedCount'), key: 'failed_count', width: 96, render: row =>
    row.failed_count == null ? '—' : row.failed_count.toLocaleString(locale.value) },
  { title: text('error'), key: 'error', minWidth: 230, render: row => h('span', { class: 'history-error' }, row.error || '—') }
]);

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
  <div class="task-page">
    <NCard :bordered="false" class="task-panel" :title="text('title')">
      <template #header-extra>
        <NButton size="small" :loading="loading" @click="loadOverview()">{{ text('refresh') }}</NButton>
      </template>

      <div class="worker-summary" aria-live="polite">
        <div class="worker-summary-title">
          <span>{{ text('worker') }}</span>
          <NTag size="small" :bordered="false" :type="overviewError ? 'warning' : worker?.online ? 'success' : 'default'">
            {{ text(overviewError || !overview ? 'unknown' : worker?.online ? 'online' : 'offline') }}
          </NTag>
        </div>
        <span class="worker-detail">{{ text('heartbeat', { time: formatTime(worker?.heartbeat_at) }) }}</span>
        <span v-if="worker?.worker_id" class="task-code">{{ worker.worker_id }}</span>
        <span v-if="overview && !worker?.online && !overviewError" class="worker-detail">{{ text('offlineHint') }}</span>
      </div>

      <NAlert v-if="overviewError" type="error" :title="text('loadFailed')" class="mb-14px">
        {{ overviewError === text('loadFailed') ? text('refreshHint') : overviewError }}
      </NAlert>

      <NDataTable
        v-if="overview || loading"
        :columns="taskColumns"
        :data="tasks"
        :loading="loading"
        :row-key="row => row.name"
        :scroll-x="1236"
        size="small"
        striped
      >
        <template #empty><NEmpty :description="text('noTasks')" /></template>
      </NDataTable>
    </NCard>

    <NDrawer v-model:show="historyOpen" :width="960" style="max-width: 100vw">
      <NDrawerContent :title="text('historyTitle', { task: localizedValue('names', historyTask || '') })" closable>
        <div class="history-toolbar">
          <span>{{ text('timezone') }}</span>
          <NButton size="small" :loading="historyLoading" @click="loadHistory()">{{ text('refresh') }}</NButton>
        </div>
        <NAlert v-if="historyError" type="error" class="mb-12px">{{ historyError }}</NAlert>
        <NDataTable :columns="runColumns" :data="history" :loading="historyLoading" :row-key="row => row.id" :scroll-x="1192" size="small">
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
        <NFormItem v-if="settings.schedule !== 'manual'" :label="text('runOnStart')">
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

<style scoped>
.task-page { min-width: 0; }
.task-panel { border-radius: 8px; }
.worker-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-bottom: 16px; }
.worker-summary-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.worker-detail, .history-toolbar span { font-size: 12px; color: var(--n-title-text-color); opacity: 0.75; }
.task-code { font-size: 11px; opacity: 0.65; overflow-wrap: anywhere; font-family: ui-monospace, monospace; }
.task-error-preview { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #b54b54; font-size: 12px; }
.history-error { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; }
.history-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
</style>
