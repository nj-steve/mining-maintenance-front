<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NDataTable, useMessage, NButton,NTag, NModal, NForm, NFormItem, NInput, NTooltip, NPopconfirm, NDropdown, NIcon } from 'naive-ui';
import BatchStatusModal from './components/BatchStatusModal.vue';
import UploadFileBathStatusModal from './components/UploadFileBathStatusModal.vue';
import UploadWorkOrderExcel from './components/UploadWorkOrderExcel.vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchFaults, exportFaults } from '@/service/api/faults';
import {fetchSites} from '@/service/api/site';

import {fetchOrdersStatus} from '@/service/api/workflow';
import { createOrder } from '@/service/api/workflow';
import UploadSiteMachineExcel from "@/components/upload/UploadSiteMachineExcel.vue"
import {fetchOrdersSite,deleteFaultsStatusById} from '@/service/api';
import FaultsSearchCard from './components/FaultsSearchCard.vue'
import BindWorkOrderModal from './components/BindWorkOrderModal.vue'
import UnbindWorkOrderModal from './components/UnbindWorkOrderModal.vue'
import { useAuthStore } from '@/store/modules/auth';

import EditFaultModalButton from './components/EditFaultModalButtonShouhou.vue'
import EditFaultModalButtonYunwei from './components/EditFaultModalButtonYunwei.vue'
import EditFaultModalButtonAdmin from './components/EditFaultModalButtonAdmin.vue'
import UploadBindWorkOrderExcel from './components/UploadBindWorkOrderExcel.vue'

import { Icon } from '@iconify/vue';

const authStore = useAuthStore();
const { t } = useI18n();
const hasRole=!authStore.userInfo.roles.includes('3')
const isAdmin=authStore.userInfo.roles.includes('1') // 超管
const isRead=authStore.userInfo.roles.includes('5') // 只读用户

// console.log("Outer >> hasRole>>",hasRole)
interface Faults {
  id: number;
  sn: string;
  date: string;
  serial_number: string;
  serial_number_source: string;
  Faults_type_id:number;
  status_value:number,
  contract_number: string;
  status_text?: string;
  repair_result?: number;
  repair_result_text?: string;
  repair_method?: number;
  repair_type?: string;
  repair_method_text?: string;
  warranty_status?: number;
  warranty_status_text?: string;
  description?: string;
  site_name?: string;
  site_id?:number;
  model?: string;
  order_id?: number;
  created_time?: string;
  on_shelf_time?: string;
  repair_count?: number;
  FaultsType?: {
    name?: string;
    hash_rate?: number;
    name_source?: string;
  };
  Site?: {
    id?: number;
    name?: string;
  };
  Status?: {
    name?: string;
  };
}

const message = useMessage();
const router = useRouter();

