<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { useRouter } from 'vue-router';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchSites,updateSites,fetchUser } from '@/service/api';
import { siteStatusRecord } from '@/constants/business';
import SearchBar from './components/SearchBar.vue';

interface Site {
  id: number;
  name: string;
  address?: string;
  asset_count: number;
  off_shelf_count: number;
  in_logistics_count: number;
  under_repair_count: number;
  to_be_put_on_shelf_count: number;
  site_status: number;
  saler_name: string;
  saler_id: number;
  director_name: string;
  phone: string;
  email: string;
  repairing: number;
  repairing_rate: number;
  wait_repair: number;
  wait_repair_rate: number;
  is_onsite_default?: number;
}

const dialog = useDialog()
const message = useMessage();
const router = useRouter();

const tableData = ref<Site[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');
const selectedSalerId = ref<number | null>(null);
const selectedSiteStatus = ref<number | null>(null);
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

type EditForm = Pick<Site, 'id' | 'name' | 'address' | 'asset_count' | 'is_onsite_default' | 'site_status' | 'saler_id'>
// ---------------- 修改弹框 ----------------
const showEditModal = ref(false);
const salerMap = ref<Record<number, string>>({});
const editForm = ref<EditForm>({
  id: 0,
  name: '',
  address: '',
  asset_count: 0,
  is_onsite_default: 0,
  site_status: 0,
  saler_id: 0
});

// 打开修改弹框
const handleOpenEdit = (row: Site) => {
  editForm.value = {
    id: row.id,
    name: row.name || '',
    address: row.address || '',
    asset_count: row.asset_count ?? 0,
    is_onsite_default: row.is_onsite_default ?? 0,
    site_status: row.site_status ?? 0,
    saler_id: row.saler_id ?? 0,
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

const fetchUsers = async () => {
  const {data,error} = await fetchUser({
    page: 1,
    page_size: -1,
    status: 1,
    role: 2,
  });
  if(error==null){
    console.log("data.list",data.list)
    const salerMap_byId = data.list.reduce((acc:any, cur:any) => {
      acc[cur.id] = cur.real_name;
      return acc;
    }, {} as Record<number, string>);
    console.log("salerMap_byId",salerMap_byId)
    salerMap.value = salerMap_byId;

    // editForm.value.saler_id = data[0].id;
  }else{
    message.error('获取用户失败:' +error);
  }
}
// ---------------- 表格列 ----------------
const columns: DataTableColumns<Site> = [
  { title: '场地名称', key: 'name', width: 200 },
  { title: '资产数', key: 'asset_count'},
  { title: '24H故障数', key: 'off_shelf_count'},
  { title: '物流中', key: 'in_logistics_count' },
  { title: '待上架', key: 'to_be_put_on_shelf_count' },

  { title: '在修数', key: 'repairing' },
  
  { title: '待修数', key: 'wait_repair' },
  { title: '待修率', key: 'wait_repair_rate' },
  { title: '报废数', key: 'repairing_rate' },
  { title: '站点状态', key: 'site_status',render: (row: any ) => {
    const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
      0: 'default',
      1: 'success',
      2: 'primary',
      3: 'warning',
    };
    return h(NTag, {type: tagMap[row.site_status] }, () => siteStatusRecord[row.site_status])
  } },
   { title: '售后专员', key: 'saler_name' },
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
              router.push(`/miningsite/${row.id}/info`);
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
  console.log("selectedSiteStatus.value",selectedSiteStatus.value)
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    name: searchSerial.value || undefined,
    saler_id: selectedSalerId.value || undefined,
    site_status: selectedSiteStatus.value===0 ? 0 : selectedSiteStatus.value || undefined
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
  fetchUsers();
});
watch([searchSerial, selectedSalerId, selectedSiteStatus], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
  fetchUsers();
  
});
const siteStatusOptions = computed(() => {
  return Object.entries(siteStatusRecord).map(([value, label]) => ({ label, value: Number(value) }));
});
const salerOptions = computed(() => {
  return Object.entries(salerMap.value).map(([id, name]) => ({ label: name, value: Number(id) }));
});
const siteStatusSelected = computed<number[]>({
  get() {
    const s = editForm.value.site_status ?? 0;
    const selected: number[] = [];
    if ((s & 1) !== 0) selected.push(1);
    if ((s & 2) !== 0) selected.push(2);
    return selected;
  },
  set(vals: number[]) {
    editForm.value.site_status = vals.reduce((acc, v) => acc | v, 0);
  }
});
const onSearch = () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
};
</script>

<template>
  <div>
    <!-- 查询框 -->
    <SearchBar
      v-model:serial="searchSerial"
      v-model:salerId="selectedSalerId"
      v-model:siteStatus="selectedSiteStatus"
      :salerOptions="salerOptions"
      :siteStatusOptions="siteStatusOptions"
      @search="onSearch"
    />

    <!-- 表格 -->
    <NDataTable :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" remote />

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" title="修改场地信息">
      <NForm :model="editForm" label-width="100">
        <NFormItem label="场地名称">
          <NInput v-model:value="editForm.name" disabled />
        </NFormItem>
        <NFormItem label="场地地址">
          <NInput v-model:value="editForm.address"  />
        </NFormItem>
        <NFormItem label="资产数">
          <NInputNumber v-model:value="editForm.asset_count" disabled />
        </NFormItem>
        <NFormItem label="场地状态">
          <n-checkbox-group v-model:value="siteStatusSelected">
            <n-space item-style="display: flex;">
              <n-checkbox :value="1" label="驻场" />
              <n-checkbox :value="2" label="寄修" />
            </n-space>
          </n-checkbox-group>
        </NFormItem>
        <NFormItem label="售后专员">
          <NSelect v-model:value="editForm.saler_id" :options="salerOptions" />
        </NFormItem>

       
      </NForm>
      <template #footer>
        <NButton type="primary" @click="handleSaveEdit">保存</NButton>
        <NButton @click="showEditModal = false">取消</NButton>
      </template>
    </NModal>
  </div>
</template>