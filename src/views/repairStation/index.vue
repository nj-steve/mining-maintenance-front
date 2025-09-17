<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchRepairStations,updateFaults } from '@/service/api/repair';


interface CompanyInfo {
  ID: number;
  Name: string;
  Address: string;
  LegalRepresentative: string;
  KYCStatus: number; // 可能是枚举：0=未认证, 1=已认证
  ContactName: string;
  ContactPhone: string;
  Score: number;
  CreatedAt: string; // ISO 时间字符串
  UpdatedAt: string; // ISO 时间字符串
}

const dialog = useDialog()
const message = useMessage();

const tableData = ref<CompanyInfo[]>([]);
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
const editForm = ref<CompanyInfo>({
  ID: 0,
  Name: '',
  Address: '',
  LegalRepresentative: '',
  KYCStatus: 0,// 可能是枚举：0=未认证, 1=已认证
  ContactName: '',
  ContactPhone: '',
  Score: 0,
  CreatedAt: '', // ISO 时间字符串
  UpdatedAt: '' // ISO 时间字符串
});

// 状态下拉选项
const statusOptions = [
  { label: '在架', value: 1 },
  { label: '维修', value: 2 },
  { label: '报废', value: 3 },
  { label: '下架', value: 4 }
];

// 打开修改弹框
const handleOpenEdit = (row: CompanyInfo) => {
  // editForm.value = {
    // id: row.id,
    // Faults_type_id: row.Faults_type_id ?? 0,
    // status_id: row.status_id ?? 0,
    // serial_number: row.serial_number || '',
    // serial_number_source: row.serial_number_source || '',
    // contract_number: row.contract_number || ''
  // };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 保存修改
const handleSaveEdit = async () => {
  try {
    // TODO: 调用后端接口 updateFaults(editForm.value)
    // console.log('修改提交:', editForm.value);
    const res = await updateFaults(editForm.value.ID, editForm.value);
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
const columns: DataTableColumns<CompanyInfo> = [
  { title: '公司名称', key: 'Name', width: 200 },
  { title: '法人代表', key: 'LegalRepresentative' },
  { title: 'KYC认证', key: 'KYCStatus'},
  { title: '详细地址', key: 'Address'},
  { title: '联系人', key: 'ContactName' },
  { title: '联系电话', key: 'ContactPhone', 
  // render: (row: Miner) => row.Status?.name ,
  // render: (row: any ) => {
  //   if (row.Status?.name === null || row.Status?.name === undefined) {
  //     return null;
  //   }
  //   const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
  //     '在架': 'success',
  //     '维修': 'warning',
  //     '报废': 'error',
  //     '下架':'info',
  //   };

  //   const label = row.Status?.name || '未知';
  //   // return <NTag type={tagMap[row.Status]}>{label}</NTag>;
  //   return h(NTag, {type: tagMap[row.Status?.name] }, () => label)
  // }
  },
  {
    title: '操作',
    key: 'actions',
    align:'center',
    render: (row: CompanyInfo) => {
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
        ), h(
          NButton,
          {
            type: 'info',
            ghost: true,
            style: "margin-right: 8px;",
            onClick: () => handleOpenEdit(row)
          },
          { default: () => '查看' }
        ),
        h(
          NButton,
          {
            type: 'error',
            ghost: true,
            onClick: () => {
              dialog.warning({
                title: '确认删除',
                content: `你确定要删除「${row.Name}」吗？`,
                positiveText: '确定',
                negativeText: '取消',
                onPositiveClick: () => message.error("报废操作,暂未启用")
              })
            }
          },
          { default: () => '删除' }
        )
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
    const {data,error} = await fetchRepairStations(params);
    if(error==null){
        tableData.value = data;
        // pagination.value.itemCount = data.pagination.total;
        // pagination.value.page =  data.pagination.page;
        // pagination.value.pageSize =  data.pagination.page_size;
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
        <!-- <NFormItem label="机型">
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
    
        <!-- <NFormItem label="状态">
          <NSelect v-model:value="editForm.status_id" :options="statusOptions" />
        </NFormItem>  -->
      </NForm>
      <template #footer>
        <NButton type="primary" @click="handleSaveEdit">保存</NButton>
        <NButton @click="showEditModal = false">取消</NButton>
      </template>
    </NModal>
  </div>
</template>