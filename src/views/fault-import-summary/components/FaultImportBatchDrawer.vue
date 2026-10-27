<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import dayjs from 'dayjs';
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NInput,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  NText,
  useMessage
} from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import { Icon } from '@iconify/vue';
import { useI18n } from 'vue-i18n';
import {
  FaultImportErrorCodeMap,
  fetchFaultImportBatchErrors,
  fetchFaultImportErrorLogs,
  updateFaultImportError,
  type FaultImportBatchErrorResult,
  type FaultImportError,
  type FaultImportErrorLog
} from '@/service/api/faults';
import { fetchSites } from '@/service/api/site';

const props = defineProps<{
  show: boolean;
  batchId: number | string | null;
}>();

const emit = defineEmits<{
  'update:show': [value: boolean];
  processed: [];
}>();

const { t } = useI18n();
const message = useMessage();

const detail = ref<FaultImportBatchErrorResult | null>(null);
const dataList = ref<FaultImportError[]>([]);
const loading = ref(false);

const pagination = ref({
  page: 1,
  pageSize: 20,
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
  if (!props.batchId) return;
  loading.value = true;
  try {
    const res = await fetchFaultImportBatchErrors(props.batchId, {
      page: pagination.value.page,
      page_size: pagination.value.pageSize
    });
    const payload = res.data;
    if (!payload) {
      detail.value = null;
      dataList.value = [];
      pagination.value.itemCount = 0;
      return;
    }
    detail.value = payload;
    dataList.value = Array.isArray(payload.list) ? payload.list : [];
    pagination.value.itemCount = Number(payload.error_count ?? 0);
  } catch (err) {
    console.error(err);
    dataList.value = [];
    pagination.value.itemCount = 0;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.show, props.batchId] as const,
  ([show]) => {
    if (show) {
      pagination.value.page = 1;
      loadData();
    }
  }
);

const statusColorMap: Record<number, 'default' | 'warning' | 'success' | 'info'> = {
  0: 'warning',
  1: 'success',
  2: 'info'
};
const statusTextMap = computed<Record<number, string>>(() => ({
  0: t('page.faultImportErrors.statusPending'),
  1: t('page.faultImportErrors.statusProcessed'),
  2: t('page.faultImportErrors.statusIgnored')
}));

const columns = computed<DataTableColumns<FaultImportError>>(() => [
  { title: t('page.faultImportErrors.colSn'), key: 'sn', width: 160 },
  { title: t('page.faultImportErrors.colDownTime'), key: 'down_time', width: 150 },
  { title: t('page.faultImportErrors.colModel'), key: 'model', width: 90 },
  {
    title: t('page.faultImportErrors.colProblemDesc'),
    key: 'problem_desc',
    width: 160,
    ellipsis: { tooltip: true }
  },
  {
    title: t('page.faultImportErrors.colErrorMsg'),
    key: 'error_msg',
    minWidth: 220,
    ellipsis: { tooltip: true }
  },
  {
    title: t('page.faultImportErrors.colStatus'),
    key: 'status',
    width: 90,
    align: 'center',
    render: row =>
      h(
        NTag,
        { type: statusColorMap[row.status] || 'default', size: 'small' },
        { default: () => statusTextMap.value[row.status] || '-' }
      )
  },
  {
    title: t('page.faultImportErrors.colActions'),
    key: 'actions',
    width: 90,
    fixed: 'right',
    render: row =>
      h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          ghost: true,
          onClick: () => openEditDrawer(row)
        },
        { default: () => t('page.faultImportErrors.btnProcess') }
      )
  }
]);

const editRow = ref<FaultImportError | null>(null);
const editDrawerShow = ref(false);
const submitLoading = ref(false);
const editForm = ref({
  status: 1 as 0 | 1 | 2,
  remark: '',
  sn: '',
  down_time: null as string | null,
  model: '',
  problem_desc: '',
  site_id: null as number | null
});

function safeDownTime(val: unknown): string | null {
  if (!val) return null;
  const d = dayjs(val as string);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : null;
}

const siteOptions = ref<SelectOption[]>([]);
async function loadSiteOptions() {
  try {
    const res = await fetchSites({ page: 1, limit: 500 });
    const list = res.data?.data?.list ?? res.data?.list ?? [];
    siteOptions.value = (list as any[]).map(s => ({
      label: s.name ?? s.site_name ?? `场地#${s.id}`,
      value: s.id
    }));
  } catch (err) {
    console.error(err);
    siteOptions.value = [];
  }
}

function openEditDrawer(row: FaultImportError) {
  editRow.value = row;
  const orig = row.original_info_parsed || {};
  editForm.value = {
    status: row.status === 0 ? 1 : row.status,
    remark: row.remark || '',
    sn: orig.sn ?? row.sn,
    down_time: safeDownTime(orig.down_time ?? row.down_time),
    model: orig.model ?? row.model,
    problem_desc: orig.problem_desc ?? row.problem_desc,
    site_id: row.site_id ?? null
  };
  editDrawerShow.value = true;
}

