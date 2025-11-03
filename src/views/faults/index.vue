<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton,NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NDatePicker, NTooltip } from 'naive-ui';
import BatchStatusModal from './components/BatchStatusModal.vue';
import UploadFileBathStatusModal from './components/UploadFileBathStatusModal.vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchFaults,updateFaultsStatus,updateFaults } from '@/service/api/faults';
import {fetchOrdersStatus} from '@/service/api/workflow';
import { createOrder } from '@/service/api/workflow';
import UploadSiteMachineExcel from "@/components/upload/UploadSiteMachineExcel.vue"
import {fetchOrdersSite} from '@/service/api';
import FaultsSearchCard from './components/FaultsSearchCard.vue'
import BindWorkOrderModal from './components/BindWorkOrderModal.vue'
import UnbindWorkOrderModal from './components/UnbindWorkOrderModal.vue'
import { useAuthStore } from '@/store/modules/auth';
import EditFaultModalButton from './components/EditFaultModalButtonShouhou.vue'
import EditFaultModalButtonYunwei from './components/EditFaultModalButtonYunwei.vue'

const authStore = useAuthStore();
const hasRole=!authStore.userInfo.roles.includes('3')

// console.log("Outer >> hasRole>>",hasRole)


interface Faults {
  id: number;
  sn: string;
  serial_number: string;
  serial_number_source: string;
  Faults_type_id:number;
  status_value:number,
  contract_number: string;
  status_text?: string;
  repair_result?: number;
  repair_result_text?: string;
  warranty_status?: number;
  warranty_status_text?: string;
  site_name?: string;
  site_id?:number;
  model?: string;
  order_id?: number;
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

// 批量选择相关
const selectedRowKeys = ref<number[]>([]);
const selectedRows = ref<Faults[]>([]);

// 工单相关
const showWorkOrderModal = ref(false);
const workOrderForm = ref({
  workOrderNo: '',
  workOrderDate: new Date().toISOString().split('T')[0],
  site: '',
  faultMachineCount: 0,
  selectedMachines: [] as Faults[],
  site_id:0,
});

// ---------------- 数据获取 ----------------
const fetchData = async () => {
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
    tableData.value = []
    if(error==null){
        tableData.value = data.list;
        pagination.value.itemCount = data.pagination.total;
        pagination.value.page =  data.pagination.page;
        pagination.value.pageSize =  data.pagination.page_size;
    }else{
        tableData.value=[]
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  } finally {
    loading.value = false;
  }
};


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
const fetchOrderStatusData = async () => {
  loading.value = true;
  const params: any = {
   type:1,//故障机状态
  };

  try {
    const {data,error} = await fetchOrdersStatus(params);
    
    if(error==null){
       statusOptions.value = data.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
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
  if(!hasRole){
    return
  }
  try {
    // 这里需要根据实际的API接口来获取场地数据
    const params: any = {
      enable_all: (hasRole===true && !(localStorage.getItem("onlyMySite")==='true'))?1:-1,
    };
    console.log("params",params)
    const { data, error } = hasRole?await fetchOrdersSite(params):{data:[],error:null};
    if (!error && data) {
      siteOptions.value = data.map((site: any) => ({
        label: site.Name,
        value: site.ID,
      }));
    }
  } catch (err) {
    message.error('获取场地数据失败');
  }
};

// ---------------- 表格列 ----------------
const columns: DataTableColumns<Faults> = [
  { 
    type: 'selection',
    multiple: true,
    width: 60
  },
  { title: '序号', key: 'id', width: 80 },
  { title: '日期', key: 'date', width: 120 },
  { title: 'SN码', key: 'sn', width: 180 },
  { title: '场地', key: 'site_name', width: 150,
    render: (row: Faults) => {
       const siteName = row.site_name || '未知';
       const siteId = row.site_id || 0;
       
       if (siteId) {
         return h(
           NButton,
           {
             text: true,
             type: 'primary',
             onClick: () => {
               router.push(`/miningsite/${siteId}/info`);
             }
           },
           { default: () => siteName }
         );
       }
       
       return siteName;
     }
  },
  { title: '型号', key: 'model', width: 120},
  { title: '问题描述', key: 'description', width: 200},
  { 
    title: '工单编号', 
    key: 'order_no', 
    width: 150,
    render: (row: Faults) => {
      const text = (row as any).order_no || '';
      return hasRole
          ? h(
        NTooltip,
        null,
        {
          trigger: () => h('div',
           { style: 'max-width:150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' ,
            onClick: () => router.push({ name: 'workflowdetail', params: { id: row.order_id } })
           }, 
           text),
          default: () => text
        }
      )
      : text;
    }
  },
  { title: '维修次数', key: 'repair_count', width: 100 },
  { title: '流转状态', key: 'status_text', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已修复': 'success',
        '物流出': 'primary',
        '物流进': 'primary',
        '维修中': 'info',
        '维修完成': 'success',
        '待上架': 'warning',
        '报废': 'error',
        '未修复': 'error',
        '待处理': 'warning',
        '新下架':'warning',
      };
      const label = row.status_text || '未知';
      return h(NTag, {type: tagMap[row.status_text || '未知'] }, () => label)
    }
  },
  { title: '维修状态', key: 'status_text', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已修复': 'success',
        '报废': 'error',
        '未修复': 'error',
        '待修复': 'warning',
      };
      const label = row.repair_result_text || '未知';
      return h(NTag, {type: tagMap[row.repair_result_text || '未知'] }, () => label)
    }
  },
  { title: '质保', key: 'warranty_status', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '短保中': 'success',
        '已过保': 'error',
      };
      const label = row.warranty_status_text || '未知';
      return h(NTag, {type: tagMap[row.warranty_status_text || '未知'] }, () => label)
    }
  },
  {
    title: '操作',
    key: 'actions',
    align:'center',
    width: 120,
    fixed: 'right',
    render: (row: Faults) => {
      return [
        hasRole
          ? h(
              EditFaultModalButton,
              {
                row,
                sites: siteOptions.value,
                statusOptions: statusOptions.value,
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
  fetchOrderStatusData();
  if(hasRole){
    // console.log("hasRole>>onMounted",hasRole)
    fetchSiteData();
  }
  
  // fetchSiteData();
});
watch([searchSerial,searchWorkOrderNo, searchSalerId, searchResultStatus, searchSiteId, searchStatus, searchStartDate, searchEndDate, searchModel], () => {
  tableData.value = [];
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
const handleCreateWorkOrder = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择机器');
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
  console.log('选中的场地:', uniqueSiteNames[0]);

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
    
    // console.log('提交工单数据:', submitData);
    
    // 调用创建工单API
    const { data, error } = await createOrder(submitData);
    
    if (error === null) {
      message.success('工单创建成功！');
      showWorkOrderModal.value = false;
      
      // 清空选择
      selectedRowKeys.value = [];
      selectedRows.value = [];
      
      // 刷新数据
      fetchData();
    } else {
      message.error(`工单创建失败: ${error}`);
    }
    
  } catch (error) {
    message.error('工单创建失败');
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
  tableData.value = [];
  pagination.value.page = 1;
  // 切换“我的场地”后立即刷新数据
  fetchData();
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
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: flex-end; margin-bottom: 16px">
      <div style="display: flex; align-items: center; gap: 12px;">
        <UploadSiteMachineExcel 
        buttonText="导入" 
        :site-options="siteOptions"
        @success="fetchData"/>
        
        <template v-if="hasRole">
          <NButton 
            type="primary" 
            ghost
            size="small"
            :disabled="selectedRows.length === 0"
            @click="handleCreateWorkOrder"
          >
            创建工单 ({{ selectedRows.length }})
          </NButton>
          
          <BindWorkOrderModal :selectedRows="selectedRows" @refresh="handleRefresh" />
          
          <!-- 批量修改状态组件 -->
          <BatchStatusModal 
            :status-options="statusOptions"
            :selectedRows="selectedRows"
            @refresh="handleRefresh"
          />

          <UploadFileBathStatusModal 
            :status-options="statusOptions"
            @refresh="handleRefresh"
          />

          <UnbindWorkOrderModal :selectedRows="selectedRows" @refresh="handleRefresh" />
       
       <NSwitch v-model:value="onlyMySite" size="medium" @update:value="onOnlyMySiteChange" />
    <span style="font-size: 12px; margin-left: 4px;">我的场地</span>
        </template>
        <template v-if="!hasRole">
  <!-- 批量修改状态组件 -->
          <BatchStatusModal 
            :status-options="[{ label: '已完成', value: 14 }]"
            :selectedRows="selectedRows"
            @refresh="handleRefresh"
          />

          <UploadFileBathStatusModal 
            :status-options="[{ label: '已完成', value: 14 }]"
            @refresh="handleRefresh"
          />
        </template>
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
        @update:checked-row-keys="handleSelectionChange"
        :scroll-x="1400"
        striped
        class="sm:h-full"
      />
  </n-card>

    <!-- 创建工单弹框 -->
    <NModal v-model:show="showWorkOrderModal" style="width: 800px" preset="card" title="创建工单">
      <NForm :model="workOrderForm" label-width="120">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <NFormItem label="工单编号">
            <NInput v-model:value="workOrderForm.workOrderNo" readonly />
          </NFormItem>
          
          <NFormItem label="工单日期">
            <NInput v-model:value="workOrderForm.workOrderDate" readonly />
          </NFormItem>
          
          <NFormItem label="场地">
            <NInput v-model:value="workOrderForm.site" readonly />
          </NFormItem>
          
          <NFormItem label="故障机台数">
            <NInput :value="workOrderForm.faultMachineCount.toString()" readonly />
          </NFormItem>
        </div>
        
        <NFormItem label="选中故障机列表">
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e6; border-radius: 6px; padding: 12px; width: 100%;">
            <div v-for="(machine, index) in workOrderForm.selectedMachines" :key="machine.id" 
                 style="display: flex; justify-content: space-evenly; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; width: 100%;">
              <!-- <div> -->
                <div style="font-weight: 500;font-size: 12px; width:30%;color: #666;" >{{ machine.sn }}</div>
                <div style="font-size: 12px; width:30%;color: #666;"> {{ machine.FaultsType?.name || machine.model }}</div>
                <div style="font-size: 12px; width:30%;color: #666;">
                  <!-- |  -->
                  {{ machine.Site?.name || machine.site_name }}
                </div>
              <!-- </div> -->
              <NTag type="warning">{{ machine.Status?.name || machine.status_text }}</NTag>
            </div>
          </div>
        </NFormItem>
      </NForm>
      
      <template #footer>
        <NSpace>
          <NButton type="primary" @click="handleConfirmWorkOrder">创建</NButton>
          <NButton @click="handleCancelWorkOrder">取消</NButton>
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