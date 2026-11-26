<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue';
import { refDebounced, useMediaQuery } from '@vueuse/core';
import { NButton, NDataTable, NInput, NTag, useDialog, useMessage, useThemeVars } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import StationIcon from '~icons/ant-design/shop-outlined';
import SearchIcon from '~icons/ant-design/search-outlined';
import RefreshIcon from '~icons/ant-design/reload-outlined';
import AddIcon from '~icons/ant-design/plus-outlined';
import AddRepairStationModal from '@/components/custom/AddRepairStationModal.vue';
import EditRepairStationModal from '@/components/custom/EditRepairStationModal.vue';
import ManagementStatusSummary from '@/components/custom/ManagementStatusSummary.vue';
import { repairStationKycStatuses } from '@/constants/repair-station';
import { deleteRepairStation, fetchRepairStations } from '@/service/api/repair';
import { useAuthStore } from '@/store/modules/auth';

interface CompanyInfo {
  ID: number;
  Name: string;
  Address: string;
  LegalRepresentative: string;
  KYCStatus: number;
  ContactName: string;
  ContactPhone: string;
  Score: number;
  CreatedAt: string;
  UpdatedAt: string;
}

const { t } = useI18n();
const authStore = useAuthStore();
const isRead = computed(() => authStore.userInfo.roles.includes('5'));
const narrowLayout = useMediaQuery('(max-width: 760px)');
const theme = useThemeVars();
const themeStyle = computed(() => ({
  '--management-surface': theme.value.cardColor,
  '--management-line': theme.value.dividerColor,
  '--management-ink': theme.value.textColor1,
  '--management-muted': theme.value.textColor2,
  '--management-accent': theme.value.primaryColor
}));

const dialog = useDialog();
const message = useMessage();
const tableData = ref<CompanyInfo[]>([]);
const matchingCount = ref<number>();
const loading = ref(true);
const searchText = ref('');
const searchFilter = refDebounced(searchText, 250);
const showAddModal = ref(false);
const showEditModal = ref(false);
const currentEditData = ref<CompanyInfo | null>(null);

const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: ({ itemCount }) => t('page.repairStation.paginationPrefix', { count: itemCount ?? 0 }),
  onChange(page) {
    pagination.value.page = page;
    void fetchData();
  },
  onUpdatePageSize(pageSize) {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    void fetchData();
  }
});

const statusSummary = computed(() => {
  const statuses = repairStationKycStatuses.map(status => ({
    label: t(`page.repairStation.${status.label}`),
    count: tableData.value.filter(row => row.KYCStatus === status.value).length,
    tone: String(status.tone)
  }));
  const unknown = tableData.value.length - statuses.reduce((sum, status) => sum + status.count, 0);
  if (unknown) statuses.push({ label: t('page.repairStation.unknownStatus'), count: unknown, tone: '#68758a' });
  return statuses;
});

function openEdit(row: CompanyInfo) {
  currentEditData.value = { ...row };
  showEditModal.value = true;
}

function confirmDelete(row: CompanyInfo) {
  dialog.warning({
    title: t('page.repairStation.confirmDeleteTitle'),
    content: t('page.repairStation.confirmDeleteContent', { name: row.Name }),
    positiveText: t('page.repairStation.confirm'),
    negativeText: t('page.repairStation.cancel'),
    onPositiveClick: async () => {
      try {
        const { error } = await deleteRepairStation(row.ID);
        if (error) {
          message.error(t('page.repairStation.deleteFailed'));
          return;
        }
        message.success(t('page.repairStation.deleteSuccess'));
        const page = pagination.value.page ?? 1;
        if (tableData.value.length === 1 && page > 1) pagination.value.page = page - 1;
        void fetchData();
      } catch {
        message.error(t('page.repairStation.deleteFailed'));
      }
    }
  });
}

const header = (text: string) => h('span', { class: 'management-column-title' }, text);
const fields = [
  { title: 'contactName', key: 'ContactName', width: 128 },
  { title: 'contactPhone', key: 'ContactPhone', width: 156 },
  { title: 'legalRepresentative', key: 'LegalRepresentative', width: 156 },
  { title: 'address', key: 'Address', width: 260 }
] as const;

