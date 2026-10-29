<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  NText,
  NTooltip,
  useMessage
} from 'naive-ui';
import type { DataTableColumns, SelectOption } from 'naive-ui';
import {
  FaultImportErrorCodeMap,
  fetchFaultImportErrorLogs,
  fetchFaultImportErrors,
  updateFaultImportError,
  type FaultImportError,
  type FaultImportErrorLog
} from '@/service/api/faults';
import { fetchSites } from '@/service/api/site';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/store/modules/auth';

const { t } = useI18n();
const message = useMessage();
const route = useRoute();

const authStore = useAuthStore();
// 只读用户（角色5）：仅可查看，操作列只保留「查看」，不提供「处理」
const isRead = authStore.userInfo.roles.includes('5');

// ============== 查询条件 ==============
const searchForm = ref({
  sn: '',
  site_id: null as number | null,
  // group_id: '1',
  status: null as 0 | 1 | 2 | null,
  start_at: null as string | null,
  end_at: null as string | null
});

const statusOptions = computed<SelectOption[]>(() => [
  { label: t('page.faultImportErrors.statusPending'), value: 0 },
  { label: t('page.faultImportErrors.statusProcessed'), value: 1 },
  { label: t('page.faultImportErrors.statusIgnored'), value: 2 }
]);

// ============== 数据 & 分页 ==============
const dataList = ref<FaultImportError[]>([]);
const total = ref(0);
const loading = ref(false);
const pagination = ref({
  page: 1,
  pageSize: 20,
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
    const res = await fetchFaultImportErrors({
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      sn: searchForm.value.sn || undefined,
      site_id: searchForm.value.site_id ?? undefined,
      // group_id: searchForm.value.group_id || '1',
      status: searchForm.value.status === null ? undefined : searchForm.value.status,
      start_at: searchForm.value.start_at || undefined,
      end_at: searchForm.value.end_at || undefined
    });
    // console.log('导入错误记录接口返回:', res.data );

    if (!res || !res.data) {
      message.error('加载导入错误记录失败：接口未返回数据');
      dataList.value = [];
      total.value = 0;
      return;
    }
    // 解析 data.data.list（接口返回 { code, msg, data: { list, total, ... } }）
    const payload = res.data ?? {};
    // console.log('导入错误记录接口返回:', payload);
    dataList.value = Array.isArray(payload.list) ? payload.list : [];
    total.value = payload.total ?? 0;
  } catch (err) {
    message.error('加载导入错误记录失败');
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
  searchForm.value = {
    sn: '',
    site_id: null,
    // group_id: '1',
    status: null,
    start_at: null,
    end_at: null
  };
  pagination.value.page = 1;
  loadData();
}

// ============== 状态颜色 ==============
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


function renderErrorCodeTag(code?: string) {
  if (!code) return h(NText, { depth: 3 }, { default: () => '-' });
  const meta = FaultImportErrorCodeMap[code] || { color: 'default', label: code };
  const colorMap: Record<string, 'default' | 'warning' | 'success' | 'info' | 'error' | 'primary'> = {
    red: 'error',
    orange: 'warning',
    blue: 'info',
    green: 'success',
    default: 'default'
  };
  return h(NTag, { type: colorMap[meta.color] || 'default', size: 'small' }, { default: () => meta.label });
}

// ============== 表格列 ==============
const columns = computed<DataTableColumns<FaultImportError>>(() => [
  // { title: t('page.faultImportErrors.colId'), key: 'id', width: 70 },
  { title: t('page.faultImportErrors.colSn'), key: 'sn', width: 180 },
  { title: t('page.faultImportErrors.colSiteName'), key: 'site_name', width: 130, ellipsis: { tooltip: true } },
  // { title: t('page.faultImportErrors.colLineNum'), key: 'line_num', width: 80 },
  { title: t('page.faultImportErrors.colDownTime'), key: 'down_time', width: 160 },
  // { title: t('page.faultImportErrors.colModel'), key: 'model', width: 100 },

  { title: t('page.faultImportErrors.colProblemDesc'), key: 'problem_desc', width: 200, ellipsis: { tooltip: true } },
  { title: t('page.faultImportErrors.colErrorMsg'), key: 'error_msg', minWidth: 240, ellipsis: { tooltip: true } },
  // {
  //   title: t('page.faultImportErrors.colLastErrorCode'),
  //   key: 'last_error_code',
  //   width: 130,
  //   render: row => renderErrorCodeTag(row.last_error_code)
  // },
  { title: t('page.faultImportErrors.colRetryCount'), key: 'retry_count', width: 70 },
  { title: t('page.faultImportErrors.colImporterName'), key: 'importer_name', width: 100 },
  // { title: t('page.faultImportErrors.colSourceFile'), key: 'source_file', width: 180, ellipsis: { tooltip: true } },
  {
    title: t('page.faultImportErrors.colStatus'),
    key: 'status',
    width: 100,
    render: row =>
      h(
        NTag,
        { type: statusColorMap[row.status] || 'default', size: 'small' },
        { default: () => statusTextMap.value[row.status] || '-' }
      )
  },
  { title: t('page.faultImportErrors.colProcessedAt'), key: 'processed_at', width: 160 },
  {
    title: t('page.faultImportErrors.colActions'),
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: row =>
      h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            // 只读用户仅可查看，不提供「处理」入口
            !isRead
              ? h(
                  NButton,
                  {
                    size: 'small',
                    type: 'primary',
                    ghost: true,
                    onClick: () => openEditDrawer(row)
                  },
                  { default: () => t('page.faultImportErrors.btnProcess') }
                )
              : null,
            h(
              NButton,
              {
                size: 'small',
                onClick: () => showDetail(row)
              },
              { default: () => t('page.faultImportErrors.btnDetail') }
            )
          ]
        }
      )
  }
]);

