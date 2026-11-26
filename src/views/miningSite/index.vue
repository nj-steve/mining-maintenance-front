<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { refDebounced, useMediaQuery } from '@vueuse/core';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { NDataTable, useMessage, NButton, NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NSpace, NTooltip, NSwitch, NCheckbox, NCheckboxGroup, NEmpty } from 'naive-ui';
import type { DataTableColumns, PaginationProps, TagProps } from 'naive-ui';
import ReportIcon from '~icons/ant-design/dashboard-outlined';
import AssetIcon from '~icons/ant-design/hdd-outlined';
import OffShelfIcon from '~icons/ant-design/arrow-down-outlined';
import OnShelfIcon from '~icons/ant-design/arrow-up-outlined';
import RepairIcon from '~icons/ant-design/tool-outlined';
import RefreshIcon from '~icons/ant-design/reload-outlined';
import InfoIcon from '~icons/ant-design/info-circle-outlined';
import SiteLinkIcon from '~icons/ant-design/right-outlined';
import { useAuthStore } from '@/store/modules/auth';
import { fetchSites, updateSites, fetchUser, UpdateSiteHistory, fetchOrders } from '@/service/api';
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
  repair_finished_count: number;
  fault_count: number;
  abnormal_count?: number;
  scrapped_count: number;
  today_shelf_count?: number;
  wait_repair_count: number;
  wait_repair_rate: number;
  is_onsite_default?: number;
  wait_on_shelf_count: number;
  wait_warehouse_count?: number;
  on_shelf_wait_repair_count: number;
  bind_type?: string;
  order_id?: string | number;
  order_no?: string;
  board_bind_type?: string;
  board_order_id?: string | number;
  board_order_no?: string;
  status?: string;
}

const message = useMessage();
const router = useRouter();
const { t, locale } = useI18n();
const narrowLayout = useMediaQuery('(max-width: 760px)');

const tableData = ref<Site[]>([]);
const loading = ref(true);
const loadFailed = ref(false);
const searchSerial = ref<string>('');
const siteNameFilter = refDebounced(searchSerial, 250);
const selectedSalerId = ref<number | null>(null);
const selectedSiteStatus = ref<number | null>(null);
const bindTypeModel = ref<string | null>(null);
const searchDate = ref<string | null>(null);
const statusModel = ref<string>('active');
const onlyMySite = ref(localStorage.getItem('onlyMySite') === 'true');

const summaryMetrics = [
  { key: 'asset_count', label: 'assetCount', icon: AssetIcon, tone: 'asset' },
  { key: 'fault_count', label: 'offShelfCount', icon: OffShelfIcon, tone: 'off-shelf' },
  { key: 'today_shelf_count', label: 'onShelfCount', icon: OnShelfIcon, tone: 'on-shelf' },
  { key: 'repairing', label: 'repairingCount', icon: RepairIcon, tone: 'repair' }
] as const;
const reportTotals = computed(() => tableData.value.reduce((totals, site) => {
  for (const { key } of summaryMetrics) totals[key] += Number(site[key]) || 0;
  return totals;
}, { asset_count: 0, fault_count: 0, today_shelf_count: 0, repairing: 0 }));
const numberFormatter = computed(() => new Intl.NumberFormat(locale.value));

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
type CountKey = 'asset_count' | 'fault_count' | 'today_shelf_count' | 'repairing' | 'wait_repair_count'
  | 'in_logistics_count' | 'repair_finished_count' | 'wait_on_shelf_count' | 'wait_warehouse_count'
  | 'abnormal_count' | 'scrapped_count';

const renderHeaderTitle = (label: string) => h('span', { class: 'report-column-heading' }, label);
const metricHeading = (label: string, hint: string) => h('span', { class: 'report-metric-heading' }, [
  renderHeaderTitle(t(`page.miningSite.${label}`)),
  h(NTooltip, { placement: 'top' }, {
    trigger: () => h('span', { class: 'report-column-info', 'aria-label': t(`page.miningSite.${hint}`), tabindex: 0 }, [h(InfoIcon)]),
    default: () => t(`page.miningSite.${hint}`)
  })
]);

function renderCount(count: number, tone?: string) {
  return h('span', {
    class: ['report-count', count === 0 ? 'report-count--zero' : count < 0 ? 'report-count--negative' : tone && `report-count--${tone}`]
  }, numberFormatter.value.format(count));
}