async function onEditSubmit() {
  if (!editRow.value) return;
  submitLoading.value = true;
  try {
    const res = await updateFaultImportError(editRow.value.id, {
      status: editForm.value.status,
      remark: editForm.value.remark,
      sn: editForm.value.sn,
      down_time: editForm.value.down_time ?? undefined,
      model: editForm.value.model,
      problem_desc: editForm.value.problem_desc,
      site_id: editForm.value.site_id ?? undefined,
      original_info: editRow.value.original_info
    });
    if (res.data?.ok) {
      message.success(`处理成功${res.data.fault_id ? `，已转换为故障机 #${res.data.fault_id}` : ''}`);
      editDrawerShow.value = false;
      loadData();
      emit('processed');
    } else {
      const code = res.data?.error_code || 'unknown';
      const label = FaultImportErrorCodeMap[code]?.label || code;
      message.warning(`重插失败[${label}]: ${res.data?.error || '未知'}`);
    }
  } catch (err) {
    message.error('处理失败');
    console.error(err);
  } finally {
    submitLoading.value = false;
  }
}

async function onIgnore() {
  if (!editRow.value) return;
  submitLoading.value = true;
  try {
    const res = await updateFaultImportError(editRow.value.id, {
      status: 2,
      remark: editForm.value.remark || '已忽略',
      original_info: editRow.value.original_info
    });
    if (res.data?.ok) {
      message.success('已忽略');
      editDrawerShow.value = false;
      loadData();
      emit('processed');
    }
  } catch (err) {
    message.error('忽略失败');
  } finally {
    submitLoading.value = false;
  }
}

const logsLoading = ref(false);
const logs = ref<FaultImportErrorLog[]>([]);
const logsPagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onChange: (page: number) => {
    logsPagination.value.page = page;
    loadLogs();
  },
  onUpdatePageSize: (pageSize: number) => {
    logsPagination.value.pageSize = pageSize;
    logsPagination.value.page = 1;
    loadLogs();
  }
});

async function loadLogs() {
  if (!editRow.value) return;
  logsLoading.value = true;
  try {
    const res = await fetchFaultImportErrorLogs(editRow.value.id, {
      page: logsPagination.value.page,
      page_size: logsPagination.value.pageSize
    });
    // 类型收窄：提前 return，否则 payload 会退化为 {list} | {} 联合类型
    if (!res || !res.data) {
      logs.value = [];
      logsPagination.value.itemCount = 0;
      return;
    }
    const payload = res.data;
    logs.value = Array.isArray(payload.list) ? payload.list : [];
    logsPagination.value.itemCount = Number(payload.total ?? 0);
  } catch (err) {
    console.error(err);
    logs.value = [];
    logsPagination.value.itemCount = 0;
  } finally {
    logsLoading.value = false;
  }
}

watch(editDrawerShow, (show) => {
  if (show) {
    logsPagination.value.page = 1;
    logsPagination.value.pageSize = 10;
    loadLogs();
  }
});

const actionTextMap: Record<string, string> = {
  edit: '编辑',
  retry: '重试',
  ignore: '忽略',
  restore: '退回',
  resolve: '已解决'
};

function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  const d = dayjs(iso);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : iso;
}

const logColumns = computed<DataTableColumns<FaultImportErrorLog>>(() => [
  {
    title: t('page.faultImportErrors.logColTime'),
    key: 'created_at',
    width: 170,
    render: (row: FaultImportErrorLog) => formatDate(row.created_at)
  },
  {
    title: t('page.faultImportErrors.logColAction'),
    key: 'action',
    width: 90,
    render: (row: FaultImportErrorLog) =>
      h(
        NTag,
        {
          type: (row.action === 'resolve'
            ? 'success'
            : row.action === 'retry'
              ? 'warning'
              : row.action === 'ignore'
                ? 'info'
                : 'default') as any,
          size: 'small'
        },
        { default: () => actionTextMap[row.action] || row.action || '-' }
      )
  },
  { title: t('page.faultImportErrors.logColOperator'), key: 'operator_name', width: 110 },
  { title: t('page.faultImportErrors.logColResult'), key: 'error_msg', ellipsis: { tooltip: true } }
]);

const batchStats = computed(() => {
  const d = detail.value;
  return [
    {
      key: 'success',
      label: t('page.faultImportSummary.statSuccessCount'),
      value: d?.success_count ?? 0,
      icon: 'mdi:check-circle-outline',
      color: '#18a058'
    },
    {
      key: 'failure',
      label: t('page.faultImportSummary.statFailureCount'),
      value: d?.failure_count ?? 0,
      icon: 'mdi:alert-circle-outline',
      color: '#d03050'
    },
    {
      key: 'error',
      label: t('page.faultImportSummary.statErrorCount'),
      value: d?.error_count ?? 0,
      icon: 'mdi:file-alert-outline',
      color: '#d97706'
    }
  ];
});

watch(
  () => props.show,
  (show) => {
    if (show && siteOptions.value.length === 0) {
      loadSiteOptions();
    }
  }
);
</script>