// ============== 详情 Modal ==============
const detailRow = ref<FaultImportError | null>(null);
const detailShow = ref(false);
function showDetail(row: FaultImportError) {
  detailRow.value = row;
  detailShow.value = true;
}

// ============== 处理抽屉（带原值对照） ==============
const editRow = ref<FaultImportError | null>(null);
const editDrawerShow = ref(false);
const editForm = ref({
  status: 1 as 0 | 1 | 2,
  remark: '',
  sn: '',
  down_time: null as string | null,
  model: '',
  problem_desc: '',
  site_id: null as number | null,
  // last_error_code: ''
});
const submitLoading = ref(false);

// 安全解析下架时间：不合法的值置为 null，避免 NDatePicker 报 RangeError
function safeDownTime(val: unknown): string | null {
  if (!val) return null;
  const d = dayjs(val as string);
  return d.isValid() ? (d.format('YYYY-MM-DD HH:mm:ss') as string) : null;
}

// ============== 场地下拉 ==============
const siteOptions = ref<SelectOption[]>([]);

// 场地名称渲染：超宽省略号，鼠标悬停显示完整名称
function renderSiteLabel(option: SelectOption) {
  const label = String(option.label ?? '');
  return h(
    NTooltip,
    { trigger: 'hover', placement: 'bottom' },
    {
      trigger: () =>
        h(
          'div',
          { class: 'w-full overflow-hidden text-ellipsis whitespace-nowrap', title: label },
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
      label: s.name ?? s.site_name ?? `场地#${s.id}`,
      value: s.id
    }));
  } catch (err) {
    console.error('加载场地列表失败', err);
    siteOptions.value = [];
  }
}

function openEditDrawer(row: FaultImportError) {
  editRow.value = row;
  // 预填：原值 = 当前行值
  const orig = row.original_info_parsed || {};
  editForm.value = {
    status: row.status === 0 ? 1 : row.status,
    remark: row.remark || '',
    sn: orig.sn ?? row.sn,
    down_time: safeDownTime(orig.down_time ?? row.down_time),
    model: orig.model ?? row.model,
    problem_desc: orig.problem_desc ?? row.problem_desc,
    site_id: row.site_id ?? null,
    // last_error_code: row.last_error_code
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
      const data = res.data;
      if (data?.ok) {
        message.success(`处理成功${data.fault_id ? `，已转换为故障机 #${data.fault_id}` : ''}`);
        editDrawerShow.value = false;
        loadData();
      } else {
        // 失败但 HTTP 200：data.ok=false, error_code 必有
        const code = data?.error_code || 'unknown';
        const label = FaultImportErrorCodeMap[code]?.label || code;
        message.warning(`重插失败[${label}]: ${data?.error || '未知'}`);
        // 不关闭抽屉，让运维继续改
      }
    } else {
      console.error(res.data?.error || '处理失败');
      message.error(res.data?.error || '处理失败');
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
    }
  } catch (err) {
    message.error('忽略失败');
  } finally {
    submitLoading.value = false;
  }
}

