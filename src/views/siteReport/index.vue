
<script setup lang="ts">
import { onMounted, ref,h } from 'vue';
import { NDataTable, useMessage, NButton, NModal, NForm, NFormItem, NInput, NInputNumber, NDatePicker } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';

import { fetchSiteReport, postSiteReport, updateSiteReport } from '@/service/api/site';

interface SiteReportItem {
  // account: string;
  created_at: string;
  date: string;
  donated_repair: number;//寄修
  id: number;
  on_site_repair: number;//驻场维修
  pending_repair: number;
  real_name: string;
  site_name: string;
  reporter: number;
  scrapped: number;
  today_off_shelf: number;
  today_on_shelf: number;
  total_faults: number;
  updated_at: string;
  wait_off_shelf: number;
  wait_on_shelf: number;
}

const message = useMessage();

const tableData = ref<SiteReportItem[]>([]);
const loading = ref(false);
const pagination = ref<PaginationProps>({ page: 1, pageSize: 20, pageCount: 1, itemCount: 0, showSizePicker: true, pageSizes: [10, 20, 50, 100] });

// 编辑/新增状态
const isEdit = ref(false);
const editingId = ref<number|null>(null);

function openEdit(row: SiteReportItem) {
  resetForm();
  isEdit.value = true;
  editingId.value = row.id;
  // 预填充数据
  // 日期字符串转时间戳（仅年月日）
  const ts = new Date(row.date).getTime();
  (formModel.value as any).dateTs = isNaN(ts) ? undefined : ts;
  formModel.value.date = isNaN(ts) ? row.date : formatDateOnly(ts);
  // 字段映射
  formModel.value.on_site_repair = Number(row.on_site_repair) || 0;
  formModel.value.off_site_repair = Number((row as any).donated_repair) || 0; // 列表字段为 donated_repair
  formModel.value.pending_repair = Number(row.pending_repair) || 0;
  formModel.value.scrapped = Number(row.scrapped) || 0;
  formModel.value.today_off_shelf = Number(row.today_off_shelf) || 0;
  formModel.value.today_on_shelf = Number(row.today_on_shelf) || 0;
  formModel.value.total_faults = Number(row.total_faults) || 0;
  formModel.value.wait_off_shelf = Number(row.wait_off_shelf) || 0;
  formModel.value.wait_on_shelf = Number(row.wait_on_shelf) || 0;
  showCreate.value = true;
}

const columns: DataTableColumns<SiteReportItem> = [
  { title: '日期', key: 'date', width: 120, render: (row) => {
    const d = new Date(row.date);
    if (isNaN(d.getTime())) return String(row.date ?? '');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  } },
  { title: '场地名', key: 'site_name', width: 120 },
  // { title: '工单账号', key: 'account', width: 160 },
  // { title: '工单人员', key: 'real_name', width: 120 },
  { title: '驻场维修', key: 'on_site_repair', width: 100 },
  { title: '寄修', key: 'donated_repair', width: 100 },
  { title: '待维修', key: 'pending_repair', width: 100 },
  { title: '报废', key: 'scrapped', width: 100 },
  { title: '今日下架', key: 'today_off_shelf', width: 100 },
  { title: '今日上架', key: 'today_on_shelf', width: 100 },
  { title: '总故障数', key: 'total_faults', width: 100 },
  { title: '待下架', key: 'wait_off_shelf', width: 100 },
  { title: '待上架', key: 'wait_on_shelf', width: 100 },
  { title: '创建时间', key: 'created_at', width: 160, render: (row) => formatDateTime(row.created_at) },
  { title: '更新时间', key: 'updated_at', width: 160, render: (row) => formatDateTime(row.updated_at) },
  { title: "操作",key: 'operation', width: 100, render: (row) => {
    return h(NButton, { type: 'primary', size: 'small', onClick: () => openEdit(row) }, { default: () => '编辑' });
  }},
];