const tableData = ref<Faults[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');

const searchSiteId = ref<number | null>(null);
const searchStatus = ref<number | null>(null);
const searchStartDate = ref<number | null>(null);
const searchEndDate = ref<number | null>(null);
const searchModel = ref<number | null>(null);
const searchWorkOrderNo = ref<string>('');
const searchResultStatus = ref<number | null>(null);
const searchSalerId = ref<number | null>(null);
const searchRepairType = ref<number | null>(null);

const siteOptions = ref<{ label: string; value: number }[]>([]); // 场地列表
const statusOptionsData = ref<any[]>([]);
const statusOptions = computed(() => statusOptionsData.value.map(item => ({
  label: getTranslatedStatus(String(item.id)),
  value: item.id,
})));
const statusUpdateOptionsData = ref<any[]>([]);
const statusUpdateOptions = computed(() => statusUpdateOptionsData.value.map(item => ({
  label: getTranslatedStatus(item.name),
  value: item.id,
})));
const repairTypeOptions = computed(() => [
  { label: t('business.repairType.wholeMachine'), value: '整机' },// 1整机
  { label: t('business.repairType.hashBoard'), value: '算力板' },// 2算力板
])

// 批量选择相关
const selectedRowKeys = ref<number[]>([]);
const selectedRows = ref<Faults[]>([]);

// 工单相关
const showWorkOrderModal = ref(false);
const showImportWorkOrderModal = ref(false);
const showImportBindWorkOrderModal = ref(false);
const workOrderForm = ref({
  workOrderNo: '',
  workOrderDate: new Date().toISOString().split('T')[0],
  site: '',
  faultMachineCount: 0,
  selectedMachines: [] as Faults[],
  site_id:0,
});

const bindWorkOrderRef = ref();

const bindWorkOrderOptions = computed(() => [
  {
    label: t('page.faults.batchBind'),
    key: 'batch',
    icon: () => h(Icon, { icon: 'ant-design:plus-outlined' })
  },
  {
    label: t('page.faults.importBind'),
    key: 'import',
    icon: () => h(Icon, { icon: 'ant-design:upload-outlined' })
  }
]);

const handleBindWorkOrderSelect = (key: string) => {
  if (key === 'batch') {
    bindWorkOrderRef.value?.handleOpenModal();
  } else if (key === 'import') {
    showImportBindWorkOrderModal.value = true;
  }
};

const uploadRef = ref<any>(null)

const importOptions = computed(() => [
  { label: t('page.faults.machineImport'), key: 'machine' },
  { label: t('page.faults.hashBoardImport'), key: 'hash_board' }
]);

const handleImportSelect = (key: string) => {
  // console.log(key)
  if (key === 'machine') {
    uploadRef.value?.open({
       uploadUrl: '/api/faults/import',
       templateUrl: '/template/site_machine_template.xlsx',
       templateName: t('page.faults.machineImportTemplate'),
       title: t('page.faults.import') + ' Excel'
    })
  } else if (key === 'hash_board') {
    uploadRef.value?.open({
       uploadUrl: '/api/faults/hash_board/import',
       templateUrl: '/template/site_board_template.xlsx',
       templateName: t('page.faults.hashBoardImportTemplate'),
       title: t('page.faults.hashBoardImport')
    })
  }
}

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  // 重新查询前清空之前的选择状态
  selectedRowKeys.value = [];
  tableData.value = []
  selectedRows.value = [];
  loading.value = true;

  let onlyMySite = localStorage.getItem('onlyMySite') === 'true' ? -1 : 1
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    sn: searchSerial.value || undefined,
    order_no: searchWorkOrderNo.value || undefined,
    site_id: searchSiteId.value || undefined,
    status: searchStatus.value || undefined,
    saler_id: searchSalerId.value || undefined,
    enable_all: onlyMySite,//1 全部，-1 我的
    repair_result: searchResultStatus.value || undefined,
    repair_type: searchRepairType.value || undefined,
    start_date: searchStartDate.value ? new Date(searchStartDate.value).toISOString().split('T')[0] : undefined,
    end_date: searchEndDate.value ? new Date(searchEndDate.value).toISOString().split('T')[0] : undefined,
    model: searchModel.value || undefined
  };

  try {
    const {data,error} = await fetchFaults(params);

    if(error==null && data){
        tableData.value = data.list;
        pagination.value.itemCount = data.pagination.total;
        pagination.value.page =  data.pagination.page;
        pagination.value.pageSize =  data.pagination.page_size;
    }else{
        message.error(`${t('page.faults.loadFailed')}: ${error}`);
    }
  } catch (error) {
    message.error(t('page.faults.loadFailed'));
    console.error('加载失败:', error);
  } finally {
    loading.value = false
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
    return t('page.faults.totalItems', { count: itemCount })
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
// 已封装到组件 EditFaultModalButton 内，无需在此维护本地编辑状态
// 批量修改状态弹框相关

// ---------------- 数据获取 ----------------
const fetchOrderStatusData = async (operate_type:"list"|"update") => {
  loading.value = true;
  const params: any = {
   type:1,//故障机状态
   operate_type:operate_type,
  };

  try {
    const {data,error} = await fetchOrdersStatus(params);
    if(error==null && data){
      if(operate_type==='list'){
        statusOptionsData.value = data;
      }
      if(operate_type==='update'){
        statusUpdateOptionsData.value = data;
      }
    }else{
        message.error(`${t('page.faults.loadFailed')}: ${error}`);
    }
  } catch (err) {
    message.error(`${t('page.faults.loadFailed')}${err}`);
  } finally {
    loading.value = false;
  }
};

// 获取场地数据
const fetchSiteData = async () => {
  // console.log("hasRole>>fetchSiteData >> ",hasRole)
  // if(!hasRole){
  //   return
  // }
  try {
    // 这里需要根据实际的API接口来获取场地数据
    const params: any = {
      enable_all: (hasRole===true && !(localStorage.getItem("onlyMySite")==='true'))?1:-1,
    };
    if(!hasRole){
       const { data, error } = await fetchSites({page:1,page_size:100});
        if (!error && data) {
          siteOptions.value = data.list.map((site: any) => ({
            label: site.name,
            value: site.id,
          }));
        }
    }else{
      const { data, error } = await fetchOrdersSite(params);
        if (!error && data) {
          siteOptions.value = data.map((site: any) => ({
            label: site.Name,
            value: site.ID,
          }));
        }
    }
    // console.log("params",params)
    // const { data, error } = hasRole?await fetchOrdersSite(params):{data:[],error:null};


  } catch (err) {
    message.error(t('page.faults.loadFailed'));
  }
};

const getTranslatedStatus = (name: string) => {
  const map: Record<string, string> = {
    // Flow Status (Numeric IDs and Text)
    '8': t('page.faults.onShelf'),
    '已上架': t('page.faults.onShelf'),
    '10': t('page.faults.inStock'),
    '已入库': t('page.faults.inStock'),
    '9': t('page.faults.waitStock'),
    '待入库': t('page.faults.waitStock'),
    '3': t('page.faults.logisticsOut'),
    '物流发': t('page.faults.logisticsOut'),
    '6': t('page.faults.logisticsIn'),
    '物流进': t('page.faults.logisticsIn'),
    '物流收': t('page.faults.logisticsIn'),
    '4': t('page.faults.repairing'),
    '维修中': t('page.faults.repairing'),
    '5': t('page.faults.repairCompleted'),
    '维修完成': t('page.faults.repairCompleted'),
    '7': t('page.faults.waitShelf'),
    '待上架': t('page.faults.waitShelf'),
    '2': t('page.faults.pending'),
    '待处理': t('page.faults.pending'),
    '1': t('page.faults.newOffShelf'),
    '新下架': t('page.faults.newOffShelf'),

    // Repair Status
    '已修复': t('page.faults.repaired'),
    '报废': t('page.faults.scrapped'),
    '未修好': t('page.faults.unrepaired'),
    '待修复': t('business.repairResult.pending'),
    '待维修': t('page.faults.waitRepair'),

    // Warranty Status
    '短保中': t('business.warrantyStatus.inWarranty'),
    '过保': t('business.warrantyStatus.outOfWarranty'),
    '无': t('business.warrantyStatus.noWarranty'),
    '已过期': t('business.warrantyStatus.expired'),

  };
  return map[name] || name;
};

// ---------------- 表格列 ----------------
const renderHeaderTitle = (text: string) => h('span', { class: 'text-xs font-medium text-gray-500' }, text)
const columns: DataTableColumns<Faults> = [
  {
    type: 'selection',
    multiple: true,
    width: 60
  },
  // { title: '序号', key: 'id', width: 80 },
  { title: () => renderHeaderTitle(t('page.faults.snCode')), key: 'sn', width: 180,
    render: (row: Faults) => {
      const sn = row.sn || t('page.faults.unknown');
      return h(NTooltip, null, {
        trigger: () => h('div', { style: 'display:flex; align-items:center; gap:8px; max-width:180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }, [
          h('span', { class: 'text-sm text-gray-500', style: 'flex:1; min-width:0;' }, sn),
        ]),
        default: () => sn
      });
    }
  },
  { title: () => renderHeaderTitle(t('page.faults.type')), key: 'repair_type', width: 100,
    render: (row: Faults) => {
      const type = row.repair_type;
      let tagType: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'default' = 'default';
      let label = type || t('page.faults.unknown');

      // 兼容可能返回的数字或文本
      if (type === '整机' || type === "1") {
        tagType = 'info';
        label = t('page.faults.machine');
      } else if (type === '算力板' || type === "2") {
        tagType = 'warning';
        label = t('page.faults.hashBoard');
      }

      return h(NTag, { class: 'text-sm', type: tagType, size: 'small', round: true, bordered: false }, () => label);
    }
  },
  { title: () => renderHeaderTitle(t('page.faults.site')), key: 'site_name', width: 150,
    render: (row: Faults) => {
       const siteName = row.site_name || t('page.faults.unknown');
       const siteId = row.site_id || 0;

       if (siteId) {
         return h(
           NTooltip,
           null,
           {
             trigger: () => h(
               'div',
               { style: 'max-width:150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' },
               [
                 h(
                   NButton,
                   {
                     text: true,
                     type: 'primary',
                     onClick: () => {
                       router.push(`/miningsite/${siteId}/info`);
                     }
                   },
                   { default: () => h('span', { class: 'text-sm text-gray-500', style: 'display:inline-block; max-width:150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }, siteName) }
                 )
               ]
             ),
             default: () => siteName
           }
         );
       }

       return h(
         NTooltip,
         null,
         {
           trigger: () => h('div', { class: 'text-sm text-gray-500', style: 'max-width:150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }, siteName),
           default: () => siteName
         }
       );
     }
  },
  { title: () => renderHeaderTitle(t('page.faults.model')), key: 'model', width: 120, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, row.model || t('page.faults.unknown')) },
  {
    title: () => renderHeaderTitle(t('page.faults.orderNo')),
    key: 'order_no',
    width: 170,
     render: (row: Faults) => {
      // const full = row.order_no || '';
      const full = (row as any).order_no || '';
      const prefix = full.slice(0, 6);
      const suffix = full.slice(-7);
      const truncated = full.length > 14 ? `${prefix}...${suffix}` : full;
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(full);
          message.success(t('page.faults.orderNoCopied'));
        } catch (e) {
          message.error(t('page.faults.copyFailed'));
        }
      };
      return  hasRole? h(
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
                  class: 'text-sm text-gray-500', style: 'flex:1; min-width:0; cursor: pointer;',
                  onClick: () => router.push({ name: 'workflowdetail', params: { id: row.order_id } })
                },
                truncated
              ),
              full!=="" ? h(
                NButton,
                { size: 'tiny', quaternary: true, type: 'primary', onClick: onCopy },
                { default: () => h(Icon, { icon: 'ant-design:copy-outlined', width: 16, height: 16 }) }
              ) : null,

            ]
          ),
          default: () => full
        }
      ) : h(
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
                  class: 'text-sm text-gray-500', style: 'flex:1; min-width:0; cursor: pointer;',
                  // onClick: () => router.push({ name: 'workflowdetail', params: { id: row.order_id } })
                },
                truncated
              ),
              full!=="" ? h(
                NButton,
                { size: 'tiny', quaternary: true, type: 'primary', onClick: onCopy },
                { default: () => h(Icon, { icon: 'ant-design:copy-outlined', width: 16, height: 16 }) }
              ) : null
            ]
          ),
          default: () => full
        }
      );
    }
    // render: (row: Faults) => {
    //   const text = (row as any).order_no || '';
    //   return hasRole
    //       ? h(
    //     NTooltip,
    //     null,
    //     {
    //       trigger: () => h('div',
    //        { style: 'max-width:150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' ,
    //         onClick: () => router.push({ name: 'workflowdetail', params: { id: row.order_id } })
    //        },
    //        text),
    //       default: () => text
    //     }
    //   )
    //   : text;
    // }
  },
  { title: () => renderHeaderTitle(t('page.faults.repairMethod')), key: 'repair_method_text', width: 100,
     render: (row: any ) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        1: 'success',
        2: 'primary',
        3: 'primary',
      };

      const getRepairMethodLabel = (method: number | string) => {
        const map: Record<string, string> = {
          '1': t('business.repairMethod.onsite'),
          '2': t('business.repairMethod.sendRepair'),
          '3': t('business.repairMethod.exchange'),
        };
        return map[String(method)] || t('page.faults.unknown');
      };

      const methodVal = row.repair_method;
      return h(NTag, { class: 'text-sm', type: tagMap[String(methodVal)] || 'default', size:'small', round:true }, () => methodVal ? getRepairMethodLabel(methodVal) : t('page.faults.unknown'))
    }
  },
  { title: () => renderHeaderTitle(t('page.faults.flowStatus')), key: 'status_text', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        [t('page.faults.onShelf')]: 'success',
        [t('page.faults.inStock')]: 'success',
        [t('page.faults.waitStock')]: 'warning',
        [t('page.faults.logisticsOut')]: 'primary',
        [t('page.faults.pending')]: 'primary',
        [t('page.faults.logisticsIn')]: 'primary',
        [t('page.faults.repairing')]: 'info',
        [t('page.faults.repairCompleted')]: 'success',
        [t('page.faults.waitShelf')]: 'warning',
        [t('page.faults.newOffShelf')]: 'warning',
      };
      const label = row.status_value != null ? getTranslatedStatus(String(row.status_value)) : (row.status_text ? getTranslatedStatus(row.status_text) : t('page.faults.unknown'));
      return h(NTag, { class: 'text-sm', type: tagMap[label] || 'default', size:'small', round:true }, () => label)
    }
  },
  { title: () => renderHeaderTitle(t('page.faults.repairStatus')), key: 'repair_result_text', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        [t('page.faults.repaired')]: 'success',
        [t('page.faults.scrapped')]: 'error',
        [t('page.faults.unrepaired')]: 'error',
        [t('page.faults.waitRepair')]: 'warning',
      };
      const label = row.repair_result_text ? getTranslatedStatus(row.repair_result_text) : t('page.faults.unknown');
      return h(NTag, { class: 'text-sm', type: tagMap[label] || 'default', size:'small', round:true }, () => label)
    }
  },
  { title: () => renderHeaderTitle(t('page.faults.repairCount')), key: 'repair_count', width: 100, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, String(row.repair_count ?? '0')) },
  { title: () => renderHeaderTitle(t('page.faults.warranty')), key: 'warranty_status', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        [t('page.faults.inWarranty')]: 'success',
        [t('page.faults.outOfWarranty')]: 'error',
      };
      const label = row.warranty_status_text ? getTranslatedStatus(row.warranty_status_text) : t('page.faults.none');
      return h(NTag, { class: 'text-sm', type: tagMap[label] || 'default', size:'small', round:true}, () => label)
    }
  },
  { title: () => renderHeaderTitle(t('page.faults.problemDescription')), key: 'description', width: 200, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, row.description || '-') },
  { title: () => renderHeaderTitle(t('page.faults.offShelfDate')), key: 'date', width: 120, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, row.date || '-') },
  { title: () => renderHeaderTitle(t('page.faults.importTime')), key: 'created_time', width: 160,
    render: (row: Faults) => {
      const s = row.created_time;
      if (!s) return '';
      const d = new Date(s);
      if (isNaN(d.getTime())) return String(s);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return h('span', { class: 'text-sm text-gray-500' }, `${y}-${m}-${da} ${hh}:${mm}:${ss}`)
    }
   },
  { title: () => renderHeaderTitle(t('page.faults.onShelfOrInStockTime')), key: 'on_shelf_time', width: 160,
    render: (row: Faults) => {
      const s = row.on_shelf_time;
      if (!s) return '';
      const d = new Date(s);
      if (isNaN(d.getTime())) return String(s);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return h('span', { class: 'text-sm text-gray-500' }, `${y}-${m}-${da} ${hh}:${mm}:${ss}`)
    }
   },
  {
    title: () => renderHeaderTitle(t('page.faults.operation')),
    key: 'actions',
    align:'center',
    width: 120,
    fixed: 'right',
    render: (row: Faults) => {
      if(isRead){
        return []
      }
      if(isAdmin){
        return [
          h(
              EditFaultModalButtonAdmin,
              {
                row,
                sites: siteOptions.value,
                statusOptions:  statusOptions.value,
                onUpdated: () => fetchData()
              }
            ),
             h(
                NPopconfirm,
                {
                  onPositiveClick: async () => {
                    try {
                      const { error } = await deleteFaultsStatusById(row.id);
                      if (error == null) {
                        message.success(t('page.faults.deleteSuccess'));
                        await fetchData();
                      } else {
                        message.error(t('page.faults.deleteFailed'));
                      }
                    } catch (e) {
                      message.error(t('page.faults.deleteFailed'));
                    }
                  }
                },
                {
                  trigger: () => h(
                    NButton,
                    { size: 'tiny', quaternary: true, type: 'error' },
                    { default: () => h(Icon, { icon: 'ant-design:delete-outlined', width: 16, height: 16 }) }
                  ),
                  default: () => t('page.faults.confirmDelete')
                }
              )
          ]
      }
      return [
         hasRole
          ? h(
              EditFaultModalButton,
              {
                row,
                sites: siteOptions.value,
                statusOptions: hasRole ? statusOptions.value : statusUpdateOptions.value,
                onUpdated: () => fetchData()
              }
            )
          : h(
              EditFaultModalButtonYunwei,
              {
                row,
                onUpdated: () => fetchData()
              }
            )
      ]
    }
  }
];