// ============== 审计历史 ==============
const logsLoading = ref(false);
const logs = ref<FaultImportErrorLog[]>([]);
const logsTotal = ref(0);
const logsPagination = ref({
  page: 1,
  pageSize: 10,
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
    if (!res || !res.data) {
      logs.value = [];
      logsTotal.value = 0;
      return;
    }
    const payload = res.data ?? {};
    logs.value = Array.isArray(payload.list) ? payload.list : [];
    logsTotal.value = Number(payload.total ?? 0);
  } catch (err) {
    console.error(err);
    logs.value = [];
    logsTotal.value = 0;
  } finally {
    logsLoading.value = false;
  }
}

watch(editDrawerShow, (show) => {
  if (show) {
    // 重新打开抽屉时重置分页到第一页
    logsPagination.value.page = 1;
    logsPagination.value.pageSize = 10;
    loadLogs();
  }
});

const actionColorMap: Record<string, string> = {
  edit: 'default',
  retry: 'warning',
  ignore: 'info',
  restore: 'warning',
  resolve: 'success'
};
const actionTextMap: Record<string, string> = {
  edit: '编辑',
  retry: '重试',
  ignore: '忽略',
  restore: '退回',
  resolve: '已解决'
};

// ============== 修改历史列（i18n 版） ==============
const logColumns = computed<DataTableColumns<FaultImportErrorLog>>(() => [
  {
    title: t('page.faultImportErrors.logColTime'),
    key: 'created_at',
    width: 180,
    render: (row: FaultImportErrorLog) => formatDate(row.created_at)
  },
  {
    title: t('page.faultImportErrors.logColAction'),
    key: 'action',
    width: 100,
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
  { title: t('page.faultImportErrors.logColOperator'), key: 'operator_name', width: 120 },
  { title: t('page.faultImportErrors.logColResult'), key: 'error_msg', ellipsis: { tooltip: true } }
]);

// ============== 路由传参：接收其他页面跳转过来的 site_id ==============
// 兼容两种传法：
//   1. query: /fault-import-errors?site_id=9
//   2. params: /fault-import-errors/:site_id（需要路由配置支持）
function parseSiteIdFromRoute(): number | null {
  const raw = route.query.site_id ?? route.params.site_id;
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

// 首次进入时把路由上的 site_id 回填到筛选表单
function applyRouteSiteId() {
  const siteId = parseSiteIdFromRoute();
  if (siteId !== null) {
    searchForm.value.site_id = siteId;
  }
  return siteId;
}

// 路由 site_id 变化时（例如从其他页面再次跳转过来）自动重新查询
watch(
  () => route.query.site_id ?? route.params.site_id,
  () => {
    const siteId = parseSiteIdFromRoute();
    if (siteId === searchForm.value.site_id) return;
    searchForm.value.site_id = siteId;
    pagination.value.page = 1;
    loadData();
  }
);

// ============== 初始化 ==============
onMounted(() => {
  applyRouteSiteId();
  loadData();
  loadSiteOptions();
});
</script>

<template>
  <div class="p-16px">
    <NCard :title="t('page.faultImportErrors.colErrorMsg').length ? t('page.faultImportErrors.colErrorMsg') : '故障机导入错误记录'" :bordered="false" class="mb-16px">
      <NForm inline :model="searchForm" label-placement="left" label-width="80">
        <NFormItem>
          <NInput
            v-model:value="searchForm.sn"
            :placeholder="t('page.faultImportErrors.placeholderSn')"
            clearable
            style="width: 200px"
          />
        </NFormItem>
        <NFormItem>
          <NSelect
            v-model:value="searchForm.site_id"
            :options="siteOptions"
            :placeholder="t('page.faultImportErrors.labelSiteId')"
            :render-label="renderSiteLabel"
            filterable
            clearable
            style="width: 180px"
            @update:value="onSearch"
          />
        </NFormItem>
        <NFormItem>
          <NSelect
            v-model:value="searchForm.status"
            :options="statusOptions"
            :placeholder="t('page.faultImportErrors.labelStatus')"
            clearable
            style="width: 140px"
          />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="onSearch">{{ t('page.faultImportErrors.btnSearch') }}</NButton>
            <NButton @click="onReset">{{ t('page.faultImportErrors.btnReset') }}</NButton>
            <NButton @click="loadData">{{ t('page.faultImportErrors.btnRefresh') }}</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>

    <NCard :bordered="false">
      <NDataTable
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: FaultImportError) => row.id"
        :scroll-x="2200"
        striped
        flex-height
        style="min-height: 600px"
      />
    </NCard>

    <!-- 详情 Modal -->
    <NModal v-model:show="detailShow" preset="card" :title="t('page.faultImportErrors.detailModalTitle')" style="width: 720px">
      <NForm v-if="detailRow" label-placement="left" label-width="100">
        <NFormItem :label="t('page.faultImportErrors.detailLabelId')">
          <NText>{{ detailRow.id }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelSite')">
          <NText>{{ detailRow.site_name }} (ID: {{ detailRow.site_id }})</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelLineNum')">
          <NText>{{ detailRow.line_num }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelDownTime')">
          <NText>{{ detailRow.down_time }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelModel')">
          <NText>{{ detailRow.model }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelSn')">
          <NText>{{ detailRow.sn }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelProblemDesc')">
          <NText>{{ detailRow.problem_desc }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelErrorMsg')">
          <NText>{{ detailRow.error_msg }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelErrorCode')">
          <component :is="renderErrorCodeTag(detailRow.last_error_code)" />
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelOriginalInfo')">
          <NText style="white-space: pre-wrap; word-break: break-all">
            {{ detailRow.original_info || '-' }}
          </NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelRetryCount')">
          <NText>{{ detailRow.retry_count || 0 }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelProcessedStatus')">
          <NTag :type="statusColorMap[detailRow.status] || 'default'">
            {{ statusTextMap[detailRow.status] || '-' }}
          </NTag>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelRemark')">
          <NText>{{ detailRow.remark || '-' }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelProcessedAt')">
          <NText>{{ detailRow.processed_at || '-' }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelProcessedByAndAt')">
          <NText>{{ detailRow.processed_by || '-' }} / {{ detailRow.processed_at || '-' }}</NText>
        </NFormItem>
        <NFormItem :label="t('page.faultImportErrors.detailLabelCreatedAt')">
          <NText>{{ detailRow.created_at || '-' }}</NText>
        </NFormItem>
      </NForm>
    </NModal>

    <!-- 处理抽屉（带修正后字段 + 审计 tab） -->
    <NDrawer v-model:show="editDrawerShow" :width="720" placement="right">
      <NDrawerContent
        :title="t('page.faultImportErrors.drawerTitle', { id: editRow?.id || '' })"
        closable
      >
        <NTabs type="line" animated>
          <!-- Tab 1: 修正 + 提交 -->
          <NTabPane name="fix" :tab="t('page.faultImportErrors.tabFix')">
            <NForm v-if="editRow" :model="editForm" label-placement="left" label-width="100">
              <NAlert
                :type="(FaultImportErrorCodeMap[editRow.last_error_code || '']?.color as any) || 'warning'"
                :title="FaultImportErrorCodeMap[editRow.last_error_code || '']?.label || editRow.error_msg"
                style="margin-bottom: 16px"
              >
                <!-- {{ editRow.error_msg }} -->
              </NAlert>


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

          <!-- Tab 2: 审计历史 -->
          <NTabPane name="logs" :tab="t('page.faultImportErrors.tabLogs')">
            <NDataTable
              :columns="logColumns"
              :data="logs"
              :loading="logsLoading"
              :row-key="(row: FaultImportErrorLog) => row.id"
              :pagination="logsPagination"
              :scroll-x="1000"
              size="small"
            />
          </NTabPane>
        </NTabs>

        <!-- footer 放在 NDrawerContent 上，naive-ui 才会渲染 -->
        <template #footer>
          <NSpace justify="end">
            <NButton @click="editDrawerShow = false">{{ t('page.faultImportErrors.btnCancel') }}</NButton>
            <NButton @click="onIgnore" v-if="!isRead && editRow && editRow.status !== 2">{{ t('page.faultImportErrors.btnIgnore') }}</NButton>
            <NButton type="primary" :loading="submitLoading" @click="onEditSubmit" v-if="!isRead">{{ t('page.faultImportErrors.btnSubmitRetry') }}</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script lang="ts">
// 格式化 ISO 时间为 年-月-日 时:分:秒
function formatDate(iso?: string | null): string {
  if (!iso) return '-';
  const d = dayjs(iso);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : iso;
}

// logColumns 已在 setup 块中通过 computed 定义（支持 i18n）
</script>

<style scoped>
.mb-16px {
  margin-bottom: 16px;
}
.p-16px {
  padding: 16px;
}
</style>
