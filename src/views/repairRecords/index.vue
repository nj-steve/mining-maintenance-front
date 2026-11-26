<script setup lang="ts">
import { computed, onMounted, ref, watch, h } from 'vue';
import { refDebounced, useMediaQuery } from '@vueuse/core';
import { NDataTable, useMessage, NButton, NTooltip, NTag, NDropdown, useThemeVars } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchRepairDetails, exportRepairDetails } from '@/service/api/repair';
import { fetchOrdersSite } from '@/service/api/site';
import CopyIcon from '~icons/ant-design/copy-outlined';
import DownloadIcon from '~icons/ant-design/download-outlined';
import RefreshIcon from '~icons/ant-design/reload-outlined';
import RepairIcon from '~icons/ant-design/tool-outlined';
import UploadIcon from '~icons/ant-design/upload-outlined';

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
const exporting = ref(false);
const narrowLayout = useMediaQuery('(max-width: 760px)');
const theme = useThemeVars();
const themeStyle = computed(() => ({
  '--repair-surface': theme.value.cardColor,
  '--repair-line': theme.value.dividerColor,
  '--repair-ink': theme.value.textColor1,
  '--repair-muted': theme.value.textColor2,
  '--repair-accent': theme.value.primaryColor,
  '--repair-success': theme.value.successColor,
  '--repair-on-success': theme.value.baseColor
}));
const work_order_no = ref<string>('');
const sn = ref<string>('');
const macAddress = ref('');
const macAddressFilter = refDebounced(macAddress, 250);
const verifiedOnly = ref(false);
const site_id = ref<number | undefined>(undefined);
const repair_type = ref<string>();
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

const renderHeaderTitle = (text: string) => h('span', { class: 'repair-column-title' }, text);

const baseColumns: DataTableColumns<any> = [
   { title: () => renderHeaderTitle(t('page.repairRecords.snCode')), key: 'DeviceSN',
   width: 150, render: (row) => {
      const full = (row as any).DeviceSN || '';
      const prefix = full.slice(0, 5);
      const suffix = full.slice(-5);
      const truncated = full.length > (narrowLayout.value ? 11 : 14) ? `${prefix}…${suffix}` : full;
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
              class: 'repair-identifier'
            },
            [
              h(
                'span',
                {
                  class: 'repair-sn'
                },
                truncated
              ),
              h(
                NButton,
                { size: 'tiny', quaternary: true, type: 'primary', class: 'repair-copy', onClick: onCopy },
                { default: () => h(CopyIcon) }
              )
            ]
          ),
          default: () => full
        }
      );
    } },
  {
    title: () => renderHeaderTitle(t('page.repairRecords.macAddress')),
    key: 'MacAddress',
    width: 232,
    render: (row: any) => {
      if (!row.MacAddress) return h('span', { class: 'repair-no-mac' }, '—');

      const verifiedLabel = t('page.repairRecords.macAddressVerified');
      return h('div', { class: 'repair-mac' }, [
        h('span', { class: 'repair-mac__address' }, row.MacAddress),
        row.mac_address_verified
          ? h(NTooltip, { placement: 'top' }, {
              trigger: () => h('span', {
                class: 'repair-mac__verified',
                role: 'img',
                'aria-label': verifiedLabel
              }, [
                h('span', { class: 'repair-mac__check', 'aria-hidden': 'true' }, '✓'),
                h('span', { class: 'repair-mac__label' }, t('page.repairRecords.macVerifiedBadge'))
              ]),
              default: () => verifiedLabel
            })
          : null
      ]);
    }
  },
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
{
  title: () => renderHeaderTitle(t('page.repairRecords.site')),
  key: 'site_name',
  width: 180,
  render: (row: any) => {
    const text = row.site_name || '-';
    return h(
      NTooltip,
      { placement: 'top' },
      {
        trigger: () => h(
          'div',
          {
            class: 'text-sm text-gray-500',
            style: 'max-width:180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
          },
          text
        ),
        default: () => text
      }
    );
  }
},
  //  { title: () => renderHeaderTitle(t('page.repairRecords.site')), key: 'site_name', width: 180,
  //   render: (row) => h('span', { class: 'text-sm text-gray-500' }, row.site_name || '-')
  //  },
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
              class: 'repair-identifier'
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
                { size: 'tiny', quaternary: true, type: 'primary', class: 'repair-copy', onClick: onCopy },
                { default: () => h(CopyIcon) }
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
      const label = repairResultMap[row.RepairResult] || t('page.repairRecords.unknown');
      const tagMap: Record<number, 'success' | 'warning' | 'error'> = {
        1: 'warning',
        2: 'error',
        3: 'success',
        4: 'error'
      };
      const type = tagMap[row.RepairResult] || 'default';
      return h(NTag, { type, class: 'text-xs', size: 'small', round: true, bordered: false }, () => label);
    }
  },
  {
    title: () => renderHeaderTitle(t('page.repairRecords.date')),
    key: 'Date',
    width: 160,
    align: 'center',
    render: (row: any) => h('span', { class: 'repair-date' }, formatDateTime(row?.Date))
  },
  {
    title: () => renderHeaderTitle(t('page.repairRecords.action')),
    key: 'actions',
    align: 'center',
    fixed: 'right',
    width: isRead ? 92 : 170,
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
            quaternary: true,
            class: 'repair-action',
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
            quaternary: true,
            class: 'repair-action',
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
                quaternary: true,
                class: 'repair-action',
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
];
const columns = computed(() => {
  if (!narrowLayout.value) return baseColumns;

  return baseColumns.map(column => {
    if (!('key' in column)) return column;
    if (column.key === 'DeviceSN') return { ...column, width: 126 };
    if (column.key === 'MacAddress') return { ...column, width: 174 };
    if (column.key === 'actions') return { ...column, fixed: undefined };
    return column;
  });
});
const tableWidth = computed(() => columns.value.reduce((width, column) => width + Number(column.width ?? 0), 0));

