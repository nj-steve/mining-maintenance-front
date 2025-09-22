<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchFaults,updateFaults,fetchFaultsStatus } from '@/service/api/faults';
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

const dialog = useDialog()
const message = useMessage();

const tableData = ref<Faults[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');
const modelOptions = ref<{ label: string; value: number }[]>([])

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

// 状态下拉选项
const statusOptions = [
  { label: '在架', value: 1 },
  { label: '维修', value: 2 },
  { label: '报废', value: 3 },
  { label: '下架', value: 4 }
];

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
    multiple: true
  },
  { title: '序号', key: 'id', width: 200 },
  { title: '日期', key: 'date' },
  { title: '场地', key: 'site_name'},
  { title: '型号', key: 'model'},
  { title: 'SN码', key: 'sn' },
  { title: '问题描述', key: 'description', 
  // render: (row: Miner) => row.Status?.name ,
  render: (row: any ) => {
    if (row.Status?.name === null || row.Status?.name === undefined) {
      return null;
    }
    const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
      '在架': 'success',
      '维修': 'warning',
      '报废': 'error',
      '下架':'info',
    };

    const label = row.Status?.name || '未知';
    // return <NTag type={tagMap[row.Status]}>{label}</NTag>;
    return h(NTag, {type: tagMap[row.Status?.name] }, () => label)
  }
  },
  { title: '维修次数', key: 'repair_count' },
  { title: '状态', key: 'status_text'},
  {
    title: '操作',
    key: 'actions',
    align:'center',
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
        // h(
        //   NButton,
        //   {
        //     type: 'error',
        //     ghost: true,
        //     onClick: () => {
        //       dialog.warning({
        //         title: '确认报废',
        //         content: `你确定要报废矿机「${row.serial_number}」吗？`,
        //         positiveText: '确定',
        //         negativeText: '取消',
        //         onPositiveClick: () => message.error("报废操作,暂未启用")
        //       })
        //     }
        //   },
        //   { default: () => '报废' }
        // )
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
    sn: searchSerial.value || undefined
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

const fetchStatus=async()=>{
  loading.value = true;
  const params: any = {
    type:1
  };

  try {
    const {data,error} = await fetchFaultsStatus(params);
    if(error==null){
        tableData.value = data.list;
    }else{
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  } finally {
    loading.value = false;
  }
}
// async function loadFaultsTypes() {
//   loading.value = true
//   try {
//     const res = await fetchFaultsTypes({})
//     if (res && res.data.length>0) {
//       // 明确 item 类型
//       const arr = res.data as { id:number, name: string,hash_rate:string }[]

//       // names.value = [arr.map(item => item.name+" _ "+item.hash_rate+" T")]

//       modelOptions.value = arr.map(item => ({
//         label:  item.name+" _ "+item.hash_rate+" T",
//         value: item.id,
//       }))
      
//     } else {
//       // names.value = []
//       modelOptions.value = []
//     }
//   } catch (err) {
//     // console.error('获取场地数据失败:', err)
//     message.error('加载场地数据失败')
//   } finally {
//     loading.value = false
//   }
// }

onMounted(() => {
  fetchData()
//   loadFaultsTypes();
});
watch([searchSerial], () => {
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
  // 只选择状态为"下架检查"的机器
  const downCheckMachines = selectedRows.value.filter(row => 
    row.Status?.name === '下架检查' || row.status_text === '下架检查'
  );
  
  if (downCheckMachines.length === 0) {
    message.warning('请选择状态为"下架检查"的机器');
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
</script>

<template>
  <div>
    <!-- 查询框 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <div style="display: flex; align-items: center; gap: 12px;">
        <UploadSiteMachineExcel buttonText="导入"/>
        <NButton 
          type="primary" 
          :disabled="selectedRows.length === 0"
          @click="handleCreateWorkOrder"
        >
          创建工单 ({{ selectedRows.length }})
        </NButton>
      </div>
      
      <NInput v-model:value="searchSerial" @change="fetchData" placeholder="请输入机器编号" clearable style="width: 240px" />
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
    />

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" title="修改矿机信息">
      <NForm :model="editForm" label-width="100">
        <NFormItem label="机型">
          <NSelect v-model:value="editForm.Faults_type_id" :options="modelOptions" />
        </NFormItem>
        <NFormItem label="机型">
          <NSelect v-model:value="editForm.Faults_type_id" :options="modelOptions" />
        </NFormItem>
        <NFormItem label="机器编号">
          <NInput v-model:value="editForm.serial_number" />
        </NFormItem>
        <!-- <NFormItem label="场地">
          <NInput v-model:value="editForm.Site?.name" disabled/>
        </NFormItem> -->
    
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