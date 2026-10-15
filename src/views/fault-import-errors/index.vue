<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue';
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

const message = useMessage();

// ============== 查询条件 ==============
const searchForm = ref({
  sn: '',
  site_id: '' as string,
  group_id: '1',
  status: null as 0 | 1 | 2 | null,
  start_at: null as string | null,
  end_at: null as string | null
});

const statusOptions: SelectOption[] = [
  { label: '待处理', value: 0 },
  { label: '已处理', value: 1 },
  { label: '已忽略', value: 2 }
];

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
      site_id: searchForm.value.site_id ? Number(searchForm.value.site_id) : undefined,
      group_id: searchForm.value.group_id || '1',
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
    site_id: '',
    group_id: '1',
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
const statusTextMap: Record<number, string> = {
  0: '待处理',
  1: '已处理',
  2: '已忽略'
};

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
  { title: 'ID', key: 'id', width: 70 },
  { title: '场地', key: 'site_name', width: 130, ellipsis: { tooltip: true } },
  { title: 'Excel行', key: 'line_num', width: 80 },
  { title: '下架时间', key: 'down_time', width: 160 },
  { title: '规格', key: 'model', width: 100 },
  { title: 'SN', key: 'sn', width: 180 },
  { title: '问题描述', key: 'problem_desc', width: 200, ellipsis: { tooltip: true } },
  { title: '错误原因', key: 'error_msg', minWidth: 240, ellipsis: { tooltip: true } },
  {
    title: '错误码',
    key: 'last_error_code',
    width: 130,
    render: row => renderErrorCodeTag(row.last_error_code)
  },
  { title: '重试', key: 'retry_count', width: 70 },
  { title: '操作人', key: 'importer_name', width: 100 },
  { title: '源文件', key: 'source_file', width: 180, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: row =>
      h(
        NTag,
        { type: statusColorMap[row.status] || 'default', size: 'small' },
        { default: () => statusTextMap[row.status] || '-' }
      )
  },
  { title: '处理时间', key: 'processed_at', width: 160 },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: row =>
      h(
        NSpace,
        { size: 8 },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                ghost: true,
                onClick: () => openEditDrawer(row)
              },
              { default: () => '处理' }
            ),
            h(
              NButton,
              {
                size: 'small',
                onClick: () => showDetail(row)
              },
              { default: () => '详情' }
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

// ============== 初始化 ==============
onMounted(() => {
  loadData();
  loadSiteOptions();
});
</script>

<template>
  <div class="p-16px">
    <NCard title="故障机导入错误记录" :bordered="false" class="mb-16px">
      <NForm inline :model="searchForm" label-placement="left" label-width="80">
        <NFormItem label="SN">
          <NInput
            v-model:value="searchForm.sn"
            placeholder="机器 SN"
            clearable
            style="width: 200px"
          />
        </NFormItem>
        <NFormItem label="场地ID">
          <NInput
            v-model:value="searchForm.site_id"
            placeholder="场地 ID"
            clearable
            style="width: 160px"
          />
        </NFormItem>
        <NFormItem label="group_id">
          <NInput
            v-model:value="searchForm.group_id"
            placeholder="group_id"
            clearable
            style="width: 100px"
          />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="searchForm.status"
            :options="statusOptions"
            placeholder="全部"
            clearable
            style="width: 140px"
          />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" @click="onSearch">查询</NButton>
            <NButton @click="onReset">重置</NButton>
            <NButton @click="loadData">刷新</NButton>
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
    <NModal v-model:show="detailShow" preset="card" title="错误记录详情" style="width: 720px">
      <NForm v-if="detailRow" label-placement="left" label-width="100">
        <NFormItem label="ID">
          <NText>{{ detailRow.id }}</NText>
        </NFormItem>
        <NFormItem label="场地">
          <NText>{{ detailRow.site_name }} (ID: {{ detailRow.site_id }})</NText>
        </NFormItem>
        <NFormItem label="Excel 行号">
          <NText>{{ detailRow.line_num }}</NText>
        </NFormItem>
        <NFormItem label="下架时间">
          <NText>{{ detailRow.down_time }}</NText>
        </NFormItem>
        <NFormItem label="规格">
          <NText>{{ detailRow.model }}</NText>
        </NFormItem>
        <NFormItem label="SN">
          <NText>{{ detailRow.sn }}</NText>
        </NFormItem>
        <NFormItem label="问题描述">
          <NText>{{ detailRow.problem_desc }}</NText>
        </NFormItem>
        <NFormItem label="错误原因">
          <NText>{{ detailRow.error_msg }}</NText>
        </NFormItem>
        <NFormItem label="错误码">
          <component :is="renderErrorCodeTag(detailRow.last_error_code)" />
        </NFormItem>
        <NFormItem label="原始数据 (OriginalInfo)">
          <NText style="white-space: pre-wrap; word-break: break-all">
            {{ detailRow.original_info || '-' }}
          </NText>
        </NFormItem>
        <NFormItem label="重试次数">
          <NText>{{ detailRow.retry_count || 0 }}</NText>
        </NFormItem>
        <NFormItem label="处理状态">
          <NTag :type="statusColorMap[detailRow.status] || 'default'">
            {{ statusTextMap[detailRow.status] || '-' }}
          </NTag>
        </NFormItem>
        <NFormItem label="处理备注">
          <NText>{{ detailRow.remark || '-' }}</NText>
        </NFormItem>
        <NFormItem label="处理时间">
          <NText>{{ detailRow.processed_at || '-' }}</NText>
        </NFormItem>
        <NFormItem label="修正人/时间">
          <NText>{{ detailRow.processed_by || '-' }} / {{ detailRow.processed_at || '-' }}</NText>
        </NFormItem>
        <NFormItem label="创建时间">
          <NText>{{ detailRow.created_at || '-' }}</NText>
        </NFormItem>
      </NForm>
    </NModal>

    <!-- 处理抽屉（带修正后字段 + 审计 tab） -->
    <NDrawer v-model:show="editDrawerShow" :width="720" placement="right">
      <NDrawerContent
        :title="`处理导入错误 #${editRow?.id || ''}`"
        closable
      >
        <NTabs type="line" animated>
          <!-- Tab 1: 修正 + 提交 -->
          <NTabPane name="fix" tab="修正提交">
            <NForm v-if="editRow" :model="editForm" label-placement="left" label-width="100">
              <NAlert
                :type="(FaultImportErrorCodeMap[editRow.last_error_code || '']?.color as any) || 'warning'"
                :title="FaultImportErrorCodeMap[editRow.last_error_code || '']?.label || editRow.error_msg"
                style="margin-bottom: 16px"
              >
                <!-- {{ editRow.error_msg }} -->
              </NAlert>


              <NFormItem label="原 SN">
                <NText type="warning">{{ editRow.original_info_parsed?.sn || editRow.sn }}</NText>
              </NFormItem>
              <NFormItem label="原下架时间">
                <NText type="warning">{{ editRow.original_info_parsed?.down_time || editRow.down_time }}</NText>
              </NFormItem>
              <NFormItem label="原规格">
                <NText type="warning">{{ editRow.original_info_parsed?.model || editRow.model }}</NText>
              </NFormItem>


              <NFormItem label="修正 SN" required>
                <NInput v-model:value="editForm.sn" placeholder="修正后的 SN" />
              </NFormItem>
              <NFormItem label="修正场地">
                <NSelect
                  v-model:value="editForm.site_id"
                  :options="siteOptions"
                  placeholder="选择场地"
                  clearable
                  filterable
                  style="width: 100%"
                />
              </NFormItem>

              <NFormItem label="修下架时间" required>
                <NDatePicker
                  v-model:formatted-value="editForm.down_time"
                  type="datetime"
                  format="yyyy-MM-dd HH:mm:ss"
                  clearable
                  style="width: 100%"
                />
              </NFormItem>
              <NFormItem label="修正规格">
                <NInput v-model:value="editForm.model" />
              </NFormItem>
              <NFormItem label="修正问题描述">
                <NInput v-model:value="editForm.problem_desc" type="textarea" :rows="2" />
              </NFormItem>

              <!-- <NFormItem label="处理状态">
                <NSelect v-model:value="editForm.status" :options="statusOptions" />
              </NFormItem> -->
              <NFormItem label="处理备注">
                <NInput v-model:value="editForm.remark" type="textarea" :rows="2" />
              </NFormItem>
            </NForm>
          </NTabPane>

          <!-- Tab 2: 审计历史 -->
          <NTabPane name="logs" tab="修改历史">
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
            <NButton @click="editDrawerShow = false">取消</NButton>
            <NButton @click="onIgnore" v-if="editRow && editRow.status !== 2">标记为已忽略</NButton>
            <NButton type="primary" :loading="submitLoading" @click="onEditSubmit">提交并重试</NButton>
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

const logColumns: DataTableColumns<FaultImportErrorLog> = [
{
  title: '时间',
  key: 'created_at',
  width: 180,
  render: row => formatDate(row.created_at)
} ,
  {
    title: '操作',
    key: 'action',
    width: 100,
    render: (row: FaultImportErrorLog) =>
      h(
        NTag,
        { type: (row.action === 'resolve' ? 'success' : row.action === 'retry' ? 'warning' : 'default') as any, size: 'small' },
        { default: () => row.action }
      )
  },
  { title: '操作人', key: 'operator_name', width: 120 },
  { title: '结果', key: 'error_msg', ellipsis: { tooltip: true } }
];
</script>

<style scoped>
.mb-16px {
  margin-bottom: 16px;
}
.p-16px {
  padding: 16px;
}
</style>