function countColumn(key: CountKey, label: string, hint: string, width: number, tone?: string): DataTableColumns<Site>[number] {
  return {
    title: () => metricHeading(label, hint),
    key,
    width,
    align: 'right',
    sorter: (a, b) => Number(a[key] ?? 0) - Number(b[key] ?? 0),
    render: row => renderCount(Number(row[key] ?? 0), tone)
  };
}

const openSite = (row: Site) => router.push(`/miningsite/${row.id}/info`);
const netFaultCount = (row: Site) => (row.in_logistics_count || 0) + (row.wait_repair_count || 0) + (row.repairing || 0);
const siteStatusTones: Record<string, TagProps['type']> = {
  active: 'success', inactive: 'default', remove: 'error', pendingRemoval: 'warning', rental: 'info'
};
const repairStatusTones: Record<string, TagProps['type']> = {
  0: 'default', 1: 'success', 2: 'primary', 3: 'warning', pendingRemoval: 'warning', rental: 'info'
};

function renderOrderBinding(type: string | undefined, orderNumber?: string) {
  const binding = type || 'manual';
  const label = binding === 'auto' || binding === 'manual' ? t(`page.miningSite.${binding}`) : binding;
  return h('div', { class: 'report-binding' }, [
    h(NTag, { type: binding === 'auto' ? 'info' : 'default', size: 'small', bordered: false, round: true }, () => label),
    orderNumber ? h('span', { class: 'report-binding-number', title: orderNumber }, orderNumber) : null
  ]);
}

function renderRowActions(row: Site) {
  const action = (label: 'editDailyReport' | 'dailyReport' | 'edit' | 'view', handler: () => void) =>
    h(NButton, { text: true, size: 'small', type: label === 'view' ? 'primary' : 'default', onClick: handler }, () => t(`page.miningSite.${label}`));

  if (!hasRole && !isRead) return action('editDailyReport', () => handleOpenEditHistory(row));

  return h('div', { class: 'report-row-actions' }, [
    isAdmin ? action('dailyReport', () => handleOpenEditHistory(row)) : null,
    hasRole && !isRead ? action('edit', () => handleOpenEdit(row)) : null,
    hasRole ? action('view', () => openSite(row)) : null
  ]);
}

