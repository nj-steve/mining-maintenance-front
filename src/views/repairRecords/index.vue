<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchRepairDetails,updateFaults } from '@/service/api/repair';
import UploadExcel from "@/components/upload/UploadExcel.vue"
import { useRouter } from 'vue-router';
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



function goDetail(id: number | string) {
  console.log("跳转到详情页，ID:", id);
  if (!id) {
    console.error("ID 为空，无法跳转");
    return;
  }
  try {
    router.push({ name: 'repairrecords-detail', params: { id: String(id) } });
  } catch (error) {
    console.error("路由跳转失败:", error);
  }
}

// ---------------- 表格列 ----------------
// const columns: DataTableColumns<Faults> = [
//   // { title: '序号', key: 'id', width: 200 },
//   { title: '日期', key: 'date' },
//   { title: '场地', key: 'site_name'},
//   { title: '型号', key: 'model'},
//   { title: 'SN码', key: 'sn' },
//   { title: '问题描述', key: 'description', 
//   // render: (row: Miner) => row.Status?.name ,
//   render: (row: any ) => {
//     if (row.Status?.name === null || row.Status?.name === undefined) {
//       return null;
//     }
//     const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
//       '在架': 'success',
//       '维修': 'warning',
//       '报废': 'error',
//       '下架':'info',
//     };

//     const label = row.Status?.name || '未知';
//     // return <NTag type={tagMap[row.Status]}>{label}</NTag>;
//     return h(NTag, {type: tagMap[row.Status?.name] }, () => label)
//   }
//   },
//   { title: '维修次数', key: 'repair_count' },
//   { title: '状态', key: 'warranty_status_text' },
//   {
//     title: '操作',
//     key: 'actions',
//     align:'center',
//     render: (row: Faults) => {
//       return [
//         h(
//           NButton,
//           {
//             type: 'info',
//             ghost: true,
//             style: "margin-right: 8px;",
//             onClick: () => handleOpenEdit(row)
//           },
//           { default: () => '修改' }
//         ),
//         // h(
//         //   NButton,
//         //   {
//         //     type: 'error',
//         //     ghost: true,
//         //     onClick: () => {
//         //       dialog.warning({
//         //         title: '确认报废',
//         //         content: `你确定要报废矿机「${row.serial_number}」吗？`,
//         //         positiveText: '确定',
//         //         negativeText: '取消',
//         //         onPositiveClick: () => message.error("报废操作,暂未启用")
//         //       })
//         //     }
//         //   },
//         //   { default: () => '报废' }
//         // )
//       ]
//     }
//   }
// ];
// 维修结果映射
const repairResultMap: Record<number, string> = {
  0: '未修复',
  1: '修复成功',
  2: '修复失败'
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
      const type = row.RepairResult === 1 ? 'success' : (row.RepairResult === 2 ? 'error' : 'warning')
      return h(NTag, { type }, () => label)
    }
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    render: (row) => {
      console.log("表格行数据:", row);
      const rowId = row.id || row.ID || row.Id || row.workOrderNo || row.WorkOrderNo;
      console.log("提取的ID:", rowId);
      
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
        h(
          NButton,
          { 
            type: 'info', 
            size: 'small', 
            ghost: true, 
            onClick: () => console.log('编辑:', row) 
          },
          { default: () => '编辑' }
        )
      ]
    }
  }
]

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  loading.value = true;
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    sn: searchSerial.value || undefined
  };

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
watch([searchSerial], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
  
});
</script>

<template>
  <div>
    <!-- 查询框 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <UploadExcel uploadUrl="/api/repair_stations/import_repair_details" />
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