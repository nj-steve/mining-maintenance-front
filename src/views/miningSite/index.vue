<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/store/modules/auth';
import { NDataTable, useMessage, NButton, useDialog,NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NSpace, NTooltip, NSwitch, NCheckbox, NCheckboxGroup } from 'naive-ui';
import { Icon } from '@iconify/vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchSites,updateSites,fetchUser, UpdateSiteHistory, fetchOrders } from '@/service/api';
import { siteStatusRecord } from '@/constants/business';
import SearchBar from './components/SearchBar.vue';

const authStore = useAuthStore();
const hasRole=!authStore.userInfo.roles.includes('3')
const isAdmin=authStore.userInfo.roles.includes('1') // 超管
const isRead=authStore.userInfo.roles.includes('5') // 只读用户

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
  bind_type?: string;
  order_id?: string | number;
  order_no?: string;
  board_bind_type?: string;
  board_order_id?: string | number;
  board_order_no?: string;
}

const message = useMessage();
const router = useRouter();
const { t } = useI18n();

const tableData = ref<Site[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');
const selectedSalerId = ref<number | null>(null);
const selectedSiteStatus = ref<number | null>(null);
const bindTypeModel = ref<string | null>(null);
const borderBindTypeModel = ref<string | null>(null);
const searchDate = ref<string | null>(null);

// 分页
const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix({ itemCount }) {
    return t('page.miningSite.totalItems', { count: itemCount })
  },
  onChange: page => {
    pagination.value.page = page;
  },
  onUpdatePageSize: pageSize => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
  }
});

type EditForm = Pick<Site, 'id' | 'name' | 'address' | 'asset_count' | 'is_onsite_default' | 'site_status' | 'saler_id' | 'bind_type' | 'order_id' | 'board_bind_type' | 'board_order_id'>
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
  saler_id: 0,
  bind_type: "manual",
  order_id: 0,
  board_bind_type: "manual",
  board_order_id: 0
});

const orderOptions = ref<{ label: string; value: string | number }[]>([]);
const orderLoading = ref(false);