const columns = computed<DataTableColumns<CompanyInfo>>(() => {
  const result: DataTableColumns<CompanyInfo> = [
    {
      title: () => header(t('page.repairStation.stationName')),
      key: 'Name',
      width: narrowLayout.value ? 154 : 210,
      ellipsis: { tooltip: true },
      render: row => h('span', { class: 'management-entity-name' }, row.Name || '—')
    },
    {
      title: () => header(t('page.repairStation.kycStatus')),
      key: 'KYCStatus',
      width: narrowLayout.value ? 120 : 155,
      render: row => {
        const status = repairStationKycStatuses.find(item => item.value === row.KYCStatus);
        return h(NTag, { type: status?.type ?? 'default', class: 'management-status-tag', size: 'small', round: true, bordered: false }, () =>
          status ? t(`page.repairStation.${status.label}`) : t('page.repairStation.unknownStatus'));
      }
    },
    ...fields.map(field => ({
      title: () => header(t(`page.repairStation.${field.title}`)),
      key: field.key,
      width: field.width,
      ellipsis: { tooltip: true },
      render: (row: CompanyInfo) => h('span', { class: 'management-contact' }, row[field.key] || '—')
    }))
  ];
  if (!isRead.value) {
    result.push({
      title: () => header(t('page.repairStation.actions')),
      key: 'actions',
      align: 'center',
      fixed: narrowLayout.value ? undefined : 'right',
      width: 120,
      render: row => h('div', { class: 'management-row-actions' }, [
        h(NButton, { type: 'primary', quaternary: true, size: 'small', onClick: () => openEdit(row) }, () => t('page.repairStation.edit')),
        h(NButton, { type: 'error', quaternary: true, size: 'small', onClick: () => confirmDelete(row) }, () => t('page.repairStation.delete'))
      ])
    });
  }
  return result;
});
const tableWidth = computed(() => columns.value.reduce((sum, column) => sum + Number(column.width ?? 0), 0));

let latestRequest = 0;
async function fetchData() {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const { data, error } = await fetchRepairStations({
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      filter: searchFilter.value.trim() || undefined
    });
    if (request !== latestRequest) return;
    if (error || !data) throw error;
    tableData.value = data.list ?? [];
    matchingCount.value = Number(data.pagination.total) || 0;
    pagination.value.itemCount = matchingCount.value;
    pagination.value.page = data.pagination.page;
    pagination.value.pageSize = data.pagination.page_size;
  } catch (error) {
    if (request !== latestRequest) return;
    tableData.value = [];
    matchingCount.value = undefined;
    pagination.value.itemCount = 0;
    message.error(t('page.repairStation.loadFailed', { error }));
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

onMounted(fetchData);
watch(searchFilter, () => {
  pagination.value.page = 1;
  void fetchData();
});
</script>

<template>
  <div class="management-page station-page" :style="themeStyle">
    <header class="management-heading">
      <div class="management-heading__title">
        <span class="management-heading__icon" aria-hidden="true"><StationIcon /></span>
        <h1>{{ t('page.repairStation.overviewTitle') }}</h1>
      </div>
      <div class="management-heading__actions">
        <NButton size="small" :loading="loading" @click="fetchData">
          <template #icon><RefreshIcon /></template>
          {{ t('common.refresh') }}
        </NButton>
        <NButton v-if="!isRead" size="small" type="primary" secondary @click="showAddModal = true">
          <template #icon><AddIcon /></template>
          {{ t('page.repairStation.addStation') }}
        </NButton>
      </div>
    </header>

    <ManagementStatusSummary
      :total="matchingCount"
      :total-label="t('page.repairStation.matchingStations')"
      :status-label="t('page.repairStation.currentPageStatus')"
      :statuses="statusSummary"
      :loading="loading"
    />

    <div class="management-filters">
      <NInput
        v-model:value="searchText"
        class="management-search"
        size="small"
        clearable
        :placeholder="t('page.repairStation.searchPlaceholder')"
        :input-props="{ 'aria-label': t('page.repairStation.searchPlaceholder') }"
      >
        <template #prefix><SearchIcon /></template>
      </NInput>
    </div>

    <section class="management-table-panel" :aria-label="t('page.repairStation.overviewTitle')">
      <NDataTable
        class="management-table"
        flex-height
        remote
        size="small"
        :bordered="false"
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="tableWidth"
        :row-key="(row: CompanyInfo) => row.ID"
      />
    </section>

    <AddRepairStationModal v-if="!isRead" v-model:show="showAddModal" @success="fetchData" />
    <EditRepairStationModal v-if="!isRead" v-model:show="showEditModal" :edit-data="currentEditData" @success="fetchData" />
  </div>
</template>

<style src="@/styles/css/management-list.css"></style>