const columns = computed<DataTableColumns<Site>>(() => [
  {
    title: () => renderHeaderTitle(t('page.miningSite.siteName')),
    key: 'name',
    width: narrowLayout.value ? 146 : 200,
    fixed: narrowLayout.value ? undefined : 'left',
    render: row => h('button', {
      type: 'button',
      class: 'report-site-link',
      title: row.name,
      onClick: () => openSite(row)
    }, [h('span', row.name), h(SiteLinkIcon, { 'aria-hidden': 'true' })])
  },
  countColumn('asset_count', 'assetCount', 'totalHostedMachines', narrowLayout.value ? 96 : 110),
  /*{
    title: () => renderHeaderTitle(t('page.miningSite.expectedAssetCount')),
    key: 'yuqi_asset_count',
    width: 130,
    sorter: (row1: any, row2: any) => (row1.yuqi_asset_count || 0) - (row2.yuqi_asset_count || 0),
    render: (row: any) => h('span', { class: 'text-sm text-gray-500' }, row.yuqi_asset_count?.toLocaleString() || 0)
  },
  {
    title: () => renderHeaderTitle(t('page.miningSite.expectedHashrate')),
    key: 'yuqi_hashrate_th',
    width: 130,
    sorter: (row1: any, row2: any) => (row1.yuqi_hashrate_th || 0) - (row2.yuqi_hashrate_th || 0),
    render: (row: any) => {
      let val = Number(row.yuqi_hashrate_th || 0);
      let unit = 'TH/s';
      if (val >= 1000000) {
        val = val / 1000000;
        unit = 'EH/s';
      } else if (val >= 1000) {
        val = val / 1000;
        unit = 'PH/s';
      }
      // 保留两位小数并去掉末尾无用的 0
      const formattedVal = Number(val.toFixed(2)).toLocaleString();
      return h('span', { class: 'text-sm text-gray-500' }, `${formattedVal} ${unit}`);
    }
  },*/
  countColumn('fault_count', 'offShelfCount', 'offShelfCountHint', narrowLayout.value ? 96 : 108, 'off-shelf'),
  countColumn('today_shelf_count', 'onShelfCount', 'onShelfCountHint', 108, 'on-shelf'),
  countColumn('repairing', 'repairingCount', 'repairingCountTooltip', 108, 'repair'),
  countColumn('wait_repair_count', 'waitRepairCount', 'waitRepairCountTooltip', 108),
  countColumn('in_logistics_count', 'inLogistics', 'inLogisticsTooltip', 118),
  countColumn('repair_finished_count', 'repairFinishedCount', 'repairFinishedCountTooltip', 124),
  countColumn('wait_on_shelf_count', 'pendingShelf', 'pendingShelfTooltip', 134),
  countColumn('wait_warehouse_count', 'waitWarehouseCount', 'waitWarehouseCountTooltip', 124),
  {
    title: () => metricHeading('waitRepairRate', 'waitRepairRateTooltip'),
    key: 'wait_repair_rate',
    width: 138,
    align: 'right',
    sorter: (a, b) => (a.wait_repair_rate || 0) - (b.wait_repair_rate || 0),
    render: row => h('span', { class: 'report-count' }, `${Number(row.wait_repair_rate ?? 0).toFixed(2)}%`)
  },
  {
    title: () => metricHeading('netFaultCount', 'netFaultCountTooltip'),
    key: 'net_fault_count',
    width: 132,
    align: 'right',
    sorter: (a, b) => netFaultCount(a) - netFaultCount(b),
    render: row => renderCount(netFaultCount(row))
  },
  countColumn('abnormal_count', 'abnormalCount', 'abnormalCountTooltip', 132),
  countColumn('scrapped_count', 'scrappedCount', 'scrappedCountTooltip', 136),
  {
    title: () => renderHeaderTitle(t('page.miningSite.machineOrderBind')),
    width: 172,
    key: 'bind_type',
    render: row => renderOrderBinding(row.bind_type, row.order_no)
  },
  {
    title: () => renderHeaderTitle(t('page.miningSite.boardOrderBind')),
    width: 172,
    key: 'board_bind_type',
    render: row => renderOrderBinding(row.board_bind_type, row.board_order_no)
  },
  {
    title: () => renderHeaderTitle(t('page.miningSite.statusLabel')),
    width: 112,
    key: 'status',
    render: row => {
      const status = row.status || '';
      if (!status) return '—';
      const known = Object.hasOwn(siteStatusTones, status);
      return h(NTag, { type: known ? siteStatusTones[status] : 'default', size: 'small', bordered: false, round: true },
        () => known ? t(`page.miningSite.status.${status}`) : status);
    }
  },
  {
    title: () => renderHeaderTitle(t('page.miningSite.repairStatus')),
    width: 132,
    key: 'site_status',
    render: row => {
      const key = String(row.site_status);
      return h(NTag, { type: repairStatusTones[key] ?? 'default', size: 'small', bordered: false, round: true },
        () => siteStatusRecord[key] ?? key);
    }
  },
  ...(hasRole ? [{
    title: () => renderHeaderTitle(t('page.miningSite.afterSalesSpecialist')),
    width: 150,
    key: 'saler_name',
    render: (row: Site) => h('span', { class: 'report-meta' }, row.saler_name || '—')
  }] : []),
  {
    title: () => renderHeaderTitle(t('page.miningSite.operation')),
    key: 'actions',
    width: 154,
    fixed: narrowLayout.value ? undefined : 'right',
    align: 'center',
    render: renderRowActions
  }
]);
const tableWidth = computed(() => columns.value.reduce((width, column) => width + Number(column.width || 0), 0));

// ---------------- 数据获取 ----------------
let latestRequest = 0;
const fetchData = async () => {
  const request = ++latestRequest;
  loading.value = true;
  loadFailed.value = false;
  const params = {
    page: 1,
    page_size: -1,
    name: siteNameFilter.value.trim() || undefined,
    enable_all: onlyMySite.value ? -1 : 1,
    saler_id: selectedSalerId.value || undefined,
    bind_type: bindTypeModel.value || undefined,
    site_status: selectedSiteStatus.value ?? undefined,
    status: statusModel.value || undefined,
    date_time: searchDate.value || undefined
  };

  try {
    const { data, error } = await fetchSites(params);
    if (request !== latestRequest) return;
    if (error) {
      loadFailed.value = true;
      tableData.value = [];
      message.error(t('page.miningSite.loadFailed') + error);
    } else {
      tableData.value = data?.list ?? [];
    }
  } catch (err) {
    if (request === latestRequest) {
      loadFailed.value = true;
      tableData.value = [];
      message.error(t('page.miningSite.loadFailed') + err);
    }
  } finally {
    if (request === latestRequest) loading.value = false;
  }
};

