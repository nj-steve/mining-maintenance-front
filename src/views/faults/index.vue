<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NDatePicker } from 'naive-ui';
import BatchStatusModal from './components/BatchStatusModal.vue';
import UploadFileBathStatusModal from './components/UploadFileBathStatusModal.vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useRouter } from 'vue-router';
import { fetchFaults,updateFaults } from '@/service/api/faults';
import {fetchOrdersStatus} from '@/service/api/workflow';
import { createOrder } from '@/service/api/workflow';
import UploadSiteMachineExcel from "@/components/upload/UploadSiteMachineExcel.vue"

interface Faults {
  id: number;
  serial_number: string;
  serial_number_source: string;
  Faults_type_id:number;
  status_id:number,
  contract_number: string;
  status_text?: string;
  site_name?: string;
  site_id?:number;
  model?: string;
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
const modelOptions = ref<{ label: string; value: number }[]>([])
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
  site_id:0
});
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
const showEditModal = ref(false);
const editForm = ref<Faults>({
  id: 0,
  Faults_type_id:0,
  status_id:0,
  serial_number: '',
  serial_number_source: '',
  contract_number: '',
  site_id:0
  // FaultsType: { name: '', hash_rate: 0 },
  // Site: { name: '' },
  
});

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

// 打开修改弹框
const handleOpenEdit = (row: Faults) => {
  editForm.value = {
    id: row.id,
    Faults_type_id: row.Faults_type_id ?? 0,
    status_id: row.status_id ?? 0,
    serial_number: row.serial_number || '',
    serial_number_source: row.serial_number_source || '',
    contract_number: row.contract_number || '',
    site_id: row.site_id || 0,
  };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 保存修改
const handleSaveEdit = async () => {
  try {
    // TODO: 调用后端接口 updateFaults(editForm.value)
    // console.log('修改提交:', editForm.value);
    const res = await updateFaults(editForm.value.id, editForm.value);
    if(res.response?.data?.msg=="success"){
        message.success('修改成功！');
        fetchData(); // 刷新表格
      }else{
        message.error('修改失败:' +res.response?.data?.msg);
      }
  } catch (err) {
    message.error('修改失败');
  }finally{
    showEditModal.value = false;
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
  { title: '工单编号', key: 'order_no', width: 150},
  { title: '维修次数', key: 'repair_count', width: 100 },
  { title: '状态', key: 'status_text', width: 100,
    render: (row: Faults) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '在架': 'success',
        '维修': 'info',
        '报废': 'error',
        '新下架':'warning',
      };
      const label = row.status_text || '未知';
      return h(NTag, {type: tagMap[row.status_text || '未知'] }, () => label)
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
        h(
          NButton,
          {
            type: 'info',
            ghost: true,
            style: "margin-right: 8px;",
            onClick: () => handleOpenEdit(row)
          },
          { default: () => '修改' }
        ),
      ]
    }
  }
];

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  loading.value = true;
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    sn: searchSerial.value || undefined,
    site_id: searchSiteId.value || undefined,
    status: searchStatus.value || undefined,
    start_date: searchStartDate.value ? new Date(searchStartDate.value).toISOString().split('T')[0] : undefined,
    end_date: searchEndDate.value ? new Date(searchEndDate.value).toISOString().split('T')[0] : undefined,
    model: searchModel.value || undefined
  };

  try {
    const {data,error} = await fetchFaults(params);
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
  fetchOrderStatusData();
//   loadFaultsTypes();
});
watch([searchSerial, searchSiteId, searchStatus, searchStartDate, searchEndDate, searchModel], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
});

// 批量选择处理
const handleSelectionChange = (keys: (string | number)[], rows: any[]) => {
  selectedRowKeys.value = keys.map(key => Number(key));
  selectedRows.value = rows as Faults[];
  console.log('选中的记录:', keys, rows);
};

// 创建工单
const handleCreateWorkOrder = () => {
  // 只选择状态为"新下架"的机器
  const downCheckMachines = selectedRows.value.filter(row => 
    row.Status?.name === '新下架' || row.status_text === '新下架'
  );
  
  if (downCheckMachines.length === 0) {
    message.warning('请选择状态为"新下架"的机器');
    return;
  }
  
  // 生成工单编号
  const workOrderNo = `WO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
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
    
    console.log('提交工单数据:', submitData);
    
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
</script>

<template>
  <div>
    <!-- 查询框 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <div style="display: flex; align-items: center; gap: 12px;">
        <UploadSiteMachineExcel buttonText="导入" @success="fetchData"/>
        <NButton 
          type="primary" 
          :disabled="selectedRows.length === 0"
          @click="handleCreateWorkOrder"
        >
          创建工单 ({{ selectedRows.length }})
        </NButton>

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
      </div>

      <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
        <NInput 
          v-model:value="searchSerial" 
          @change="fetchData" 
          placeholder="请输入机器编号" 
          clearable 
          style="width: 200px" 
        />
        
        <!-- <NInputNumber 
          v-model:value="searchSiteId" 
          placeholder="场地ID" 
          clearable 
          style="width: 150px" 
        /> -->
        
        <NSelect 
          v-model:value="searchStatus" 
          :options="statusOptions" 
          placeholder="机器状态" 
          clearable 
          style="width: 150px" 
        />
        
        <!-- <NDatePicker 
          v-model:value="searchStartDate" 
          type="date" 
          placeholder="开始日期" 
          clearable 
          style="width: 150px" 
        />
        
        <NDatePicker 
          v-model:value="searchEndDate" 
          type="date" 
          placeholder="结束日期" 
          clearable 
          style="width: 150px" 
        /> -->
        
        <!-- <NSelect 
          v-model:value="searchModel" 
          :options="modelOptions" 
          placeholder="机器类型" 
          clearable 
          style="width: 150px" 
        /> -->
      </div>
    </div>

    <!-- 表格 -->
    <NDataTable 
      :columns="columns" 
      :data="tableData" 
      :pagination="pagination" 
      :loading="loading" 
      remote
      :row-key="(row: Faults) => row.id"
      @update:checked-row-keys="handleSelectionChange"
      :scroll-x="1400"
      striped
    />

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" title="修改矿机信息">
      <NForm :model="editForm" label-width="100">
        <NFormItem label="状态">
          <NSelect v-model:value="editForm.status_id" :options="statusOptions" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton type="primary" @click="handleSaveEdit">保存</NButton>
        <NButton @click="showEditModal = false">取消</NButton>
      </template>
    </NModal>

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
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e6; border-radius: 6px; padding: 12px;">
            <div v-for="(machine, index) in workOrderForm.selectedMachines" :key="machine.id" 
                 style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
              <div>
                <div style="font-weight: 500;">{{ machine.serial_number }}</div>
                <div style="font-size: 12px; color: #666;">
                  {{ machine.FaultsType?.name || machine.model }} | 
                  {{ machine.Site?.name || machine.site_name }}
                </div>
              </div>
              <NTag type="warning">{{ machine.Status?.name || machine.status_text }}</NTag>
            </div>
          </div>
        </NFormItem>
      </NForm>
      
      <template #footer>
        <NButton type="primary" @click="handleConfirmWorkOrder">创建</NButton>
        <NButton @click="handleCancelWorkOrder">取消</NButton>
      </template>
    </NModal>



    
  </div>
</template>