<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { NDataTable, useMessage, NButton,NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NDatePicker, NTooltip, NPopconfirm, NDropdown } from 'naive-ui';
import BatchStatusModal from './components/BatchStatusModal.vue';
import UploadFileBathStatusModal from './components/UploadFileBathStatusModal.vue';
import UploadWorkOrderExcel from './components/UploadWorkOrderExcel.vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchFaults,updateFaultsStatus,updateFaults, exportFaults } from '@/service/api/faults';
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
import { repairMethodRecord } from '@/constants/business';
import UploadBindWorkOrderExcel from './components/UploadBindWorkOrderExcel.vue'



import { Icon } from '@iconify/vue';

const authStore = useAuthStore();
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

const siteOptions = ref<{ label: string; value: number }[]>([]); // 场地列表
const statusOptions = ref<{ label: string; value: number }[]>([]);
const statusUpdateOptions = ref<{ label: string; value: number }[]>([]);

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

const bindWorkOrderOptions = [
  {
    label: '批量绑定',
    key: 'batch',
    icon: () => h(Icon, { icon: 'ant-design:plus-outlined' })
  },
  {
    label: '导入绑定',
    key: 'import',
    icon: () => h(Icon, { icon: 'ant-design:upload-outlined' })
  }
];

const handleBindWorkOrderSelect = (key: string) => {
  if (key === 'batch') {
    bindWorkOrderRef.value?.handleOpenModal();
  } else if (key === 'import') {
    showImportBindWorkOrderModal.value = true;
  }
};

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
        message.error(`加载失败: ${error}`);
    }
  } catch (error) {
    message.error('加载失败');
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
        statusOptions.value = data.map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      }
      if(operate_type==='update'){
        statusUpdateOptions.value = data.map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      }
    }else{
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
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
    message.error('获取场地数据失败');
  }
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
  { title: () => renderHeaderTitle('SN码'), key: 'sn', width: 180, 
    render: (row: Faults) => {
      const sn = row.sn || '未知';
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(sn);
          message.success('SN码已复制');
        } catch (e) {
          message.error('复制失败');
        }
      };
      return h(NTooltip, null, {
        trigger: () => h('div', { style: 'display:flex; align-items:center; gap:8px; max-width:180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }, [
          h('span', { class: 'text-sm text-gray-500', style: 'flex:1; min-width:0;' }, sn),
          // h(NButton, { size: 'tiny', quaternary: true, type: 'primary', onClick: onCopy }, { default: () => '复制' })
        ]),
        default: () => sn
      });
    }
  },
  { title: () => renderHeaderTitle('场地'), key: 'site_name', width: 150,
    render: (row: Faults) => {
       const siteName = row.site_name || '未知';
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
  { title: () => renderHeaderTitle('型号'), key: 'model', width: 120, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, row.model || '未知') },
  { 
    title: () => renderHeaderTitle('工单编号'), 
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
          message.success('工单编号已复制');
        } catch (e) {
          message.error('复制失败');
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
  { title: () => renderHeaderTitle('维修方式'), key: 'repair_method_text', width: 100,
     render: (row: any ) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        1: 'success',
        2: 'primary',
        3: 'primary',
      };
      // const label = row.Onsite === 1 ? '是' : row.Onsite === 0 ? '否' : '未知';
      return h(NTag, { class: 'text-sm', type: tagMap[row.repair_method || '无'],size:'small', round:true }, () => repairMethodRecord[row.repair_method || '未知'] || '未知')
    }
  },
  { title: () => renderHeaderTitle('流转状态'), key: 'status_text', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已上架': 'success',
        '已入库': 'success',
        '待入库': 'warning',
        '物流出': 'primary',
        '物流进': 'primary',
        '维修中': 'info',
        '维修完成': 'success',
        '待上架': 'warning',
        '报废': 'error',
        '未修复': 'error',
        '待处理': 'warning',
        // '新下架':'warning',
      };
      const label = row.status_text || '未知';
      return h(NTag, { class: 'text-sm', type: tagMap[row.status_text || '未知'],size:'small', round:true }, () => label)
    }
  },
  { title: () => renderHeaderTitle('维修状态'), key: 'repair_result_text', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已修复': 'success',
        '报废': 'error',
        '未修复': 'error',
        '待修复': 'warning',
      };
      const label = row.repair_result_text || '未知';
      return h(NTag, { class: 'text-sm', type: tagMap[row.repair_result_text || '未知'],size:'small', round:true }, () => label)
    }
  },
  { title: () => renderHeaderTitle('维修次数'), key: 'repair_count', width: 100, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, String(row.repair_count ?? '0')) },
  { title: () => renderHeaderTitle('短保'), key: 'warranty_status', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '短保中': 'success',
        '已过保': 'error',
      };
      const label = row.warranty_status_text || '无';
      return h(NTag, { class: 'text-sm', type: tagMap[row.warranty_status_text || '无'],size:'small', round:true}, () => label)
    }
  },
  { title: () => renderHeaderTitle('问题描述'), key: 'description', width: 200, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, row.description || '-') },
  { title: () => renderHeaderTitle('下架日期'), key: 'date', width: 120, render: (row: Faults) => h('span', { class: 'text-sm text-gray-500' }, row.date || '-') },
  { title: () => renderHeaderTitle('导入时间'), key: 'created_time', width: 160,
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
  { title: () => renderHeaderTitle('上架/入库时间'), key: 'on_shelf_time', width: 160,
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
    title: () => renderHeaderTitle('操作'),
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
                      const { data, error } = await deleteFaultsStatusById(row.id);
                      if (error == null) {
                        message.success('删除成功');
                        await fetchData();
                      } else {
                        message.error('删除失败');
                      }
                    } catch (e) {
                      message.error('删除失败');
                    }
                  }
                },
                {
                  trigger: () => h(
                    NButton,
                    { size: 'tiny', quaternary: true, type: 'error' },
                    { default: () => h(Icon, { icon: 'ant-design:delete-outlined', width: 16, height: 16 }) }
                  ),
                  default: () => '确认删除该故障机？'
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
watch([searchSerial,searchWorkOrderNo, searchSalerId, searchResultStatus, searchSiteId, searchStatus, searchStartDate, searchEndDate, searchModel], () => {
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
    label: `批量创建 (${selectedRows.value.length})`,
    key: 'batch',
    disabled: selectedRows.value.length === 0
  },
  {
    label: '导入创建',
    key: 'import'
  }
]);