<template>
  <NDrawer
    :show="show"
    :width="1180"
    placement="right"
    @update:show="emit('update:show', $event)"
  >
    <NDrawerContent :title="t('page.faultImportSummary.batchDrawerTitle')" closable>
      <div v-if="detail" class="mb-16px">
        <NGrid cols="1 m:3" responsive="screen" :x-gap="12">
          <NGi v-for="stat in batchStats" :key="stat.key">
            <NCard size="small" :bordered="false" class="rd-8px">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-12px text-gray-500">{{ stat.label }}</p>
                  <p class="mt-4px text-20px font-700" :style="{ color: stat.color }">{{ stat.value }}</p>
                </div>
                <Icon :icon="stat.icon" :width="24" :height="24" :style="{ color: stat.color }" />
              </div>
            </NCard>
          </NGi>
        </NGrid>

        <NDivider class="my-12px" />

        <NDescriptions label-placement="left" :column="3" size="small" bordered>
          <NDescriptionsItem :label="t('page.faultImportSummary.batchLabelSite')">
            {{ detail.site_name || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('page.faultImportSummary.batchLabelFile')">
            {{ detail.file_name || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('page.faultImportSummary.batchLabelImportTime')">
            {{ detail.import_time || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('page.faultImportSummary.batchLabelBatchId')">
            {{ detail.import_batch_id }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('page.faultImportSummary.batchLabelLogId')">
            {{ detail.operation_log_id || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('page.faultImportSummary.batchLabelSiteId')">
            {{ detail.site_id || '-' }}
          </NDescriptionsItem>
        </NDescriptions>
      </div>

      <NDataTable
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FaultImportError) => row.id"
        :scroll-x="1100"
        remote
        striped
        size="small"
        style="min-height: 300px"
      />

      <NDrawer v-model:show="editDrawerShow" :width="680" placement="right">
        <NDrawerContent :title="t('page.faultImportErrors.drawerTitle', { id: editRow?.id || '' })" closable>
          <NTabs type="line" animated>
            <NTabPane name="fix" :tab="t('page.faultImportErrors.tabFix')">
              <NForm v-if="editRow" :model="editForm" label-placement="left" label-width="100">
                <NAlert
                  :type="(FaultImportErrorCodeMap[editRow.last_error_code || '']?.color as any) || 'warning'"
                  :title="FaultImportErrorCodeMap[editRow.last_error_code || '']?.label || editRow.error_msg"
                  style="margin-bottom: 16px"
                />
                <NFormItem :label="t('page.faultImportErrors.labelOriginalSn')">
                  <NText type="warning">{{ editRow.original_info_parsed?.sn || editRow.sn }}</NText>
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelOriginalDownTime')">
                  <NText type="warning">{{ editRow.original_info_parsed?.down_time || editRow.down_time }}</NText>
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelOriginalModel')">
                  <NText type="warning">{{ editRow.original_info_parsed?.model || editRow.model }}</NText>
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelFixedSn')" required>
                  <NInput v-model:value="editForm.sn" :placeholder="t('page.faultImportErrors.placeholderFixedSn')" />
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelFixedSite')">
                  <NSelect
                    v-model:value="editForm.site_id"
                    :options="siteOptions"
                    :placeholder="t('page.faultImportErrors.placeholderChooseSite')"
                    clearable
                    filterable
                    style="width: 100%"
                  />
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelFixedDownTime')" required>
                  <NDatePicker
                    v-model:formatted-value="editForm.down_time"
                    type="datetime"
                    format="yyyy-MM-dd HH:mm:ss"
                    clearable
                    style="width: 100%"
                  />
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelFixedModel')">
                  <NInput v-model:value="editForm.model" />
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelFixedProblemDesc')">
                  <NInput v-model:value="editForm.problem_desc" type="textarea" :rows="2" />
                </NFormItem>
                <NFormItem :label="t('page.faultImportErrors.labelRemark')">
                  <NInput v-model:value="editForm.remark" type="textarea" :rows="2" />
                </NFormItem>
              </NForm>
            </NTabPane>

            <NTabPane name="logs" :tab="t('page.faultImportErrors.tabLogs')">
              <NDataTable
                :columns="logColumns"
                :data="logs"
                :loading="logsLoading"
                :row-key="(row: FaultImportErrorLog) => row.id"
                :pagination="logsPagination"
                :scroll-x="900"
                size="small"
              />
            </NTabPane>
          </NTabs>

          <template #footer>
            <NSpace justify="end">
              <NButton @click="editDrawerShow = false">{{ t('page.faultImportErrors.btnCancel') }}</NButton>
              <NButton @click="onIgnore" v-if="editRow && editRow.status !== 2">
                {{ t('page.faultImportErrors.btnIgnore') }}
              </NButton>
              <NButton type="primary" :loading="submitLoading" @click="onEditSubmit">
                {{ t('page.faultImportErrors.btnSubmitRetry') }}
              </NButton>
            </NSpace>
          </template>
        </NDrawerContent>
      </NDrawer>
    </NDrawerContent>
  </NDrawer>
</template>
