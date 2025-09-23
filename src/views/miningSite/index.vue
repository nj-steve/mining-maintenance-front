<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import { useRouter } from 'vue-router';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchSites,updateSites } from '@/service/api/site';

interface Site {
  ID: number;
  Name: string;
  Address: string;
  AssetCount: number;
  OffShelfCount: number;
  InLogisticsCount: number;
  UnderRepairCount: number;
  ToBePutOnShelfCount: number;
  TotalHistoricalRepairs: number;
  IsOnsiteDefault: number;
  // 场地状态
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}

const dialog = useDialog()
const message = useMessage();
const router = useRouter();

const tableData = ref<Site[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');
const modelOptions = ref<{ label: string; value: number }[]>([{label:'是',value:1},{label:'否',value:0}])
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
const editForm = ref({
  id: 0,
  name: '',
  address: '',
  asset_count: 0,
  is_onsite_default: 0
});


// 打开修改弹框
const handleOpenEdit = (row: Site) => {
  editForm.value = {
    id: row.ID,
    name: row.Name || '',
    address: row.Address || '',
    asset_count: row.AssetCount ?? 0,
    is_onsite_default: row.IsOnsiteDefault ?? 0,
  };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 保存修改
const handleSaveEdit = async () => {
  try {
    // TODO: 调用后端接口 updateSites(editForm.value)
    const {error} = await updateSites(editForm.value.id, editForm.value);
    if(error==null){
        message.success('修改成功！');
        fetchData(); // 刷新表格
      }else{
        message.error('修改失败:' +error);
      }
  } catch (err) {
    message.error('修改失败');
  }finally{
    showEditModal.value = false;
  }
};

// ---------------- 表格列 ----------------
const columns: DataTableColumns<Site> = [
  { title: '场地名称', key: 'Name', width: 200 },
  { title: '场地地址', key: 'Address' },
  { title: '资产数', key: 'AssetCount'},
  { title: '下架检查', key: 'OffShelfCount'},
  { title: '物流中', key: 'InLogisticsCount' },
  { title: '维修中', key: 'UnderRepairCount', 
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
  { title: '待上架', key: 'ToBePutOnShelfCount' },
  { title: '历史维修数', key: 'TotalHistoricalRepairs' },
  { title: '是否驻场', key: 'IsOnsiteDefault',render: (row: any ) => {

    const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
      1: 'success',
      // '维修': 'warning',
      0: 'error',
      // '下架':'info',
    };

    // const label = (row?.IsOnsiteDefault==1? "是":"否") ?? '未知';
    const label = row?.IsOnsiteDefault === 1 ? '是' 
             : row?.IsOnsiteDefault === 0 ? '否' 
             : '未知';
    // return <NTag type={tagMap[row.Status]}>{label}</NTag>;
    return h(NTag, {type: tagMap[row.IsOnsiteDefault] }, () => label)
  } },
  {
    title: '操作',
    key: 'actions',
    align:'center',
    render: (row: Site) => {
      return [
        h(
          NButton,
          {
            // type: 'info',
            ghost: true,
            size:'small',
            style: "margin-right: 8px;color: #1890ff;",
            onClick: () => handleOpenEdit(row)
          },
          {
            default: () => '编辑',
            // icon: () => h('icon-mdi-pencil', { class: 'text-icon' })
          }
        ),
        h(
          NButton,
          {
            // type: 'primary',
            ghost: true,
            size:'small',
            style: 'color: #1890ff;',
            onClick: () => {
              router.push(`/miningsite/${row.ID}/info`);
            }
            
          },
          {
            default: () => '查看',
            // icon: () => h('icon-mdi-eye', { class: 'text-icon', style: 'color: #1890ff;' })
          }
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
    const {data,error} = await fetchSites(params);
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
      <NInput v-model:value="searchSerial" @change="fetchData" placeholder="请输入场地名称" clearable style="width: 240px" />
    </div>

    <!-- 表格 -->
    <NDataTable :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" remote />

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" title="修改场地信息">
      <NForm :model="editForm" label-width="100">
        <NFormItem label="场地名称">
          <NInput v-model:value="editForm.name" disabled />
        </NFormItem>
        <NFormItem label="场地地址">
          <NInput v-model:value="editForm.address" disabled />
        </NFormItem>
        <NFormItem label="资产数">
          <NInputNumber v-model:value="editForm.asset_count" disabled />
        </NFormItem>
        <NFormItem label="是否有驻场">
          <NSelect v-model:value="editForm.is_onsite_default" :options="modelOptions" />
        </NFormItem>
       
      </NForm>
      <template #footer>
        <NButton type="primary" @click="handleSaveEdit">保存</NButton>
        <NButton @click="showEditModal = false">取消</NButton>
      </template>
    </NModal>
  </div>
</template>