// ---------------- 数据获取 ----------------
let latestFetch = 0;
const fetchData = async () => {
  const fetchId = ++latestFetch;
  try {
    loading.value = true;
    const params: any = {
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      work_order_no: work_order_no.value,
      sn: sn.value,
      mac_address: macAddressFilter.value.trim(),
      mac_address_verified: verifiedOnly.value || undefined,
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
    if (fetchId !== latestFetch) return;
    if(error==null){
        tableData.value = data.list;
        pagination.value.itemCount = Number(data.pagination.total) || 0;
        pagination.value.page = Number(data.pagination.page) || 1;
        pagination.value.pageSize = Number(data.pagination.page_size) || 20;
    }else{
        message.error(t('page.repairRecords.loadFailed', { error }));
    }
  } catch (err) {
    if (fetchId === latestFetch) message.error(t('page.repairRecords.loadFailed', { error: String(err) }));
  } finally {
    if (fetchId === latestFetch) loading.value = false;
  }
};


onMounted(() => {
  fetchData();
  getSiteList();
});
watch([work_order_no, sn, macAddressFilter, verifiedOnly, repair_result, site_id, repair_type], () => {
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
  exporting.value = true;
  try {
    const params: any = {
      sn: sn.value || undefined,
      mac_address: macAddressFilter.value.trim() || undefined,
      mac_address_verified: verifiedOnly.value || undefined,
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
    exporting.value = false;
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
  <div class="repair-page" :style="themeStyle">
    <header class="repair-heading">
      <div class="repair-heading__title">
        <span class="repair-heading__icon" aria-hidden="true">
          <RepairIcon />
        </span>
        <h1>{{ t('page.repairRecords.title') }}</h1>
      </div>
      <div class="repair-heading__actions">
        <NDropdown v-if="isRepairStation" :options="importOptions" @select="handleImportSelect">
          <NButton size="small" type="primary" secondary>
            <template #icon>
              <UploadIcon />
            </template>
            {{ t('page.repairRecords.import') }}
          </NButton>
        </NDropdown>
        <NButton v-if="!isRead" size="small" :loading="exporting" @click="exportCsv">
          <template #icon><DownloadIcon /></template>
          {{ t('page.repairRecords.exportCsvTitle') }}
        </NButton>
        <NButton size="small" :loading="loading" @click="fetchData">
          <template #icon><RefreshIcon /></template>
          {{ t('common.refresh') }}
        </NButton>
      </div>
    </header>

    <RepairSearchBar
      :work-order-no="work_order_no"
      :sn="sn"
      :mac-address="macAddress"
      :verified-only="verifiedOnly"
      :repair-result="repair_result"
      :site-id="site_id"
      :repair-type="repair_type"
      :site-options="siteOptions"
      @update:work-order-no="work_order_no = $event"
      @update:sn="sn = $event"
      @update:mac-address="macAddress = $event"
      @update:verified-only="verifiedOnly = $event"
      @update:repair-result="repair_result = $event"
      @update:site-id="site_id = $event"
      @update:repair-type="repair_type = $event"
    />

    <section class="repair-table-panel" :aria-label="t('page.repairRecords.title')">
      <NDataTable
        flex-height
        remote
        size="small"
        :bordered="false"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :row-key="(row: any) => row.ID"
        :scroll-x="tableWidth"
        class="repair-table"
      />
    </section>

    <UploadRepairDetailsExcel ref="uploadRef" :show-trigger="false" @success="fetchData" @fail="handleFail" />
    <ScrapFlagsModal v-model:show="showScrapModal" :detail-id="currentDetailId" :detail-row="currentDetailRow" @success="fetchData" />
  </div>
</template>

<style scoped>
.repair-page {
  --repair-tint: color-mix(in srgb, var(--repair-accent) 5%, var(--repair-surface));
  --repair-verified-tint: color-mix(in srgb, var(--repair-success) 5%, var(--repair-surface));
  --repair-verified-fill: color-mix(in srgb, var(--repair-success) 13%, var(--repair-surface));
  --repair-verified-line: color-mix(in srgb, var(--repair-success) 27%, var(--repair-surface));

  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.repair-heading,
.repair-table-panel {
  border: 1px solid var(--repair-line);
  border-radius: 10px;
  background: var(--repair-surface);
}

.repair-heading {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(100deg, var(--repair-tint), var(--repair-surface) 70%);
}

.repair-heading__title,
.repair-heading__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.repair-heading__actions {
  flex-wrap: wrap;
}

.repair-heading h1 {
  margin: 0;
  color: var(--repair-ink);
  font-size: clamp(20px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.3;
}

.repair-heading__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--repair-accent);
  background: color-mix(in srgb, var(--repair-accent) 12%, var(--repair-surface));
  font-size: 18px;
}

.repair-table-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 330px;
  overflow: hidden;
}

.repair-table {
  flex: 1;
  min-height: 0;
}

.repair-table :deep(.n-data-table-th) {
  background: var(--repair-tint);
}

.repair-table :deep(.n-data-table__pagination) {
  flex-shrink: 0;
  margin: 0;
  padding: 9px 12px;
  border-top: 1px solid var(--repair-line);
}

.repair-table :deep(.n-pagination) {
  flex-wrap: wrap;
  gap: 6px;
}

.repair-table :deep(.repair-column-title) {
  color: var(--repair-muted);
  font-weight: 650;
  white-space: nowrap;
}

.repair-table :deep(.repair-sn),
.repair-table :deep(.repair-mac__address) {
  color: var(--repair-ink);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
}

.repair-table :deep(.repair-identifier) {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.repair-table :deep(.repair-copy) {
  flex: none;
  width: 22px;
  padding-inline: 0;
  font-size: 14px;
}

.repair-table :deep(.repair-sn) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.repair-table :deep(.repair-mac) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.repair-table :deep(.repair-mac__verified) {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  padding: 2px 6px 2px 3px;
  border: 1px solid var(--repair-verified-line);
  border-radius: 99px;
  background: var(--repair-verified-fill);
  color: var(--repair-ink);
  font-size: 11px;
  font-weight: 650;
  line-height: 1;
}

.repair-table :deep(.repair-mac__check) {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--repair-success);
  color: var(--repair-on-success);
  font-size: 12px;
  font-weight: 800;
}

.repair-table :deep(.repair-no-mac),
.repair-table :deep(.repair-date) {
  color: var(--repair-muted);
}

.repair-table :deep(.repair-date) {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.repair-table :deep(.repair-action) {
  font-size: 12px;
}

@media (max-width: 760px) {
  .repair-table-panel {
    flex: none;
    height: 520px;
  }

  .repair-table :deep(.repair-mac__verified) {
    padding: 2px;
  }

  .repair-table :deep(.repair-mac__label) {
    display: none;
  }
}
</style>