// 创建工单
const handleCreateWorkOrder = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请选择要创建工单的设备');
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
    message.warning('仅可选择一个场地的机器');
    return;
  }
  // console.log('选中的场地:', uniqueSiteNames[0]);

  // 只选择状态为"新下架"的机器
  const downCheckMachines = selectedRows.value.filter(row => 
     row.status_text === '新下架'
  );
  // 只选择状态为"新下架"的机器
  const failureCheckMachines = selectedRows.value.filter(row => 
    row.status_text !== '新下架'
  );
   if (failureCheckMachines.length > 0 || downCheckMachines.length === 0) {
    message.warning('仅可选择“新下架”设备');
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
        message.success('工单创建成功！');
        showWorkOrderModal.value = false;
        // 清空选择
        selectedRowKeys.value = [];
        selectedRows.value = [];

        // 刷新数据
        fetchData();
      }
    }  
  } catch (error) {
    console.error('创建工单失败:', error);
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

// 导出故障列表（CSV，可用 Excel 打开）
const exportFaultsCsv = async () => {
  loading.value = true;
  try {
    const onlyMySite = localStorage.getItem('onlyMySite') === 'true' ? -1 : 1;
    const params: any = {
      sn: searchSerial.value || undefined,
      order_no: searchWorkOrderNo.value || undefined,
      site_id: searchSiteId.value || undefined,
      status: searchStatus.value || undefined,
      saler_id: searchSalerId.value || undefined,
      enable_all: onlyMySite, // 1 全部，-1 我的
      repair_result: searchResultStatus.value || undefined,
      start_date: searchStartDate.value ? new Date(searchStartDate.value).toISOString().split('T')[0] : undefined,
      end_date: searchEndDate.value ? new Date(searchEndDate.value).toISOString().split('T')[0] : undefined,
      model: searchModel.value || undefined
    };

    const { data, error } = await exportFaults(params);
    if (error == null) {
      const headers = [
        'SN码',
        '场地',
        '型号',
        '工单编号',
        '维修方式',
        '流转状态',
        '维修状态',
        '维修次数',
        '短保',
        '问题描述',
        '下架日期',
        '导入时间',
        '上架/入库时间'
      ];
      const formatCell = (val: any) => {
        const s = val === undefined || val === null ? '' : String(val);
        const needsQuote = /[",\n]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuote ? `"${escaped}"` : escaped;
      };
      const rows = (data || []).map((row: any) => [
        row.sn,
        row.Site?.name || row.site_name,
        row.model,
        row.order_no,
        repairMethodRecord[row.repair_method || '未知'] || row.repair_method_text,
        row.status_text,
        row.repair_result_text,
        row.repair_count,
        row.warranty_status_text,
        row.description,
        row.date,
        row.created_time,
        row.on_shelf_time
      ]);
      const csv = [headers, ...rows]
        .map(r => r.map(formatCell).join(','))
        .join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `故障机_导出_${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      message.success('导出成功，下载已开始');
    } else {
      message.error(`导出失败: ${error}`);
    }
  } catch (err) {
    message.error(`导出失败: ${err}`);
  } finally {
    loading.value = false;
  }
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
      message.error(`导出失败: ${error}`);
      return;
    }

    const headers = [
      'SN',
      '场地名',
      '机型',
      '位置',
      '故障原因',
      '下架时间',
      '上架时间',
      '短保状态',
      '工单号',
      '创建人',
      '备注',
      '导入时间',
      '更新时间',
      '流转状态',
      '维修结果',
      '维修次数'
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
    link.download = `故障机_导出_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('导出成功，下载已开始');
  } catch (err) {
    message.error(`导出失败: ${err}`);
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
      :site-options="siteOptions"
      :status-options="statusOptions"
      :hasRole="hasRole"
      @search="fetchData" 
    />
    <!-- 查询框 -->
  <n-card size="small" class=" card-wrapper  flex flex-col gap-16px h-[calc(100vh-250px)]" style="padding-bottom: 50px;">
    <div v-if="!isRead" class="mb-4 flex items-center gap-2 text-sm" style="display: flex; justify-content: flex-end; margin-bottom: 16px">
      <div class="text-sm" style="display: flex; align-items: center; gap: 12px;">
        <UploadSiteMachineExcel 
        buttonText="导入" 
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
              创建工单
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
              绑定工单
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
    <span class="text-sm text-gray-600" style="margin-left: 4px;">我的场地</span>
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
         <NButton circle size="small" ghost class="text-sm" @click="exportFaultsFile" title="导出 Excel">
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
    <NModal v-model:show="showWorkOrderModal" style="width: 800px" preset="card" title="创建工单" class="text-sm">
      <NForm :model="workOrderForm" label-width="120" size="small" class="text-sm">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <NFormItem>
            <template #label><span class="text-sm text-gray-500">工单编号</span></template>
            <NInput v-model:value="workOrderForm.workOrderNo" readonly size="small" class="text-sm" />
          </NFormItem>
          
          <NFormItem>
            <template #label><span class="text-sm text-gray-500">工单日期</span></template>
            <NInput v-model:value="workOrderForm.workOrderDate" readonly size="small" class="text-sm" />
          </NFormItem>
          
          <NFormItem>
            <template #label><span class="text-sm text-gray-500">场地</span></template>
            <NInput v-model:value="workOrderForm.site" readonly size="small" class="text-sm" />
          </NFormItem>
          
          <NFormItem>
            <template #label><span class="text-sm text-gray-500">故障机台数</span></template>
            <NInput :value="workOrderForm.faultMachineCount.toString()" readonly size="small" class="text-sm" />
          </NFormItem>
        </div>
        
        <NFormItem label="选中故障机列表">
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e6; border-radius: 6px; padding: 12px; width: 100%;" class="text-sm">
            <div v-for="(machine, index) in workOrderForm.selectedMachines" :key="machine.id" 
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
          <NButton type="primary" size="small" class="text-sm" @click="handleConfirmWorkOrder">创建</NButton>
          <NButton size="small" class="text-sm" @click="handleCancelWorkOrder">取消</NButton>
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