const getOrders = async (siteId: number) => {
  if (!siteId) return;
  orderLoading.value = true;
  try {
    const { data, error } = await fetchOrders({ site_id: siteId });
    if (!error && data.list) {
      orderOptions.value = data.list.map((item: any) => ({
        label: item.OrderNo || item.ID,
        value: item.ID|| String(item.ID)
      }));
    }
  } catch (err) {
    console.error(t('page.miningSite.getOrdersFailed'), err);
  } finally {
    orderLoading.value = false;
  }
};

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
    bind_type: row.bind_type || 'manual',
    order_id: Number(row.order_id || 0),
    board_bind_type: row.board_bind_type || 'manual',
    board_order_id: Number(row.board_order_id || 0)
  };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  getOrders(row.id);
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
  // console.log("editForm.value>>",editForm.value)
  if (editForm.value.bind_type === "auto" && !editForm.value.order_id) {
    message.error(t('page.miningSite.autoBindOrderRequired'));
    return;
  }
  if (editForm.value.board_bind_type === "auto" && !editForm.value.board_order_id) {
    message.error(t('page.miningSite.autoBindBoardOrderRequired'));
    return;
  }
  try {
    // TODO: 调用后端接口 updateSites(editForm.value)
    const {error} = await updateSites(editForm.value.id, editForm.value);
    if(error==null){
        message.success(t('page.miningSite.modifySuccess'));
        fetchData(); // 刷新表格
      }else{
        message.error(t('page.miningSite.modifyFailed') +error);
      }
  } catch (err) {
    message.error(t('page.miningSite.modifyFailed'));
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
      message.success(t('page.miningSite.modifySuccess'));
      fetchData();
    } else {
      message.error(t('page.miningSite.modifyFailed') + error);
    }
  } catch (err) {
    message.error(t('page.miningSite.modifyFailed'));
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
    // console.log("data.list",data.list)
    const salerMap_byId = data.list.reduce((acc:any, cur:any) => {
      acc[cur.id] = cur.real_name;
      return acc;
    }, {} as Record<number, string>);
    // console.log("salerMap_byId",salerMap_byId)
    salerMap.value = salerMap_byId;

    // editForm.value.saler_id = data[0].id;
  }else{
    message.error(t('page.miningSite.getUsersFailed') +error);
  }
}
// ---------------- 表格列 ----------------
const renderHeaderTitle = (text: string) => h('span', { class: 'text-xs font-medium text-gray-500' }, text)
const columns: DataTableColumns<Site> = [
  {
    title: () => renderHeaderTitle(t('page.miningSite.siteName')),
    key: 'name',
    width: 200,
    fixed: 'left',
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
                  cursor: 'pointer'
                },
                title: content,
                onClick: () => {
                  router.push(`/miningsite/${row.id}/info`);
                }
              },
              h('span', { class: 'text-sm text-gray-900 font-medium' }, content)
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
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.assetCount')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.totalHostedMachines'),
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
      ), width: 130,
    key: 'asset_count',
    sorter: (row1: Site, row2: Site) => (row1.asset_count || 0) - (row2.asset_count || 0),
    render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.asset_count.toLocaleString() || 0)
  },
  {
    title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:130px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.fault24hCount')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.fault24hCountTooltip'),
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
    width: 155, key: 'fault_count', sorter: (row1: Site, row2: Site) => (row1.fault_count || 0) - (row2.fault_count || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.fault_count)},
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.inLogistics')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.inLogisticsTooltip'),
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
      ), width: 130, key: 'in_logistics_count', sorter: (row1: Site, row2: Site) => (row1.in_logistics_count || 0) - (row2.in_logistics_count || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.in_logistics_count.toLocaleString() || 0) },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.pendingShelf')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.pendingShelfTooltip'),
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
      ), width: 160, key: 'wait_on_shelf_count', sorter: (row1: Site, row2: Site) => (row1.wait_on_shelf_count || 0) - (row2.wait_on_shelf_count || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.wait_on_shelf_count.toLocaleString() || 0) },
  // { title: '待上架', width: 120, key: 'wait_on_shelf_count',render: (row: Site) => row.wait_on_shelf_count.toLocaleString() || 0 },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:120px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.repairingCount')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.repairingCountTooltip'),
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
      ), width: 120, key: 'repairing', sorter: (row1: Site, row2: Site) => (row1.repairing || 0) - (row2.repairing || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.repairing.toLocaleString() || 0) },
  // { title: '在修数', width: 120, key: 'repairing',render: (row: Site) => row.repairing.toLocaleString() || 0 },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:180px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.onShelfWaitRepairCount')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.onShelfWaitRepairCountTooltip'),
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
      ), width: 215, key: 'on_shelf_wait_repair_count', sorter: (row1: Site, row2: Site) => (row1.on_shelf_wait_repair_count || 0) - (row2.on_shelf_wait_repair_count || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.on_shelf_wait_repair_count.toLocaleString() || 0) },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:6px;width:180px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.waitRepairCount')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.waitRepairCountTooltip'),
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
      ), width: 140, key: 'wait_repair_count', sorter: (row1: Site, row2: Site) => (row1.wait_repair_count || 0) - (row2.wait_repair_count || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, (row.wait_repair_count)?.toLocaleString?.() || '0') },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:120px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.waitRepairRate')),
          // h(
          //   NTooltip,
          //   { placement: 'top' },
          //   {
          //     default: () => t('page.miningSite.waitRepairRateTooltip'),
          //     trigger: () =>
          //       h(Icon, {
          //         icon: 'ant-design:question-circle-outlined',
          //         width: 14,
          //         height: 14,
          //         color: '#999',
          //         style: 'cursor:pointer;'
          //       })
          //   }
          // )
        ]
      ), width: 140, key: 'wait_repair_rate', sorter: (row1: Site, row2: Site) => (row1.wait_repair_rate || 0) - (row2.wait_repair_rate || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500', title: t('page.miningSite.waitRepairRateTooltip') }, `${Number(row.wait_repair_rate ?? 0).toFixed(2)}%`) },
  // { title: '待修率', width: 120, key: 'wait_repair_rate', render: (row: Site) => h('span', { title: '未下架+已下架+待处理 机器' }, `${Number(row.wait_repair_rate ?? 0).toFixed(2)}%`) },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.netFaultCount')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.netFaultCountTooltip'),
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
      ), width: 150, key: 'net_fault_count', sorter: (row1: Site, row2: Site) => ((row1.in_logistics_count||0)+(row1.wait_repair_count||0)+(row1.repairing||0)) - ((row2.in_logistics_count||0)+(row2.wait_repair_count||0)+(row2.repairing||0)), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, ((row.in_logistics_count||0)+(row.wait_repair_count||0)+(row.repairing||0)).toLocaleString?.() || String((row.in_logistics_count||0)+(row.wait_repair_count||0)+(row.repairing||0))) },
  { title: () =>
      h(
        'div',
        { style: 'display:flex; align-items:center; gap:4px;width:150px;' },
        [
          h('span', { class: 'text-xs font-medium text-gray-500' }, t('page.miningSite.scrappedCount')),
          h(
            NTooltip,
            { placement: 'top' },
            {
              default: () => t('page.miningSite.scrappedCountTooltip'),
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
      ), width: 160, key: 'scrapped_count', sorter: (row1: Site, row2: Site) => (row1.scrapped_count || 0) - (row2.scrapped_count || 0), render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.scrapped_count.toLocaleString() || 0) },
  // { title: '预报废数', key: 'scrapped_count',render: (row: Site) => row.scrapped_count.toLocaleString() || 0 },
   { title: () => renderHeaderTitle(t('page.miningSite.machineOrderBind')), width: 220, key: 'bind_type', render: (row: Site) => {
      const typeMap: Record<string, { text: string, type: 'success' | 'warning' | 'default' }> = {
          'auto': { text: t('page.miningSite.auto'), type: 'success' },
          'manual': { text: t('page.miningSite.manual'), type: 'warning' }
      };
      const type = row.bind_type || 'manual';
      const config = typeMap[type] || { text: type, type: 'default' };

      return h('div', { class: 'flex flex-col gap-1' }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h(NTag, { class: 'text-sm', type: config.type, size: 'small' }, () => config.text),
          // 如果需要展示绑定类型文本，可以在这里添加
        ]),
        row.order_no ? h('span', { class: 'text-xs text-gray-500' }, row.order_no) : null
      ]);
  }},
  { title: () => renderHeaderTitle(t('page.miningSite.boardOrderBind')), width: 220, key: 'board_bind_type', render: (row: Site) => {
      const typeMap: Record<string, { text: string, type: 'success' | 'warning' | 'default' }> = {
          'auto': { text: t('page.miningSite.auto'), type: 'success' },
          'manual': { text: t('page.miningSite.manual'), type: 'warning' }
      };
      const type = row.board_bind_type || 'manual';
      const config = typeMap[type] || { text: type, type: 'default' };

      return h('div', { class: 'flex flex-col gap-1' }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h(NTag, { class: 'text-sm', type: config.type, size: 'small' }, () => config.text),
        ]),
        row.board_order_no ? h('span', { class: 'text-xs text-gray-500' }, row.board_order_no) : null
      ]);
  }},

  { title: () => renderHeaderTitle(t('page.miningSite.repairStatus')), width: 120, key: 'site_status',render: (row: any ) => {
    const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
      0: 'default',
      1: 'success',
      2: 'primary',
      3: 'warning',
    };
    return h(NTag, { class: 'text-sm', type: tagMap[row.site_status] }, () => siteStatusRecord[row.site_status])
  } },
   ...(hasRole ? [{ title: () => renderHeaderTitle(t('page.miningSite.afterSalesSpecialist')), width: 120, key: 'saler_name', render: (row: Site) => h('span', { class: 'text-sm text-gray-500' }, row.saler_name || '') }] : []),
  {
    title: () => renderHeaderTitle(t('page.miningSite.operation')),
    key: 'actions',
    width: 180,
    fixed: 'right',
    align:'center',
    render: (row: Site) => {
      if(!hasRole && !isRead){
             return h(
        NButton,
        {
          ghost: true,
          size:'small',
          class: 'text-sm text-gray-500',
          style: 'color: #6b7280;',
          onClick: () => {
            handleOpenEditHistory(row)
            // router.push(`/sitereport?site_id=${row.id}`)
          }
        },
        { default: () => t('page.miningSite.editDailyReport') }
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
                  class: 'text-sm text-gray-500',
                  style: 'color: #6b7280;',
                  onClick: () => {
                    handleOpenEditHistory(row)
                  }
                },
                { default: () => t('page.miningSite.dailyReport') }
              ),
              h(
                NButton,
                {
                  ghost: true,
                  size:'small',
                  class: 'text-sm text-gray-500',
                  style: 'color: #6b7280;',
                  onClick: () => handleOpenEdit(row)
                },
                {
                  default: () => t('page.miningSite.edit'),
                }
              ),
              h(
                NButton,
                {
                  ghost: true,
                  size:'small',
                  class: 'text-sm text-gray-500',
                  style: 'color: #6b7280;',
                  onClick: () => {
                    router.push(`/miningsite/${row.id}/info`);
                  }
                },
                {
                  default: () => t('page.miningSite.view'),
                }
              )
            ]
          }
        )
      }
      // 已移除重复的 isAdmin 分支内容
      if (hasRole) {
        const actions = [];
        if (!isRead) {
          actions.push(h(
            NButton,
            {
              ghost: true,
              size: 'small',
              class: 'text-sm text-gray-500',
              style: "margin-right: 8px;color: #6b7280;",
              onClick: () => handleOpenEdit(row)
            },
            {
              default: () => t('page.miningSite.edit'),
            }
          ));
        }
        actions.push(h(
          NButton,
          {
            ghost: true,
            size: 'small',
            class: 'text-sm text-gray-500',
            style: 'color: #6b7280;',
            onClick: () => {
              router.push(`/miningsite/${row.id}/info`);
            }
          },
          {
            default: () => t('page.miningSite.view'),
          }
        ));
        return actions;
      }
    }
  }
];

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  loading.value = true;
  let onlyMySite = localStorage.getItem('onlyMySite') === 'true' ? -1 : 1
  // console.log("selectedSiteStatus.value",selectedSiteStatus.value)
  const params: any = {
    page: 1,
    page_size: -1,
    name: searchSerial.value || undefined,
    enable_all: onlyMySite,//1 全部，-1 我的
    saler_id: selectedSalerId.value || undefined,
    bind_type: bindTypeModel.value || undefined,
    border_bind_type: borderBindTypeModel.value || undefined,
    site_status: selectedSiteStatus.value===0 ? 0 : selectedSiteStatus.value || undefined
  };

  if (searchDate.value) {
    const startDate = new Date(searchDate.value);
    const endDate = new Date(searchDate.value);

    // 设置开始时间为当天的 00:00:00
    startDate.setHours(0, 0, 0, 0);
    // 设置结束时间为当天的 23:59:59
    endDate.setHours(23, 59, 59, 999);

    // Convert back to string with local timezone to prevent UTC offset shift
    // Or simpler, just append time to the selected string
    // params.datetime = `${searchDate.value}T00:00:00`;
    params.date_time = `${searchDate.value}`;
  }

  console.log("params",params)

  try {
    const {data,error} = await fetchSites(params);
    if(error==null){
        tableData.value = data.list;
    }else{
        message.error(t('page.miningSite.loadFailed') + error);
    }
  } catch (err) {
    message.error(t('page.miningSite.loadFailed') + err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData()
  fetchUsers();
});
watch([searchSerial, selectedSalerId, selectedSiteStatus, bindTypeModel, borderBindTypeModel, searchDate], () => {
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

const bindTypeOptions = [
  { label: t('page.miningSite.auto'), value: 'auto' },
  { label: t('page.miningSite.manual'), value: 'manual' }
]

const borderBindTypeOptions = [
  { label: t('page.miningSite.auto'), value: 'auto' },
  { label: t('page.miningSite.manual'), value: 'manual' }
]
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- 查询框 -->
     <div class="flex justify-between items-center" v-if="hasRole">
      <SearchBar
      v-model:date="searchDate"
      v-model:serial="searchSerial"
      v-model:salerId="selectedSalerId"
      v-model:siteStatus="selectedSiteStatus"
      v-model:bindType="bindTypeModel"
      v-model:borderBindType="borderBindTypeModel"
      :salerOptions="salerOptions"
      :siteStatusOptions="siteStatusOptions"
      :bindTypeOptions="bindTypeOptions"
      :borderBindTypeOptions="borderBindTypeOptions"
      @search="onSearch"
    />
    <div>
      <NSwitch v-model:value="onlyMySite" size="medium" @update:value="onOnlyMySiteChange"  style="margin-left:10px;"/>
    <span style="font-size: 12px; margin-left: 4px;">{{ $t('page.miningSite.mySite') }}</span>
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
    :loading="loading"
    />
    </div>

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" :title="$t('page.miningSite.editSiteInfo')">
      <NForm :model="editForm" label-width="100">
        <NFormItem :label="$t('page.miningSite.siteName')">
          <NInput v-model:value="editForm.name" disabled />
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.siteAddress')">
          <NInput v-model:value="editForm.address"  />
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.assetCount')">
          <NInputNumber v-model:value="editForm.asset_count" disabled />
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.siteStatus')">
          <n-checkbox-group v-model:value="siteStatusSelected">
            <n-space item-style="display: flex;">
              <n-checkbox :value="1" :label="$t('page.miningSite.resident')" />
              <n-checkbox :value="2" :label="$t('page.miningSite.mailRepair')" />
            </n-space>
          </n-checkbox-group>
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.afterSalesSpecialist')">
          <NSelect v-model:value="editForm.saler_id" :options="salerOptions" />
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.autoBindMachineOrder')">
          <NSwitch v-model:value="editForm.bind_type" :checked-value="'auto'" :unchecked-value="'manual'" />
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.orderNumber')" :required="editForm.bind_type === 'auto'">
          <NSelect
            v-model:value="editForm.order_id"
            :options="orderOptions"
            :loading="orderLoading"
            :placeholder="$t('page.miningSite.selectOrderAutoBindRequired')"
            clearable
            filterable
          />
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.autoBindBoardOrder')">
          <NSwitch v-model:value="editForm.board_bind_type" :checked-value="'auto'" :unchecked-value="'manual'" />
        </NFormItem>
        <NFormItem :label="$t('page.miningSite.boardOrderNumber')" :required="editForm.board_bind_type === 'auto'">
          <NSelect
            v-model:value="editForm.board_order_id"
            :options="orderOptions"
            :loading="orderLoading"
            :placeholder="$t('page.miningSite.selectBoardOrderAutoBindRequired')"
            clearable
            filterable
          />
        </NFormItem>


      </NForm>
      <template #footer>
        <NSpace :size="12">
          <NButton class="min-w-96px" type="primary" size="medium" @click="handleSaveEdit">{{ $t('page.miningSite.save') }}</NButton>
          <NButton class="min-w-96px" size="medium" @click="showEditModal = false">{{ $t('page.miningSite.cancel') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 新增：在架待修数编辑弹框 -->
    <NModal v-model:show="showEditHistoryModal" style="width: 500px" preset="card" :title="$t('page.miningSite.modifyOnShelfWaitRepairCount')">
      <NForm :model="siteHistoryForm" label-width="180">
        <NFormItem :label="$t('page.miningSite.onShelfWaitRepairCount')">
          <NInputNumber v-model:value="siteHistoryForm.on_shelf_wait_repair_count" :min="0" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="12">
          <NButton class="min-w-96px" type="primary" size="medium" @click="handleSaveEditHistory">{{ $t('page.miningSite.save') }}</NButton>
          <NButton class="min-w-96px" size="medium" @click="showEditHistoryModal = false">{{ $t('page.miningSite.cancel') }}</NButton>
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