function formatDateTime(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${da} ${hh}:${mm}:${ss}`;
}

// 声明接口返回的数据结构类型，便于类型推断
interface SiteReportListResponse {
  data?: {
    list?: SiteReportItem[];
    pagination?: { pages?: number; page_size?: number };
  };
  code?: number;
  msg?: string;
}

async function fetchData() {
  try {
    loading.value = true;
    const { data,error, response: { data: resData } } = await fetchSiteReport({ page: pagination.value.page, page_size: pagination.value.pageSize });
    console.log(data,error,resData)
    if (error == null && Number(resData.code)==0) {
      const list = Array.isArray(data?.list) ? data.list : [];
      tableData.value = list as SiteReportItem[];
      const pc = Number(data?.pagination?.pages) || 10;
      const ic = Number(data?.pagination?.page_size) || list.length;
      pagination.value.pageCount = pc;
      pagination.value.itemCount = ic;
    } else {
      message.error(`获取日报失败: ${error}`);
    }
  } catch (err) {
    message.error(`获取日报失败: ${err}`);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

// 新增日报弹框状态与表单
const showCreate = ref(false);
const saving = ref(false);
const formModel = ref({
  // account: '',
  date: '',
  off_site_repair: 0,
  on_site_repair: 0,
  pending_repair: 0,
  scrapped: 0,
  today_off_shelf: 0,
  today_on_shelf: 0,
  total_faults: 0,
  wait_off_shelf: 0,
  wait_on_shelf: 0
});

function resetForm() {
  formModel.value = {
    // account: '',
    date: '',
    off_site_repair: 0,
    on_site_repair: 0,
    pending_repair: 0,
    scrapped: 0,
    today_off_shelf: 0,
    today_on_shelf: 0,
    total_faults: 0,
    wait_off_shelf: 0,
    wait_on_shelf: 0
  };
  (formModel.value as any).dateTs = undefined;
}

function formatDateOnly(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function openCreate() {
  resetForm();
  isEdit.value = false;
  editingId.value = null;
  showCreate.value = true;
}

async function saveReport() {
  if (!formModel.value.date) {
    message.warning('请选择日期');
    return;
  }
  try {
    saving.value = true;
    let error: unknown = null;
    if (isEdit.value && editingId.value != null) {
      // 编辑：调用更新接口
      const r = await updateSiteReport(editingId.value, { ...formModel.value });
      error = r.error;
    } else {
      // 新增：调用新增接口
      const r = await postSiteReport({ ...formModel.value });
      error = r.error;
    }
    if (error == null) {
      message.success(isEdit.value ? '编辑日报成功' : '新增日报成功');
      showCreate.value = false;
      isEdit.value = false;
      editingId.value = null;
      fetchData();
    } else {
      message.error(`${isEdit.value ? '编辑' : '新增'}日报失败: ${error}`);
    }
  } catch (err) {
    message.error(`${isEdit.value ? '编辑' : '新增'}日报失败: ${err}`);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex gap-16px flex-col-stretch lt-sm:overflow-auto">
    <n-card size="small" class="card-wrapper flex flex-col gap-16px h-[calc(100vh-250px)]" style="padding-bottom: 50px;">
      <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 16px">
        <div style="display: flex; gap: 8px; align-items: center;">
          场地每日日报
        </div>
        <div>
          <NButton size="small" type="primary" @click="openCreate">添加日报</NButton>
        </div>
      </div>
      <NDataTable
        flex-height
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        remote
        :scroll-x="1400"
        striped
        class="sm:h-full"
        @update:page="(p:number)=>{ pagination.page=p; fetchData(); }"
        @update:page-size="(ps:number)=>{ pagination.pageSize=ps; pagination.page=1; fetchData(); }"
      />
      <NModal v-model:show="showCreate" preset="card" :title="isEdit ? '编辑场地日报' : '新增场地日报'" style="width: 680px;">
        <NForm label-placement="left" label-width="100px" require-mark-placement="left">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <!-- <NFormItem label="工单账号">
              <NInput v-model:value="formModel.account" placeholder="请输入工单账号" />
            </NFormItem> -->
            <NFormItem label="日期">
              <NDatePicker
                v-model:value="(formModel as any).dateTs"
                type="date"
                clearable
                @update:value="(v:number|null)=>{ formModel.date = v ? formatDateOnly(v) : ''; }"
              />
            </NFormItem>
            <NFormItem label="外部维修">
              <NInputNumber v-model:value="formModel.off_site_repair" :min="0" />
            </NFormItem>
            <NFormItem label="驻场维修">
              <NInputNumber v-model:value="formModel.on_site_repair" :min="0" />
            </NFormItem>
            <NFormItem label="待维修">
              <NInputNumber v-model:value="formModel.pending_repair" :min="0" />
            </NFormItem>
            <NFormItem label="报废">
              <NInputNumber v-model:value="formModel.scrapped" :min="0" />
            </NFormItem>
            <NFormItem label="今日下架">
              <NInputNumber v-model:value="formModel.today_off_shelf" :min="0" />
            </NFormItem>
            <NFormItem label="今日上架">
              <NInputNumber v-model:value="formModel.today_on_shelf" :min="0" />
            </NFormItem>
            <NFormItem label="总故障数">
              <NInputNumber v-model:value="formModel.total_faults" :min="0" />
            </NFormItem>
            <NFormItem label="待下架">
              <NInputNumber v-model:value="formModel.wait_off_shelf" :min="0" />
            </NFormItem>
            <NFormItem label="待上架">
              <NInputNumber v-model:value="formModel.wait_on_shelf" :min="0" />
            </NFormItem>
          </div>
        </NForm>
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <NButton @click="showCreate=false" :disabled="saving">取消</NButton>
            <NButton type="primary" :loading="saving" @click="saveReport">保存</NButton>
          </div>
        </template>
      </NModal>
    </n-card>
  </div>
</template>



