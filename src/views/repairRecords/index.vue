<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, NTooltip,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchRepairDetails, exportRepairDetails } from '@/service/api/repair';
import { Icon } from '@iconify/vue';

import { useRouter } from 'vue-router';
import RepairSearchBar from './components/RepairSearchBar.vue'
import UploadRepairDetailsExcel from "@/components/upload/UploadRepairDetailsExcel.vue"
import ScrapFlagsModal from './components/ScrapFlagsModal.vue'
import { repairResultMap } from  '@/constants/business'

const router = useRouter();

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
}

const message = useMessage();

const tableData = ref<Faults[]>([]);
const exportData = ref<Faults[]>([]);
const loading = ref(false);
const work_order_no = ref<string>('');
const sn = ref<string>('');
// 报废标记弹窗
const showScrapModal = ref(false)
const currentDetailId = ref<number | null>(null)
const currentDetailRow = ref<any | null>(null)
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
    return `共 ${itemCount} 条`
  },
  onChange: page => {
    pagination.value.page = page;
    fetchData();
  },
  onUpdatePageSize: pageSize => {
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
   { title: () => renderHeaderTitle('整机SN码'), key: 'DeviceSN', 
   width: 150, render: (row) => {
      const full = (row as any).DeviceSN || '';
      const prefix = full.slice(0, 6);
      const suffix = full.slice(-6);
      const truncated = full.length > 14 ? `${prefix}...${suffix}` : full;
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
          message.success('SN 已复制');
        } catch (e) {
          message.error('复制失败');
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
  { title: () => renderHeaderTitle('工单号'), key: 'WorkOrderNo', width: 150,  render: (row: Faults) => {
      // const full = row.order_no || '';
      const full = (row as any).WorkOrderNo || '';
      const prefix = full.slice(0, 6);
      const suffix = full.slice(-7);
      const truncated = full.length > 14 ? `${prefix}...${suffix}` : full;
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
          message.success('工单编号已复制');
        } catch (e) {
          message.error('复制失败');
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
  { title: () => renderHeaderTitle('维修站点'), key: 'RepairStationName', width: 180,
    render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.RepairStationName || '-')
    // ⚠️ 如果需要显示名称，就在 fetchData 里转换
  },
  { title: () => renderHeaderTitle('机型'), key: 'MachineModel', width: 200, render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.MachineModel || '-') },
  { title: () => renderHeaderTitle('损坏部件'), key: 'RepairComponent', width: 120, render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.RepairComponent || '-') },
  // { title: '额外操作', key: 'extra_operations', width: 120 },
  { title: () => renderHeaderTitle('初测不良原因'), key: 'DefectReason', width: 120, render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.DefectReason || '-') },
  { title: () => renderHeaderTitle('查证缺陷'), key: 'VerifyDefect', width: 120, render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.VerifyDefect || '-') },
  { title: () => renderHeaderTitle('维修状态'), key: 'RepairResult',
    render: (row) => {
      const label = repairResultMap[row.RepairResult] || '未知'
       const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已修复': 'success',
        '报废': 'error',
        '未修复': 'error',
        '待修复': 'warning',
      };
      const type = tagMap[label] || 'default';
      return h(NTag, { type,class:'text-sm', size: 'small',round:true }, () => label)
    }
  },
  { 
    title: () => renderHeaderTitle('日期'), 
    key: 'Date', 
    width: 160,
    align: 'center',
    render: (row: any) => h('span', { class: 'cell-date text-sm text-gray-500' }, formatDateTime(row?.Date))
  },
  {
    title: () => renderHeaderTitle('操作'),
    key: 'actions',
    align: 'center',
    fixed: 'right',
    width: 180,
    render: (row) => {
      // console.log("表格行数据:", row);
      const rowId = row.id || row.ID || row.Id || row.workOrderNo || row.WorkOrderNo;
      // console.log("提取的ID:", rowId); 
      return [
        h(
          NButton,
          { 
            type: 'primary', 
            size: 'small', 
            ghost: true, 
            style: 'margin-right: 8px;',
            class:'text-sm',
            onClick: () => goDetail(rowId) 
          },
          { default: () => '详情' }
        ),
        row.RepairResult === 4
          ? h(
              NButton,
              {
                type: 'error',
                size: 'small',
                ghost: true,
                style: 'margin-right: 8px;',
                class: 'text-sm',
                onClick: () => openScrapModal(row)
              },
              { default: () => '报废标记' }
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
  loading.value = true;
  tableData.value=[];
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    sn: sn.value || undefined,
    repair_result: repair_result.value || undefined,
    work_order_no: work_order_no.value || undefined,
  };

  // console.log("请求参数:", params);
  try {
    const {data,error} = await fetchRepairDetails(params);
    if(error==null){
        tableData.value = data.list;
        pagination.value.itemCount = data.pagination.total;
        pagination.value.page =  data.pagination.page;
        pagination.value.pageSize =  data.pagination.page_size;
    }else{
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  fetchData()
//   loadFaultsTypes();
});
watch([work_order_no,repair_result,sn], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
  
});

// const isRepairStation = computed(() => {
//   return JSON.parse(localStorage.getItem('userInfo')).role;
// });
const role = JSON.parse(localStorage.getItem('userInfo') ?? '{}')?.role;
const isRepairStation = role === 4;


// 下载模板
const downloadTemplate = () => {
  // 创建一个临时链接来下载模板文件
  const link = document.createElement('a');
  link.href = '/template/repair-detail-V002.xlsx'; // 模板文件路径
  link.download = '维修明细导入模板.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success('模板下载已开始');
};
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
        message.error(`导出失败: ${error}`);
    }
  } catch (err) {
    message.error(`导出失败: ${err}`);
  } finally {
    loading.value = false;
  }

  // 获取所有待导出数据
 
};
const exportExcel=async () => {

// 处理导出成功逻辑
 const headers = [
   '日期',
   '工单编号',
   '机型',
   '整机 SN',
   '电源 SN',
   '板1 SN',
   '板2 SN',
   '板3 SN',
   '控制板 SN',
   '维修部件',
   '额外操作',
   '初测不良原因',
   '不良代码L2',
   '不良代码L3',
   '位号信息',
   '查证缺陷',
   '开始维修时间',
   '结束维修时间',
   '维修结果',
   '下架时间',
   '上架时间',
   '创建时间',
   '更新时间',
   '维修员',
   '维修站点'
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
  message.success('导出成功，下载已开始');
}
const handleFail = () => {
  message.error('导入失败，请检查文件格式');
}

</script>

<template>
  <div class="flex  gap-16px flex-col-stretch  lt-sm:overflow-auto">
    <NCard>
      <RepairSearchBar
              :work-order-no="work_order_no"
              :sn="sn"
              :repair-result="repair_result"
              @update:work-order-no="work_order_no = $event"
              @update:sn="sn = $event"
              @update:repair-result="repair_result = $event"
            />
    </NCard>
    <!-- <NCard> -->
    <!-- 查询框 -->
    <n-card size="small" class=" card-wrapper  flex flex-col gap-16px h-[calc(100vh-200px)]">
       <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 6px">
      <div  style="display: flex; gap: 8px; align-items: center;">
        <UploadRepairDetailsExcel v-if="isRepairStation" @success="fetchData" @fail="handleFail"/>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <NButton circle size="medium" ghost @click="exportCsv" title="导出 CSV"  style="margin-right: 80px;">
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
        :scroll-x="1600"
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
