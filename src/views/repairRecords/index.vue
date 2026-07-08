<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, NTooltip, NTag, NDropdown, NIcon } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchRepairDetails, exportRepairDetails } from '@/service/api/repair';
import { fetchOrdersSite } from '@/service/api/site';
import { Icon } from '@iconify/vue';

import { useRouter } from 'vue-router';
import RepairSearchBar from './components/RepairSearchBar.vue'
import UploadRepairDetailsExcel from "@/components/upload/UploadRepairDetailsExcel.vue"
import ScrapFlagsModal from './components/ScrapFlagsModal.vue'
import { repairResultMap } from  '@/constants/business'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter();
import { useAuthStore } from '@/store/modules/auth';

const authStore = useAuthStore();
const hasRole=!authStore.userInfo.roles.includes('3')
const isRead=authStore.userInfo.roles.includes('5') // 只读用户


interface Faults {
  id: number;
  serial_number: string;
  serial_number_source: string;
  Faults_type_id:number;
  status_id:number,
  contract_number: string;
  RepairResult:number;
  FaultsType?: {
    name?: string;
    hash_rate?: number;
    name_source?: string;
  };
  Site?: {
    name?: string;
  };
  Status?: {
    name?: string;
  };
  repair_type?: {
    name?: string;
  };
  site_name?: string;
  group_name?: string;
}

const message = useMessage();

const tableData = ref<Faults[]>([]);
const exportData = ref<Faults[]>([]);
const loading = ref(false);
const work_order_no = ref<string>('');
const sn = ref<string>('');
const site_id = ref<number | undefined>(undefined);
const repair_type = ref<number | undefined>(undefined);
const siteOptions = ref<{ label: string; value: number }[]>([]);

// 报废标记弹窗
const showScrapModal = ref(false)
const currentDetailId = ref<number | null>(null)
const currentDetailRow = ref<any | null>(null)

// 导入相关
const uploadRef = ref<any>(null);
const importOptions = [
  { label: t('page.repairRecords.importMachine'), key: 'machine' },
  { label: t('page.repairRecords.importBoard'), key: 'board' }
]

const handleImportSelect = (key: string) => {
  if (key === 'machine') {
    uploadRef.value?.open({
      uploadUrl: '/api/repair_stations/import_repair_details',
      templateUrl: '/template/repair-detail-2026.xlsm',
      templateName: '矿机维修明细导入模板.xlsm',
      title: t('page.repairRecords.importMachineTitle')
    })
  } else if (key === 'board') {
    uploadRef.value?.open({
      uploadUrl: '/api/repair_stations/import_board_repair_details',
      templateUrl: '/template/board-repair-detail.xlsm', // 假设的模板路径，如果没有提供则需要确认
      templateName: '板子维修明细导入模板.xlsm',
      title: t('page.repairRecords.importBoardTitle')
    })
  }
}

