<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/modules/auth';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NSpace, NTooltip } from 'naive-ui';
import { Icon } from '@iconify/vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchSites,updateSites,fetchUser, UpdateSiteHistory } from '@/service/api';
import { siteStatusRecord } from '@/constants/business';
import SearchBar from './components/SearchBar.vue';

const authStore = useAuthStore();
const hasRole=!authStore.userInfo.roles.includes('3')
const isAdmin=authStore.userInfo.roles.includes('1') // 超管

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
  fault_count: number;
  scrapped_count: number;
  wait_repair_count: number;
  wait_repair_rate: number;
  is_onsite_default?: number;
  wait_on_shelf_count: number;
  on_shelf_wait_repair_count: number;
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
const showEditHistoryModal = ref(false);
const siteHistoryForm = ref<{ id: number; on_shelf_wait_repair_count: number, date_time: string }>({ id: 0, on_shelf_wait_repair_count: 0, date_time: '' });
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

// 新增：打开在架待修数编辑弹框
const handleOpenEditHistory = (row: Site) => {
  siteHistoryForm.value.id = row.id;

  // 初始值（若后端不返回该字段到列表，默认 0，由用户填写）
  siteHistoryForm.value.on_shelf_wait_repair_count = 0;
  // 新增：设置默认时间为当前时间
  siteHistoryForm.value.date_time = new Date().toISOString().slice(0, 10);
  showEditHistoryModal.value = true;
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

// 新增：保存在架待修数修改
const handleSaveEditHistory = async () => {
  try {
    const { error } = await UpdateSiteHistory(siteHistoryForm.value.id, {
      date_time: siteHistoryForm.value.date_time,
      on_shelf_wait_repair_count: siteHistoryForm.value.on_shelf_wait_repair_count,
    });
    if (error == null) {
      message.success('修改成功！');
      fetchData();
    } else {
      message.error('修改失败:' + error);
    }
  } catch (err) {
    message.error('修改失败');
  } finally {
    showEditHistoryModal.value = false;
  }
};
const fetchUsers = async () => {
  if (!hasRole) {
    return;
  }
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
  {
    title: '场地名称',
    key: 'name',
    width: 200,
    render: (row: Site) => {
      const content = row.name || '';
      return h(
        NTooltip,
        { placement: 'top' },
        {
          default: () => content,
          trigger: () =>
            h(
              'div',
              {
                style: {
                  width: '200px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  color: '#1890ff'
                },
                title: content,
                onClick: () => {
                  router.push(`/miningsite/${row.id}/info`);
                }
              },
              content
            )
        }
      );
    }
  },
  {
    title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:100px;' },
        [
          '资产数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '总托管机器数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),
    key: 'asset_count',
    render: (row: Site) => row.asset_count.toLocaleString() || 0
  },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:100px;' },
        [
          '24H故障数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '近24小时导入故障机数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ),width: 120, key: 'fault_count',render: (row: Site) => row.fault_count},
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          '物流中',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“物流进+物流出” 机器数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'in_logistics_count',render: (row: Site) => row.in_logistics_count.toLocaleString() || 0 },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          '待上架',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“待上架” 的机器数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'wait_on_shelf_count',render: (row: Site) => row.wait_on_shelf_count.toLocaleString() || 0 },
  // { title: '待上架', key: 'wait_on_shelf_count',render: (row: Site) => row.wait_on_shelf_count.toLocaleString() || 0 },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          '在修数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“维修中” 的机器数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'repairing',render: (row: Site) => row.repairing.toLocaleString() || 0 },
  // { title: '在修数', key: 'repairing',render: (row: Site) => row.repairing.toLocaleString() || 0 },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          '在架待修数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“在架，等待下架” 故障机数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'on_shelf_wait_repair_count',render: (row: Site) => row.on_shelf_wait_repair_count.toLocaleString() || 0 },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:180px;' },
        [
          '待修数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '状态：“未下架+已下架+待处理” 故障机器数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'wait_repair_count', render: (row: Site) => h('span', (row.wait_repair_count+row.on_shelf_wait_repair_count)?.toLocaleString?.() || '0') },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:120px;' },
        [
          '待修率',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '未下架+已下架+待处理 故障机器数占比',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'wait_repair_rate', render: (row: Site) => h('span', { title: '未下架+已下架+待处理 故障机器数占比' }, `${Number(row.wait_repair_rate ?? 0).toFixed(2)}%`) },
  // { title: '待修率', key: 'wait_repair_rate', render: (row: Site) => h('span', { title: '未下架+已下架+待处理 机器' }, `${Number(row.wait_repair_rate ?? 0).toFixed(2)}%`) },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          '净故障数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '在架待修数+待修数+在修数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'fault_count',render: (row: Site) => row.in_logistics_count+row.wait_repair_count+row.repairing+row.on_shelf_wait_repair_count },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          '预报废数',
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => '维修状态：“报废” 故障机数',
              trigger: () =>
                h(Icon, {
                  icon: 'ant-design:question-circle-outlined',
                  width: 14,
                  height: 14,
                  color: '#999',
                  style: 'cursor:pointer;'
                })
            }
          )
        ]
      ), key: 'scrapped_count',render: (row: Site) => row.scrapped_count.toLocaleString() || 0 },
  // { title: , key: 'scrapped_count',render: (row: Site) => row.scrapped_count.toLocaleString() || 0 },
  { title: '维修状态', key: 'site_status',render: (row: any ) => {
    const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
      0: 'default',
      1: 'success',
      2: 'primary',
      3: 'warning',
    };
    return h(NTag, {type: tagMap[row.site_status] }, () => siteStatusRecord[row.site_status])
  } },
   ...(hasRole ? [{ title: '售后专员', key: 'saler_name' }] : []),
  {
    title: '操作',
    key: 'actions',
    width: 180,
    align:'center',
    render: (row: Site) => {
      if(!hasRole){
             return h(
        NButton,
        {
          ghost: true,
          size:'small',
          style: 'color: #1890ff;',
          onClick: () => {
            handleOpenEditHistory(row)
            // router.push(`/sitereport?site_id=${row.id}`)
          }
        },
        { default: () => '编辑日报' }
      );
      }
      if(isAdmin){
        return h(
          NSpace,
          { size: 8, justify: 'center' },
          {
            default: () => [
              h(
                NButton,
                {
                  ghost: true,
                  size:'small',
                  style: 'color: #1890ff;',
                  onClick: () => {
                    handleOpenEditHistory(row)
                  }
                },
                { default: () => '日报' }
              ),
              h(
                NButton,
                {
                  ghost: true,
                  size:'small',
                  style: 'color: #1890ff;',
                  onClick: () => handleOpenEdit(row)
                },
                {
                  default: () => '编辑',
                }
              ),
              h(
                NButton,
                {
                  ghost: true,
                  size:'small',
                  style: 'color: #1890ff;',
                  onClick: () => {
                    router.push(`/miningsite/${row.id}/info`);
                  }
                },
                {
                  default: () => '查看',
                }
              )
            ]
          }
        )
      }
      // 移除重复的 isAdmin 分支
      // (重复代码已删除)
      // 已移除重复的 isAdmin 分支内容
      if (hasRole) {
        return [
          h(
            NButton,
            {
              ghost: true,
              size:'small',
              style: "margin-right: 8px;color: #1890ff;",
              onClick: () => handleOpenEdit(row)
            },
            {
              default: () => '编辑',
            }
          ),
          h(
            NButton,
            {
              ghost: true,
              size:'small',
              style: 'color: #1890ff;',
              onClick: () => {
                router.push(`/miningsite/${row.id}/info`);
              }
            },
            {
              default: () => '查看',
            }
          )
        ]
      }
    }
  }
];

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  loading.value = true;
  let onlyMySite = localStorage.getItem('onlyMySite') === 'true' ? -1 : 1
  console.log("selectedSiteStatus.value",selectedSiteStatus.value)
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    name: searchSerial.value || undefined,
    enable_all: onlyMySite,//1 全部，-1 我的
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
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 查询框 -->
     <div class="flex justify-between items-center" v-if="hasRole"> 
      <SearchBar
      v-model:serial="searchSerial"
      v-model:salerId="selectedSalerId"
      v-model:siteStatus="selectedSiteStatus"
      :salerOptions="salerOptions"
      :siteStatusOptions="siteStatusOptions"
      @search="onSearch"
    />
    <div>
      <NSwitch v-model:value="onlyMySite" size="medium" @update:value="onOnlyMySiteChange"  style="margin-left:10px;"/>
    <span style="font-size: 12px; margin-left: 4px;">我的场地</span>
    </div>
         

     </div>
     <div class="card-wrapper sm:flex-1-hidden">

    <!-- 表格 -->
    <NDataTable 
    flex-height
    :scroll-x="1400"
    :columns="columns" 
    :data="tableData" 
    :pagination="pagination" 
    :row-key="row => row.id"
    class="sm:h-full"
    :loading="loading" remote />
    </div>

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
        <NSpace :size="12">
          <NButton class="min-w-96px" type="primary" size="medium" @click="handleSaveEdit">保存</NButton>
          <NButton class="min-w-96px" size="medium" @click="showEditModal = false">取消</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 新增：在架待修数编辑弹框 -->
    <NModal v-model:show="showEditHistoryModal" style="width: 500px" preset="card" title="修改在架待修数">
      <NForm :model="siteHistoryForm" label-width="120">
        <NFormItem label="在架待修数">
          <NInputNumber v-model:value="siteHistoryForm.on_shelf_wait_repair_count" :min="0" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="12">
          <NButton class="min-w-96px" type="primary" size="medium" @click="handleSaveEditHistory">保存</NButton>
          <NButton class="min-w-96px" size="medium" @click="showEditHistoryModal = false">取消</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.card-wrapper {
  flex: 1;
  padding: 0 !important;
  .n-card__content {
    padding: 0px !important;
  }
}

</style>
