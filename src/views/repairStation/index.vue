<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchRepairStations,deleteRepairStation } from '@/service/api/repair';
import AddRepairStationModal from '@/components/custom/AddRepairStationModal.vue';
import EditRepairStationModal from '@/components/custom/EditRepairStationModal.vue';


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
const currentEditData = ref<CompanyInfo | null>(null);

// ---------------- 添加弹框 ----------------
const showAddModal = ref(false);


// 状态下拉选项
const statusOptions = [
  { label: '在架', value: 1 },
  { label: '维修', value: 2 },
  { label: '报废', value: 3 },
  { label: '下架', value: 4 }
];

// 打开修改弹框
const handleOpenEdit = (row: CompanyInfo) => {
  currentEditData.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 修改成功回调
const handleEditSuccess = () => {
  fetchData(); // 刷新表格
};

// 打开添加弹框
const handleOpenAdd = () => {
  showAddModal.value = true;
};

// 添加成功回调
const handleAddSuccess = () => {
  fetchData(); // 刷新表格
};

// ---------------- 表格列 ----------------
const renderHeaderTitle = (text: string) => h('span', { class: 'text-xs font-medium text-gray-500' }, text)
const columns: DataTableColumns<CompanyInfo> = [
  {
    title: () => renderHeaderTitle('公司名称'),
    key: 'Name',
    width: 200,
    render: (row: CompanyInfo) => h('span', { class: 'text-sm text-gray-500' }, row.Name || '')
  },
  {
    title: () => renderHeaderTitle('法人代表'),
    key: 'LegalRepresentative',
    render: (row: CompanyInfo) => h('span', { class: 'text-sm text-gray-500' }, row.LegalRepresentative || '')
  },
  {
    title: () => renderHeaderTitle('白名单认证'),
    key: 'KYCStatus',
    render: (row: CompanyInfo) => {
      return h(
        NTag,
        {
          class: 'text-sm',
          type: row.KYCStatus === 1 ? 'success' : 'warning'
        },
        {
          default: () => (row.KYCStatus === 1 ? '已认证' : '未认证')
        }
      );
    }
  },
  {
    title: () => renderHeaderTitle('详细地址'),
    key: 'Address',
    render: (row: CompanyInfo) => h('span', { class: 'text-sm text-gray-500' }, row.Address || '')
  },
  {
    title: () => renderHeaderTitle('联系人'),
    key: 'ContactName',
    render: (row: CompanyInfo) => h('span', { class: 'text-sm text-gray-500' }, row.ContactName || '')
  },
  {
    title: () => renderHeaderTitle('联系电话'),
    key: 'ContactPhone',
    render: (row: CompanyInfo) => h('span', { class: 'text-sm text-gray-500' }, row.ContactPhone || '')
  },
  {
    title: () => renderHeaderTitle('操作'),
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
                onPositiveClick: async () => {
                  try {
                    const { error } = await deleteRepairStation(row.ID);
                    if (error === null) {
                      message.success('删除成功！');
                      fetchData(); // 刷新数据
                    } else {
                      message.error('删除失败');
                    }
                  } catch (err) {
                    message.error('删除失败');
                  }
                }
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
    filter: searchSerial.value || undefined
  };

  try {
    const {data,error} = await fetchRepairStations(params);
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
    <!-- 查询框和添加按钮 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: space-between; margin-bottom: 16px">
      <NButton type="primary" @click="handleOpenAdd">添加维修站</NButton>
        <!-- 添加维修站组件 -->
    <AddRepairStationModal 
      v-model:show="showAddModal" 
      @success="handleAddSuccess" 
    />
      <NInput v-model:value="searchSerial" @change="fetchData" placeholder="请输入维修站名称" clearable style="width: 240px" />
    </div>

    <!-- 表格 -->
    <NDataTable :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" remote />

    <!-- 修改维修站组件 -->
    <EditRepairStationModal 
      v-model:show="showEditModal" 
      :edit-data="currentEditData"
      @success="handleEditSuccess" 
    />

  
  </div>
</template>