const openScrapModal = (row: any) => {
  const rowId = row?.id || row?.ID || row?.Id || row?.workOrderNo || row?.WorkOrderNo
  const numId = Number(rowId)
  if (!Number.isNaN(numId)) {
    currentDetailId.value = numId
    currentDetailRow.value = row
    showScrapModal.value = true
  }
}
// 分页
const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix({ itemCount }) {
    return t('page.repairRecords.totalItems', { count: itemCount })
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

// ---------------- 修改弹框 ----------------
const repair_result = ref<number>();

function goDetail(id: number | string) {
  // console.log("跳转到详情页，ID:", id);
  if (!id) {
    console.error("ID 为空，无法跳转");
    return;
  }
  try {
    router.push({ name: 'repairrecordsdetail', params: { id: String(id) } });
  } catch (error) {
    console.error("路由跳转失败:", error);
  }
}

// 获取场地列表
const getSiteList = async () => {
  try {
    const params: any = {
      enable_all: (hasRole===true && !(localStorage.getItem("onlyMySite")==='true'))?1:-1,
    };
    const { data } = await fetchOrdersSite(params); // 获取所有场地
    if (data) {
      siteOptions.value = data.map((item: any) => ({
        label: item.Name,
        value: item.ID
      }));
    }
  } catch (error) {
    console.error('获取场地列表失败:', error);
  }
};

// 维修结果映射
// const repairResultMap: Record<number, string> = {
//   9: '已修复',
//   10: '未修复',
//   11: '报废'
// }

// 日期时间格式化
const formatDateTime = (value: any) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const renderHeaderTitle = (text: string) => h('span', { class: 'text-xs font-medium text-gray-500' }, text)

const columns: DataTableColumns<any> = [
   { title: () => renderHeaderTitle(t('page.repairRecords.snCode')), key: 'DeviceSN',
   width: 150, render: (row) => {
      const full = (row as any).DeviceSN || '';
      const prefix = full.slice(0, 5);
      const suffix = full.slice(-5);
      const truncated = full.length > 14 ? `${prefix}...${suffix}` : full;
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
          message.success(t('page.repairRecords.snCopied'));
        } catch (e) {
          message.error(t('page.repairRecords.copyFailed'));
        }
      };
      return h(
        NTooltip,
        null,
        {
          trigger: () => h(
            'div',
            {
              style: 'display:flex; align-items:center; gap:8px; max-width:220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
            },
            [
              h(
                'span',
                {
                  class: 'text-sm text-gray-900',
                  style: 'flex:1; min-width:0;'
                },
                truncated
              ),
              h(
                NButton,
                { size: 'tiny', quaternary: true, type: 'primary', onClick: onCopy },
                { default: () => h(Icon, { icon: 'ant-design:copy-outlined', width: 14, height: 14 }) }
              )
            ]
          ),
          default: () => full
        }
      );
    } },
    { title: () => renderHeaderTitle(t('page.repairRecords.type')), key: 'repair_type', width: 100,
    render: (row) => {
      const type = row.repair_type;
      let tagType: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'default' = 'default';
      let label = type || t('page.repairRecords.unknown');

      // 兼容可能返回的数字或文本
      if (type === '整机' || type === t('page.repairRecords.machine') ) {
        tagType = 'info';
        label = t('page.repairRecords.machine');
      } else if (type === '算力板' || type === t('page.repairRecords.hashBoard')) {
        tagType = 'warning';
        label = t('page.repairRecords.hashBoard');
      }

      return h(NTag, { class: 'text-sm', type: tagType, size: 'small', round: true, bordered: false }, () => label);
    }
   },
   { title: () => renderHeaderTitle(t('page.repairRecords.site')), key: 'site_name', width: 180,
    render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.site_name || '-')
   },
  { title: () => renderHeaderTitle(t('page.repairRecords.orderNo')), key: 'WorkOrderNo', width: 150,  render: (row: Faults) => {
      // const full = row.order_no || '';
      const full = (row as any).WorkOrderNo || '';
      const prefix = full.slice(0, 5);
      const suffix = full.slice(-5);
      const truncated = full.length > 14 ? `${prefix}...${suffix}` : full;
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
          message.success(t('page.repairRecords.orderNoCopied'));
        } catch (e) {
          message.error(t('page.repairRecords.copyFailed'));
        }
      };
      return h(
        NTooltip,
        null,
        {
          trigger: () => h(
            'div',
            {
              style: 'display:flex; align-items:center; gap:8px; max-width:220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
            },
            [
              h(
                'span',
                {
                  class: 'text-sm text-gray-500',
                  style: 'flex:1; min-width:0; cursor: pointer;',
                  // onClick: () => router.push({ name: 'workflowdetail', params: { id: row.WorkOrderNo } })
                },
                truncated
              ),
              h(
                NButton,
                { size: 'tiny', quaternary: true, type: 'primary', onClick: onCopy },
                { default: () => h(Icon, { icon: 'ant-design:copy-outlined', width: 14, height: 14 }) }
              )
            ]
          ),
          default: () => full
        }
      ) ;
    }},
  { title: () => renderHeaderTitle(t('page.repairRecords.repairStation')), key: 'RepairStationName', width: 180,
    render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.RepairStationName || '-')
    // ⚠️ 如果需要显示名称，就在 fetchData 里转换
  },
  { title: () => renderHeaderTitle(t('page.repairRecords.repairStationGroup')), key: 'group_name', width: 150,
    render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.group_name || '-')
  },
  { title: () => renderHeaderTitle(t('page.repairRecords.machineModel')), key: 'MachineModel', width: 200, render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.MachineModel || '-') },
  { title: () => renderHeaderTitle(t('page.repairRecords.repairComponent')), key: 'RepairComponent', width: 120, render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.RepairComponent || '-') },
  // { title: '额外操作', key: 'extra_operations', width: 120 },
  {
      title: () => renderHeaderTitle(t('page.repairRecords.defectReason')),
      key: 'DefectReason',
      width: 120,
      render: (row) => {
        const content = row.DefectReason || '-'
        return h(
          NTooltip,
          { trigger: 'hover' },
          {
            trigger: () =>
              h(
                'div',
                {
                  class: 'text-sm text-gray-500',
                  style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
                },
                content
              ),
            default: () => h('div', { style: 'max-width: 300px; white-space: normal; word-break: break-word;' }, content)
          }
        )
      }
    },
  { title: () => renderHeaderTitle(t('page.repairRecords.verifyDefect')), key: 'VerifyDefect', width: 120, render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.VerifyDefect || '-') },
  { title: () => renderHeaderTitle(t('page.repairRecords.repairStatus')), key: 'RepairResult', width: 120,
    render: (row) => {
      const label = repairResultMap[row.RepairResult] || t('page.repairRecords.unknown')
       const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已修复': 'success',
        '报废': 'error',
        '未修复': 'error',
        '待修复': 'warning',
      };
      const type = tagMap[label] || 'default';
      return h(NTag, { type,class:'text-xs', size: 'small',round:true }, () => label)
    }
  },
  {
    title: () => renderHeaderTitle(t('page.repairRecords.date')),
    key: 'Date',
    width: 160,
    align: 'center',
    render: (row: any) => h('span', { class: 'cell-date text-sm text-gray-500' }, formatDateTime(row?.Date))
  },
  {
    title: () => renderHeaderTitle(t('page.repairRecords.action')),
    key: 'actions',
    align: 'center',
    fixed: 'right',
    width: 180,
    render: (row) => {
      // console.log("表格行数据:", row);
      const rowId = row.id || row.ID || row.Id || row.workOrderNo || row.WorkOrderNo;
      // console.log("提取的ID:", rowId);
      if(isRead){
        return [ h(
          NButton,
          {
            type: 'primary',
            size: 'small',
            ghost: true,
            style: 'margin-right: 8px;',
            class:'text-xs',
            onClick: () => goDetail(rowId)
          },
          { default: () => t('page.repairRecords.detail') }
        ),]
      }
      return [
        h(
          NButton,
          {
            type: 'primary',
            size: 'small',
            ghost: true,
            style: 'margin-right: 8px;',
            class:'text-xs',
            onClick: () => goDetail(rowId)
          },
          { default: () => t('page.repairRecords.detail') }
        ),
        row.RepairResult === 4
          ? h(
              NButton,
              {
                type: 'error',
                size: 'small',
                ghost: true,
                style: 'margin-right: 8px;',
                class: 'text-xs',
                onClick: () => openScrapModal(row)
              },
              { default: () => t('page.repairRecords.componentMark') }
            )
          : null,
        // h(
        //   NButton,
        //   {
        //     type: 'info',
        //     size: 'small',
        //     ghost: true,
        //     onClick: () => console.log('编辑:', row)
        //   },
        //   { default: () => '编辑' }
        // )
      ]
    }
  }
]

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  try {
    loading.value = true;
    const params: any = {
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      work_order_no: work_order_no.value,
      sn: sn.value,
      repair_result: repair_result.value,
      site_id: site_id.value,
      repair_type: repair_type.value
    };

    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined || params[key] === null) {
        delete params[key];
      }
    });

    const { data, error } = await fetchRepairDetails(params);
    if(error==null){
        tableData.value = data.list;
        pagination.value.itemCount = Number(data.pagination.total) || 0;
        pagination.value.page = Number(data.pagination.page) || 1;
        pagination.value.pageSize = Number(data.pagination.page_size) || 20;
    }else{
        message.error(t('page.repairRecords.loadFailed', { error }));
    }
  } catch (err) {
    message.error(t('page.repairRecords.loadFailed', { error: String(err) }));
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  fetchData();
  getSiteList();
});
watch(() => [work_order_no.value, sn.value, repair_result.value, site_id.value, repair_type.value], () => {
  tableData.value=[];
  pagination.value.page = 1;
  fetchData();
});