onMounted(() => {
  fetchData()
  fetchOrderStatusData('list');
  fetchOrderStatusData('update');
  // if(hasRole){
    // console.log("hasRole>>onMounted",hasRole)
    fetchSiteData();
  // }

  // fetchSiteData();
});

watch([searchSerial,searchWorkOrderNo, searchSalerId, searchResultStatus, searchSiteId, searchStatus, searchStartDate, searchEndDate, searchModel, searchRepairType], () => {
  tableData.value = [];
  selectedRowKeys.value = [];
  selectedRows.value = [];
  pagination.value.page = 1;
  fetchData();
});

// 批量选择处理
const handleSelectionChange = (keys: (string | number)[], rows: any[]) => {
  selectedRowKeys.value = keys.map(key => Number(key));
  selectedRows.value = rows as Faults[];
  // console.log('选中的记录:', keys, rows);
};

// 创建工单
const handleCreateWorkOrderSelect = (key: string) => {
  if (key === 'batch') {
    handleCreateWorkOrder();
  } else if (key === 'import') {
    showImportWorkOrderModal.value = true;
  }
};

const createWorkOrderOptions = computed(() => [
  {
    label: t('page.faults.batchCreate', { count: selectedRows.value.length }),
    key: 'batch',
    disabled: selectedRows.value.length === 0
  },
  {
    label: t('page.faults.importCreate'),
    key: 'import'
  }
]);