onMounted(() => {
  fetchData()
  fetchUsers();
});
watch([siteNameFilter, selectedSalerId, selectedSiteStatus, bindTypeModel, searchDate, statusModel, onlyMySite], () => {
  pagination.value.page = 1;
  void fetchData();
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
watch(onlyMySite, value => localStorage.setItem('onlyMySite', String(value)));
const bindTypeOptions = computed(() => [
  { label: t('page.miningSite.auto'), value: 'auto' },
  { label: t('page.miningSite.manual'), value: 'manual' }
]);
</script>

<template>
  <div class="daily-report">
    <header class="report-heading">
      <div class="report-heading-main">
        <div class="report-heading-icon" aria-hidden="true"><ReportIcon /></div>
        <h1>{{ t('route.miningsite') }}</h1>
      </div>
      <NButton class="report-refresh" size="small" :loading="loading" @click="fetchData">
        <template #icon><RefreshIcon aria-hidden="true" /></template>
        {{ t('common.refresh') }}
      </NButton>
    </header>

    <section v-if="hasRole" class="report-filter-panel">
      <SearchBar
        v-model:date="searchDate"
        v-model:serial="searchSerial"
        v-model:saler-id="selectedSalerId"
        v-model:site-status="selectedSiteStatus"
        v-model:bind-type="bindTypeModel"
        v-model:status="statusModel"
        :saler-options="salerOptions"
        :site-status-options="siteStatusOptions"
        :bind-type-options="bindTypeOptions"
      >
        <template #scope>
          <label class="report-my-sites">
            <NSwitch v-model:value="onlyMySite" size="small" :aria-label="t('page.miningSite.mySite')" />
            <span>{{ t('page.miningSite.mySite') }}</span>
          </label>
        </template>
      </SearchBar>
    </section>

    <section class="report-overview" :aria-label="t('page.miningSite.filteredSummary')" :aria-busy="loading">
      <div v-for="metric in summaryMetrics" :key="metric.key" class="report-stat" :class="`report-stat--${metric.tone}`">
        <div class="report-stat-icon" aria-hidden="true"><component :is="metric.icon" /></div>
        <div class="report-stat-content">
          <div class="report-stat-label">{{ t(`page.miningSite.${metric.label}`) }}</div>
          <div class="report-stat-value">{{ loading || loadFailed ? '—' : numberFormatter.format(reportTotals[metric.key]) }}</div>
        </div>
      </div>
    </section>

    <section class="report-table-panel" :aria-label="t('route.miningsite')">
      <NDataTable
        class="report-table"
        flex-height
        size="small"
        :scroll-x="tableWidth"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :row-key="row => row.id"
        :loading="loading"
      >
        <template v-if="!loading" #empty>
          <NEmpty :description="loadFailed ? t('page.miningSite.reportUnavailable') : t('page.miningSite.noReports')">
            <template v-if="loadFailed" #extra>
              <NButton size="small" @click="fetchData">{{ t('common.refresh') }}</NButton>
            </template>
          </NEmpty>
        </template>
      </NDataTable>
    </section>

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: min(600px, calc(100vw - 32px))" preset="card" :title="$t('page.miningSite.editSiteInfo')">
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
    <NModal v-model:show="showEditHistoryModal" style="width: min(500px, calc(100vw - 32px))" preset="card" :title="$t('page.miningSite.modifyOnShelfWaitRepairCount')">
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

<style scoped>
.daily-report {
  --report-panel: #fff;
  --report-tint: #f4f8fc;
  --report-border: #dce6f1;
  --report-text: #172d45;
  --report-secondary: #506680;
  --report-muted: #72849a;
  --report-blue: #205fb7;
  --report-blue-bg: #e9f2ff;
  --report-orange: #a64c15;
  --report-orange-bg: #fff2e8;
  --report-teal: #08796b;
  --report-teal-bg: #e4f6ef;
  --report-repair: #5b50a7;
  --report-repair-bg: #f0edff;
  --report-danger: #b43840;
  display: flex;
  flex-direction: column;
  min-height: 560px;
  gap: 12px;
  overflow: hidden;
}

:global(.dark) .daily-report {
  --report-panel: #171f2b;
  --report-tint: #1c2938;
  --report-border: #2c3c50;
  --report-text: #e6edf6;
  --report-secondary: #aabbd0;
  --report-muted: #93a7be;
  --report-blue: #83b9ff;
  --report-blue-bg: #223a56;
  --report-orange: #ffaf75;
  --report-orange-bg: #442d20;
  --report-teal: #72ddc6;
  --report-teal-bg: #1d3b38;
  --report-repair: #c1b5ff;
  --report-repair-bg: #342d53;
  --report-danger: #ff9ba4;
}

.report-heading,
.report-filter-panel,
.report-stat,
.report-table-panel {
  border: 1px solid var(--report-border);
  border-radius: 10px;
  background: var(--report-panel);
}

.report-heading {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  background: linear-gradient(100deg, var(--report-tint), var(--report-panel) 70%);
}

.report-heading-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.report-heading h1 {
  margin: 0;
  color: var(--report-text);
  font-size: clamp(20px, 2vw, 24px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.report-heading-icon,
.report-stat-icon {
  display: grid;
  flex: none;
  place-items: center;
  color: var(--metric-ink, var(--report-blue));
  background: var(--metric-bg, var(--report-blue-bg));
}

.report-heading-icon { width: 36px; height: 36px; border-radius: 8px; font-size: 20px; }
.report-refresh { flex: none; border-radius: 7px; }
.report-filter-panel { flex-shrink: 0; padding: 11px 15px; }
.report-my-sites { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }

.report-overview {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.report-stat {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding: 12px 14px;
}

.report-stat--off-shelf { --metric-ink: var(--report-orange); --metric-bg: var(--report-orange-bg); }
.report-stat--on-shelf { --metric-ink: var(--report-teal); --metric-bg: var(--report-teal-bg); }
.report-stat--repair { --metric-ink: var(--report-repair); --metric-bg: var(--report-repair-bg); }
.report-stat-icon { width: 34px; height: 34px; border-radius: 8px; font-size: 17px; }
.report-stat-content { min-width: 0; }
.report-stat-label { color: var(--report-secondary); font-size: 12px; line-height: 17px; }

.report-stat-value {
  margin-top: 2px;
  color: var(--report-text);
  font-size: clamp(19px, 2.2vw, 26px);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.12;
}

.report-table-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 300px;
  overflow: hidden;
}

.report-table { flex: 1; min-height: 0; }
.report-table :deep(.n-data-table-th) { background: var(--report-tint); }
.report-table :deep(.n-data-table__pagination) {
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0;
  padding: 9px 12px;
  border-top: 1px solid var(--report-border);
}

.report-table :deep(.report-column-heading) { color: var(--report-secondary); font-weight: 650; }
.report-table :deep(.report-metric-heading) { display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; }
.report-table :deep(.report-column-info) { display: inline-flex; flex: none; color: var(--report-muted); font-size: 12px; }
.report-table :deep(.report-count) { color: var(--report-text); font-variant-numeric: tabular-nums; font-weight: 600; }
.report-table :deep(.report-count--zero), .report-table :deep(.report-meta) { color: var(--report-muted); font-weight: 400; }
.report-table :deep(.report-count--negative) { color: var(--report-danger); }
.report-table :deep(.report-count--off-shelf) { color: var(--report-orange); }
.report-table :deep(.report-count--on-shelf) { color: var(--report-teal); }
.report-table :deep(.report-count--repair) { color: var(--report-repair); }

.report-table :deep(.report-site-link) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  color: var(--report-text);
  background: none;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
}

.report-table :deep(.report-site-link:hover), .report-table :deep(.report-site-link:focus-visible) { color: var(--report-blue); }
.report-table :deep(.report-site-link span), .report-table :deep(.report-binding-number) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.report-table :deep(.report-site-link svg) { flex: none; color: var(--report-muted); font-size: 10px; }
.report-table :deep(.report-binding) { display: flex; align-items: center; gap: 6px; min-width: 0; }
.report-table :deep(.report-binding-number) { color: var(--report-secondary); font-size: 12px; }
.report-table :deep(.report-row-actions) { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px 9px; }

@media (max-width: 760px) {
  .daily-report { min-height: 0; overflow: visible; }
  .report-heading { padding: 10px 12px; }
  .report-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .report-stat { padding: 9px 10px; gap: 7px; }
  .report-stat-icon { width: 29px; height: 29px; font-size: 15px; }
  .report-filter-panel { padding: 10px 12px; }
  .report-table-panel { flex: none; height: 470px; }
}
</style>
