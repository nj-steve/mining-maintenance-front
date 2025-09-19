<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchOrders,updateOrders } from '@/service/api/workflow';


interface Faults {
  id: number;
  serial_number: string;
  serial_number_source: string;
  Faults_type_id:number;
  status_id:number,
  contract_number: string;
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

const dialog = useDialog()
const message = useMessage();

const tableData = ref<Faults[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');
const modelOptions = ref<{ label: string; value: number }[]>([])
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
    contract_number: row.contract_number || ''
  };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 保存修改
const handleSaveEdit = async () => {
  try {
    // TODO: 调用后端接口 updateOrders(editForm.value)
    // console.log('修改提交:', editForm.value);
    const res = await updateOrders(editForm.value.id, editForm.value);
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
  { title: '工单编号', key: 'OrderNo', width: 200 },
  { title: '维修商', key: 'StationID' },
  { title: '故障机数量', key: 'FaultCount'},
  { title: '是否驻场', key: 'Onsite'},
  { title: '总费用', key: 'RepairCost' },
  { title: '付款状态', key: 'SettlementStatus', 
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
  { title: '付款日期', key: 'PaymentDate' },
  { title: '工单状态', key: 'OrderStatus' },
  { title: '短保期开始', key: 'warranty_status_text' },
  { title: '剩余短保期', key: 'warranty_status_text' },
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
    const {data,error} = await fetchOrders(params);
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
// async function loadFaultsTypes() {
//   loading.value = true
//   try {
//     const res = await fetchOrdersTypes({})
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
</script>

<template>
  <div>
    <!-- 查询框 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: flex-end; margin-bottom: 16px">
      
      <NInput v-model:value="searchSerial" @change="fetchData" placeholder="请输入机器编号" clearable style="width: 240px" />
    </div>

    <!-- 表格 -->
    <NDataTable :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" remote />

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
  </div>
</template>