// 创建工单
const handleCreateWorkOrder = () => {
  if (selectedRows.value.length === 0) {
    message.warning(t('page.faults.pleaseSelectDeviceToCreateOrder'));
    return;
  }
  // 统计选中机器所属的唯一场地名数量（去重）
  const uniqueSiteNames = Array.from(
    new Set(
      selectedRows.value
        .map(row => row.Site?.name || row.site_name)
        .filter(Boolean)
    )
  );
  if (uniqueSiteNames.length > 1) {
    message.warning(t('page.faults.onlySelectOneSite'));
    return;
  }
  // console.log('选中的场地:', uniqueSiteNames[0]);

  // 只选择状态为"新下架"的机器
  const downCheckMachines = selectedRows.value.filter(row =>
     row.status_text === t('page.faults.newOffShelf') || row.status_text === '新下架' || String(row.status_value) === '1'
  );
  // 只选择状态为"新下架"的机器
  const failureCheckMachines = selectedRows.value.filter(row =>
    row.status_text !== t('page.faults.newOffShelf') && row.status_text !== '新下架' && String(row.status_value) !== '1'
  );
   if (failureCheckMachines.length > 0 || downCheckMachines.length === 0) {
    message.warning(t('page.faults.onlySelectNewOffShelf'));
    return;
  }


  // 生成工单编号
  const workOrderNo = `${uniqueSiteNames[0]}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  // 获取场地信息（取第一个选中机器的场地）
  const site = downCheckMachines[0]?.Site?.name || downCheckMachines[0]?.site_name || '';

  workOrderForm.value = {
    workOrderNo,
    workOrderDate: new Date().toISOString().split('T')[0],
    site,
    site_id:downCheckMachines[0].site_id||0,
    faultMachineCount: downCheckMachines.length,
    selectedMachines: downCheckMachines
  };

  showWorkOrderModal.value = true;
};

// 确认创建工单
const handleConfirmWorkOrder = async () => {
  try {
    // 准备提交数据
    const submitData = {
      date: workOrderForm.value.workOrderDate,
      fault_ids: workOrderForm.value.selectedMachines.map(machine => machine.id),
      order_no: workOrderForm.value.workOrderNo,
      site_id:workOrderForm.value.site_id,
      // site_id: workOrderForm.value.selectedMachines[0]?.Site?.id || 0 // 假设第一个机器的场地ID
    };

    // 调用创建工单API
    const { error, response: { data } } = await createOrder(submitData);
    // console.log('创建工单响应:', data, error);
    // console.log('data.code', data?.code);

    if (error == null) {
      if (Number(data?.code) == 0) {
        message.success(t('page.faults.createOrderSuccess'));
        showWorkOrderModal.value = false;
        // 清空选择
        selectedRowKeys.value = [];
        selectedRows.value = [];

        // 刷新数据
        fetchData();
      }
    }
  } catch (error) {
    console.error(t('page.faults.createOrderFailed') + ':', error);
  }
};

// 取消创建工单
const handleCancelWorkOrder = () => {
  showWorkOrderModal.value = false;
};

// 处理刷新数据
const handleRefresh = () => {
  // 清空选中状态
  selectedRowKeys.value = [];
  selectedRows.value = [];
  // 刷新数据
  fetchData();
};
const onlyMySite = ref<boolean>(localStorage.getItem('onlyMySite') === 'true');
// watch(onlyMySite, v => localStorage.setItem('onlyMySite', v.toString()));
const onOnlyMySiteChange = (v: boolean) => {
  onlyMySite.value = v;
  localStorage.setItem('onlyMySite', v.toString());
  // 切换开关时清空旧选择并重置到第一页
  selectedRowKeys.value = [];
  selectedRows.value = [];
  tableData.value = [];
  pagination.value.page = 1;
  // 切换“我的场地”后立即刷新数据
  fetchData();
};

// 通过 /api/faults/export 获取数据，按指定字段生成 CSV（Excel 可打开）
const exportFaultsFile = async () => {
  loading.value = true;
  try {
    const onlyMySite = localStorage.getItem('onlyMySite') === 'true' ? -1 : 1;
    const params: Record<string, any> = {
      sn: searchSerial.value || undefined,
      order_no: searchWorkOrderNo.value || undefined,
      site_id: searchSiteId.value || undefined,
      status: searchStatus.value || undefined,
      saler_id: searchSalerId.value || undefined,
      enable_all: onlyMySite,
      repair_result: searchResultStatus.value || undefined,
      start_date: searchStartDate.value ? new Date(searchStartDate.value).toISOString().split('T')[0] : undefined,
      end_date: searchEndDate.value ? new Date(searchEndDate.value).toISOString().split('T')[0] : undefined,
      model: searchModel.value || undefined
    };

    const { data, error } = await exportFaults(params);
    if (error != null) {
      message.error(`${t('page.faults.exportFailed')}${error}`);
      return;
    }

    const headers = [
      t('page.faults.snCode'),
      t('page.faults.siteName'),
      t('page.faults.machineModel'),
      t('page.faults.location'),
      t('page.faults.faultReason'),
      t('page.faults.offShelfTime'),
      t('page.faults.onShelfTime'),
      t('page.faults.warrantyStatus'),
      t('page.faults.orderNo'),
      t('page.faults.creator'),
      t('page.faults.remark'),
      t('page.faults.importTime'),
      t('page.faults.updateTime'),
      t('page.faults.flowStatus'),
      t('page.faults.repairResult'),
      t('page.faults.repairCount')
    ];

    const formatCell = (val: any) => {
      const s = val === undefined || val === null ? '' : String(val);
      const needsQuote = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuote ? `"${escaped}"` : escaped;
    };

    const formatDateTime = (val: any) => {
      if (!val) return '';
      const d = new Date(typeof val === 'number' ? val : String(val));
      if (isNaN(d.getTime())) return String(val);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${da} ${hh}:${mm}:${ss}`;
    };

    const rows = (data || []).map((row: any) => [
      row.SN,
      row.SiteName,
      row.Model,
      row.Location,
      row.Description,
      row.DownTime,
      formatDateTime(row.OnShelfTime),
      row.warranty_status_text,
      row.OrderNo,
      row.CreatedBy,
      row.remarks,
      formatDateTime(row.created_at),
      formatDateTime(row.UpdatedAt),
      row.status_text,
      row.repair_result_text,
      row.repair_count
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(formatCell).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${t('page.faults.title')}_export_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(t('page.faults.exportSuccess'));
  } catch (err) {
    message.error(`${t('page.faults.exportFailed')}${err}`);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex  gap-16px flex-col-stretch  lt-sm:overflow-auto">
    <FaultsSearchCard
      v-model:serial="searchSerial"
      v-model:workOrderNo="searchWorkOrderNo"
      v-model:siteId="searchSiteId"
      v-model:startDate="searchStartDate"
      v-model:endDate="searchEndDate"
      v-model:status="searchStatus"
      v-model:resultStatus="searchResultStatus"
      v-model:salerId="searchSalerId"
      v-model:repairType="searchRepairType"
      :site-options="siteOptions"
      :status-options="statusOptions"
      :repair-type-options="repairTypeOptions"
      :hasRole="hasRole"
      @search="fetchData"
    />
    <!-- 查询框 -->
  <n-card size="small" class=" card-wrapper  flex flex-col gap-16px h-[calc(100vh-250px)]" style="padding-bottom: 50px;">
    <div v-if="!isRead" class="mb-4 flex items-center gap-2 text-sm" style="display: flex; justify-content: flex-end; margin-bottom: 16px">
      <div class="text-sm" style="display: flex; align-items: center; gap: 12px;">
        <n-dropdown :options="importOptions" @select="handleImportSelect">
          <n-button size="small" ghost type="primary">
            <template #icon>
              <n-icon>
                <Icon icon="material-symbols:upload" />
              </n-icon>
            </template>
            {{ t('page.faults.import') }}
            <n-icon style="margin-left: 4px">
              <Icon icon="ant-design:down-outlined" />
            </n-icon>
          </n-button>
        </n-dropdown>
        <UploadSiteMachineExcel
        ref="uploadRef"
        :show-trigger="false"
        :buttonText="t('page.faults.import')"
        :site-options="siteOptions"
        @success="fetchData"/>

        <template v-if="hasRole ">
          <NDropdown :options="createWorkOrderOptions" trigger="click" @select="handleCreateWorkOrderSelect">
            <NButton
              type="primary"
              ghost
              size="small"
              class="text-sm"
            >
              {{ t('page.faults.createOrder') }}
              <template #icon>
                 <Icon icon="ant-design:down-outlined" />
              </template>
            </NButton>
          </NDropdown>

          <UploadWorkOrderExcel v-model:show="showImportWorkOrderModal" :site-options="siteOptions" @success="fetchData" />

          <NDropdown :options="bindWorkOrderOptions" trigger="click" @select="handleBindWorkOrderSelect">
            <NButton
              type="primary"
              ghost
              size="small"
              class="text-sm"
            >
              {{ t('page.faults.bindOrder') }}
              <template #icon>
                 <Icon icon="ant-design:down-outlined" />
              </template>
            </NButton>
          </NDropdown>

          <BindWorkOrderModal ref="bindWorkOrderRef" style="display: none" :selectedRows="selectedRows" @refresh="handleRefresh" />

          <UploadBindWorkOrderExcel v-model:show="showImportBindWorkOrderModal" :site-options="siteOptions" @success="fetchData" />

          <!-- 批量修改状态组件 -->
          <BatchStatusModal
            :status-options="hasRole ? statusOptions : statusUpdateOptions"
            :selectedRows="selectedRows"
            @refresh="handleRefresh"
          />

          <UploadFileBathStatusModal
            :status-options="hasRole ? statusOptions : statusUpdateOptions"
            @refresh="handleRefresh"
          />

          <UnbindWorkOrderModal :selectedRows="selectedRows" @refresh="handleRefresh" />

       <NSwitch v-model:value="onlyMySite" size="small" class="text-sm" @update:value="onOnlyMySiteChange" />
    <span class="text-sm text-gray-600" style="margin-left: 4px;">{{ t('page.faults.mySite') }}</span>
        </template>
        <template v-if="!hasRole">
  <!-- 批量修改状态组件 -->
          <BatchStatusModal
            :status-options=statusUpdateOptions
            :selectedRows="selectedRows"
            @refresh="handleRefresh"
          />

          <UploadFileBathStatusModal
            :status-options=statusUpdateOptions
            @refresh="handleRefresh"
          />
        </template>
         <NButton circle size="small" ghost class="text-sm" @click="exportFaultsFile" :title="t('page.faults.exportExcel')">
          <template #icon>
            <icon-ant-design-download-outlined />
          </template>
        </NButton>


      </div>
    </div>
    <!-- 表格 -->
      <NDataTable
        flex-height
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        remote
        :row-key="(row: Faults) => row.id"
        :checked-row-keys="selectedRowKeys"
        @update:checked-row-keys="handleSelectionChange"
        :scroll-x="2000"
        striped
        class="sm:h-full"
      />
  </n-card>

    <!-- 创建工单弹框 -->
    <NModal v-model:show="showWorkOrderModal" style="width: 800px" preset="card" :title="t('page.faults.createOrder')" class="text-sm">
      <NForm :model="workOrderForm" label-width="120" size="small" class="text-sm">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <NFormItem>
            <template #label><span class="text-sm text-gray-500">{{ t('page.faults.orderNo') }}</span></template>
            <NInput v-model:value="workOrderForm.workOrderNo" readonly size="small" class="text-sm" />
          </NFormItem>

          <NFormItem>
            <template #label><span class="text-sm text-gray-500">{{ t('page.faults.orderDate') }}</span></template>
            <NInput v-model:value="workOrderForm.workOrderDate" readonly size="small" class="text-sm" />
          </NFormItem>

          <NFormItem>
            <template #label><span class="text-sm text-gray-500">{{ t('page.faults.site') }}</span></template>
            <NInput v-model:value="workOrderForm.site" readonly size="small" class="text-sm" />
          </NFormItem>

          <NFormItem>
            <template #label><span class="text-sm text-gray-500">{{ t('page.faults.faultMachineCount') }}</span></template>
            <NInput :value="workOrderForm.faultMachineCount.toString()" readonly size="small" class="text-sm" />
          </NFormItem>
        </div>

        <NFormItem :label="t('page.faults.selectedMachineList')">
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e6; border-radius: 6px; padding: 12px; width: 100%;" class="text-sm">
            <div v-for="machine in workOrderForm.selectedMachines" :key="machine.id"
                 style="display: flex; justify-content: space-evenly; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; width: 100%;">
              <!-- <div> -->
                <div class="text-sm text-gray-600" style="font-weight: 500; width:30%;" >{{ machine.sn }}</div>
                <div class="text-sm text-gray-600" style="width:30%;"> {{ machine.FaultsType?.name || machine.model }}</div>
                <div class="text-sm text-gray-600" style="width:30%;">
                  <!-- |  -->
                  {{ machine.Site?.name || machine.site_name }}
                </div>
              <!-- </div> -->
              <NTag type="warning" size="small" class="text-sm">{{ machine.Status?.name || machine.status_text }}</NTag>
            </div>
          </div>
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace>
          <NButton type="primary" size="small" class="text-sm" @click="handleConfirmWorkOrder">{{ t('page.faults.create') }}</NButton>
          <NButton size="small" class="text-sm" @click="handleCancelWorkOrder">{{ t('page.faults.cancel') }}</NButton>
        </NSpace>
      </template>
    </NModal>

  </div>
</template>
<style scoped>
.site-select :deep(.n-base-selection-placeholder){
  font-size: 12px !important;
}
:deep(.n-base-selection .n-base-selection-placeholder){
  font-size: 12px !important;
}
:deep(.n-base-selection-overlay){
  font-size: 12px !important;
}
:deep(.n-button){
  font-size: 12px !important;
}
:deep(.n-input-wrapper){
  font-size: 12px !important;
}
</style>