// const isRepairStation = computed(() => {
//   return JSON.parse(localStorage.getItem('userInfo')).role;
// });
const role = JSON.parse(localStorage.getItem('userInfo') ?? '{}')?.role;
const isRepairStation = role === 4;

const exportCsv = async () => {
  loading.value = true;
  try {
    const params: any = {
      sn: sn.value || undefined,
      repair_result: repair_result.value || undefined,
      work_order_no: work_order_no.value || undefined,
    };
    const {data,error} = await exportRepairDetails(params);
    // console.log("导出数据:", data);
    if(error==null){
        exportData.value = data;
        exportExcel();
        // 处理导出成功逻辑

        // const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
        // const url = URL.createObjectURL(blob);
        // const link = document.createElement('a');
        // link.href = url;
        // link.download = `维修明细_导出_${new Date().toISOString().slice(0,10)}.xlsx`;
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
        // URL.revokeObjectURL(url);
        // message.success('导出成功，下载已开始');
    }else{
        message.error(t('page.repairRecords.exportFailed', { error }));
    }
  } catch (err) {
    message.error(t('page.repairRecords.exportFailed', { error: String(err) }));
  } finally {
    loading.value = false;
  }

  // 获取所有待导出数据

};
const exportExcel=async () => {

// 处理导出成功逻辑
 const headers = [
   t('page.repairRecords.exportHeaders.date'),
   t('page.repairRecords.exportHeaders.orderNo'),
   t('page.repairRecords.exportHeaders.machineModel'),
   t('page.repairRecords.exportHeaders.machineSn'),
   t('page.repairRecords.exportHeaders.powerSn'),
   t('page.repairRecords.exportHeaders.board1Sn'),
   t('page.repairRecords.exportHeaders.board2Sn'),
   t('page.repairRecords.exportHeaders.board3Sn'),
   t('page.repairRecords.exportHeaders.controlSn'),
   t('page.repairRecords.exportHeaders.repairComponent'),
   t('page.repairRecords.exportHeaders.extraOperations'),
   t('page.repairRecords.exportHeaders.defectReason'),
   t('page.repairRecords.exportHeaders.defectCode2'),
   t('page.repairRecords.exportHeaders.defectCode3'),
   t('page.repairRecords.exportHeaders.position'),
   t('page.repairRecords.exportHeaders.verifyDefect'),
   t('page.repairRecords.exportHeaders.startTime'),
   t('page.repairRecords.exportHeaders.endTime'),
   t('page.repairRecords.exportHeaders.repairResult'),
   t('page.repairRecords.exportHeaders.downTime'),
   t('page.repairRecords.exportHeaders.onShelfTime'),
   t('page.repairRecords.exportHeaders.createdAt'),
   t('page.repairRecords.exportHeaders.updatedAt'),
   t('page.repairRecords.exportHeaders.repairer'),
   t('page.repairRecords.exportHeaders.repairStation')
 ];
  const formatCell = (val: any) => {
    const s = val === undefined || val === null ? '' : String(val);
    const needsQuote = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
  };
  const rows = exportData.value.map((row: any) => [
    row.Date,
    row.WorkOrderNo,
    row.MachineModel,
    row.DeviceSN,
    row.PowerSN,
    row.BoardSN1,
    row.BoardSN2,
    row.BoardSN3,
    row.ControlSN,
    row.RepairComponent,
    row.extra_operations,
    row.DefectReason,
    row.DefectCode2,
    row.DefectCode3,
    row.Position,
    row.VerifyDefect,

    row.StartTime,
    row.EndTime,
    repairResultMap[row.RepairResult],
    row.down_time,
    row.on_shelf_time,
    row.CreatedAt,
    row.UpdatedAt,
    row.RepairerName,
    row.RepairStationName
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(formatCell).join(','))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0,10);
  link.href = url;
  link.download = `维修明细_导出_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success(t('page.repairRecords.exportSuccess'));
}
const handleFail = () => {
  message.error(t('page.repairRecords.importFailed'));
}

</script>

<template>
  <div class="flex  gap-16px flex-col-stretch  lt-sm:overflow-auto">
    <NCard>
      <RepairSearchBar
              :work-order-no="work_order_no"
              :sn="sn"
              :repair-result="repair_result"
              :site-id="site_id"
              :repair-type="repair_type"
              :site-options="siteOptions"
              @update:work-order-no="work_order_no = $event"
              @update:sn="sn = $event"
              @update:repair-result="repair_result = $event"
              @update:site-id="site_id = $event"
              @update:repair-type="repair_type = $event"
            />
    </NCard>
    <!-- <NCard> -->
    <!-- 查询框 -->
    <n-card size="small" class=" card-wrapper  flex flex-col gap-16px h-[calc(100vh-200px)]">
       <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 6px">
      <div  style="display: flex; gap: 8px; align-items: center;">

        <NDropdown :options="importOptions" @select="handleImportSelect" v-if="isRepairStation">
          <NButton size="small" ghost type="primary">
            <template #icon>
              <NIcon>
                <Icon icon="material-symbols:upload" />
              </NIcon>
            </template>
            {{ t('page.repairRecords.import') }}
          </NButton>
        </NDropdown>

        <UploadRepairDetailsExcel
          ref="uploadRef"
          :show-trigger="false"
          @success="fetchData"
          @fail="handleFail"
        />
      </div>
      <div v-if="!isRead" style="display: flex; gap: 8px; align-items: center;">
        <NButton circle size="medium" ghost @click="exportCsv" :title="t('page.repairRecords.exportCsvTitle')"  style="margin-right: 80px;">
          <template #icon>
            <icon-ant-design-download-outlined />
          </template>
        </NButton>
      </div>
    </div>
    <!-- 表格 -->
    <!-- <NDataTable flex-height small :columns="columns"
    :data="tableData" :pagination="pagination"
    :loading="loading" :scroll-x="1400"
    remote striped
        class="sm:h-full" /> -->

        <NDataTable
        flex-height
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        remote
        :row-key="(row: any) => row.ID"
        :scroll-x="2000"
        striped
        class="sm:h-full"
      />
      <!-- 报废标记弹窗 -->
      <ScrapFlagsModal v-model:show="showScrapModal" :detail-id="currentDetailId" :detail-row="currentDetailRow" @success="fetchData" />
    </n-card>
     <!-- </NCard> -->
  </div>
</template>

<style scoped>
.cell-date {
  font-family: monospace;
  color: #333;
}
.floating-export {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--n-primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
  user-select: none;
  font-size: 20px;
  z-index: 1000;
}
.floating-export:hover {
  filter: brightness(1.05);
}
</style>
