<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchRepairDetails,updateFaults } from '@/service/api/repair';
import UploadExcel from "@/components/upload/UploadExcel.vue"
import { useRouter } from 'vue-router';
import { statusOptions } from '@/constants/business'
const router = useRouter();


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
const work_order_no = ref<string>('');
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
const repair_result = ref<number>();
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
// const statusOptions = [
//   { label: '在架', value: 1 },
//   { label: '维修', value: 2 },
//   { label: '报废', value: 3 },
//   { label: '下架', value: 4 }
// ];

// 打开修改弹框
// const handleOpenEdit = (row: Faults) => {
//   editForm.value = {
//     id: row.id,
//     Faults_type_id: row.Faults_type_id ?? 0,
//     status_id: row.status_id ?? 0,
//     serial_number: row.serial_number || '',
//     serial_number_source: row.serial_number_source || '',
//     contract_number: row.contract_number || ''
//   };
//   // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
//   showEditModal.value = true;
// };

function goDetail(id: number | string) {
  console.log("跳转到详情页，ID:", id);
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
const repairResultMap: Record<number, string> = {
  9: '已修复',
  10: '未修复',
  11: '报废'
}

const columns: DataTableColumns<any> = [
  { title: '日期', key: 'Date', width: 120 },
  { title: '工单号', key: 'WorkOrderNo', width: 180 },
  { title: '维修站点', key: 'RepairStationName', width: 180,
    render: (row) => row.RepairStationName || '-' 
    // ⚠️ 如果需要显示名称，就在 fetchData 里转换
  },
  { title: '机型', key: 'MachineModel', width: 200 },
  { title: '整机SN码', key: 'DeviceSN', width: 200 },
  { title: '损坏部件', key: 'RepairComponent', width: 120 },
  { title: '初测不良原因', key: 'DefectReason', width: 160 },
  { title: '查证缺陷', key: 'VerifyDefect', width: 160 },
  { title: '维修结果', key: 'RepairResult',
    render: (row) => {
      const label = repairResultMap[row.RepairResult] || '未知'
      const type = row.RepairResult === 9 ? 'success' : (row.RepairResult === 11 ? 'error' : 'warning')
      return h(NTag, { type }, () => label)
    }
  },
  {
    title: '操作',
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
            onClick: () => goDetail(rowId) 
          },
          { default: () => '详情' }
        ),
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
    // sn: work_order_no.value || undefined
    repair_result: repair_result.value || undefined,
    work_order_no: work_order_no.value || undefined,
  };
  // if(repair_result.value){
  //   params.repair_result = repair_result.value;
  // }
  // if(work_order_no.value){
  //   params.work_order_no = work_order_no.value;
  // }
  console.log("请求参数:", params);
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
// async function loadFaultsTypes() {
//   loading.value = true
//   try {
//     const res = await fetchRepairDetailsTypes({})
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
watch([work_order_no,repair_result], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
  
});

// 下载模板
const downloadTemplate = () => {
  // 创建一个临时链接来下载模板文件
  const link = document.createElement('a');
  link.href = '/src/assets/template/repair-detail.xlsx'; // 模板文件路径
  link.download = '维修明细导入模板.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success('模板下载已开始');
};
</script>

<template>
  <div>
    <!-- 查询框 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <div style="display: flex; gap: 8px; align-items: center;">
        <UploadExcel uploadUrl="/api/repair_stations/import_repair_details" />
        <!-- 下载模板按钮 -->
        <NButton 
          text 
          type="primary" 
          @click="downloadTemplate"
          style="font-size: 12px;"
        >
          📥 下载模板
        </NButton>
      </div>
      
      <NInput v-model:value="work_order_no"  placeholder="请输入机器编号" clearable style="width: 240px" />
         <NSelect v-model:value="repair_result"   :options="statusOptions" clearable style="width: 240px" />
    </div>

    <!-- 表格 -->
    <NDataTable :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" :scroll-x="1400" remote />

  </div>
</template>