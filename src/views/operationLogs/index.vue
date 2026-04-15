<script setup lang="ts">
import { ref, onMounted, h, reactive, computed } from 'vue';
import { NDataTable, useMessage, NCard, NTooltip, NSpace, NSelect, NButton, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchOperationLogs, fetchUser } from '@/service/api';
import type { OperationLog } from '@/service/api/log';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const message = useMessage();
const loading = ref(false);
const tableData = ref<OperationLog[]>([]);

const searchParams = reactive({
  user_id: null as number | null,
  status: null as number | null,
  module: null as string | null,
  operation_type: null as string | null
});

const userOptions = ref<{ label: string; value: number }[]>([]);

const statusOptions = computed(() => [
  { label: t('page.operationLogs.status.success'), value: 1 },
  { label: t('page.operationLogs.status.fail'), value: 0 }
]);

const moduleOptions = computed(() => [
  { label: t('page.operationLogs.modules.site'), value: '场地' },
  { label: t('page.operationLogs.modules.faultMachine'), value: '故障机' },
  { label: t('page.operationLogs.modules.workOrder'), value: '工单' },
  { label: t('page.operationLogs.modules.scrapMachine'), value: '报废机' },
  { label: t('page.operationLogs.modules.repairDetail'), value: '维修明细' }
]);

const operationTypeOptions = computed(() => [
  { label: t('page.operationLogs.operationTypes.create'), value: 'create' },
  { label: t('page.operationLogs.operationTypes.update'), value: 'update' },
  { label: t('page.operationLogs.operationTypes.delete'), value: 'delete' },
  { label: t('page.operationLogs.operationTypes.dispatch'), value: 'dispatch' },
  { label: t('page.operationLogs.operationTypes.import'), value: 'import' },
  { label: t('page.operationLogs.operationTypes.bindOrder'), value: 'bind_order' },
  { label: t('page.operationLogs.operationTypes.unbindOrder'), value: 'unbind_order' }
]);

const fetchUserList = async () => {
  try {
    const { data, error } = await fetchUser({ page: 1, page_size: 1000, status: 1 });
    if (!error && data?.list) {
      userOptions.value = data.list.map((user: any) => ({
        label: user.real_name || user.user_name,
        value: user.id
      }));
    }
  } catch (err) {
    console.error('Fetch users error:', err);
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  fetchData();
};

const handleReset = () => {
  searchParams.user_id = null;
  searchParams.status = null;
  searchParams.module = null;
  searchParams.operation_type = null;
  handleSearch();
};

onMounted(() => {
  fetchUserList();
  fetchData();
});

const renderTooltip = (content: string) => {
  if (!content) return '-';
  const trigger = h(
    'div',
    {
      style: {
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'pointer'
      }
    },
    content
  );
  return h(
    NTooltip,
    {
      trigger: 'hover',
      style: { maxWidth: '500px' }
    },
    {
      trigger: () => trigger,
      default: () => h('div', { style: { maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' } }, content)
    }
  );
};

const columns = computed<DataTableColumns<OperationLog>>(() => [
  { title: t('page.operationLogs.columns.id'), key: 'id', width: 80 },

  { title: t('page.operationLogs.columns.username'), key: 'user_name', width: 100 },
  { title: t('page.operationLogs.columns.module'), key: 'module', width: 100 },
  { title: t('page.operationLogs.columns.operationType'), key: 'operation_type', width: 100 },
  { title: t('page.operationLogs.columns.targetTable'), key: 'target_table', width: 120 },
  { title: t('page.operationLogs.columns.targetId'), key: 'target_id', width: 80, render: (row) => renderTooltip(row.target_id) },
  { title: t('page.operationLogs.columns.requestMethod'), key: 'request_method', width: 100 },
  { title: t('page.operationLogs.columns.requestUrl'), key: 'request_url', width: 200, render: (row) => renderTooltip(row.request_url) },
  { title: t('page.operationLogs.columns.requestParams'), key: 'request_params', width: 200, render: (row) => renderTooltip(row.request_params) },
  { title: t('page.operationLogs.columns.beforeData'), key: 'before_data', width: 200, render: (row) => renderTooltip(row.before_data) },
  { title: t('page.operationLogs.columns.afterData'), key: 'after_data', width: 200, render: (row) => renderTooltip(row.after_data) },
  { title: t('page.operationLogs.columns.ipAddress'), key: 'ip_address', width: 140 },
  { title: t('page.operationLogs.columns.userAgent'), key: 'user_agent', width: 150, render: (row) => renderTooltip(row.user_agent) },
  {
    title: t('page.operationLogs.columns.status'),
    key: 'status',
    width: 80,
    render: (row) =>
      h(
        NTag,
        {
          type: row.status === 1 ? 'success' : 'error',
          size: 'small'
        },
        { default: () => (row.status === 1 ? t('page.operationLogs.status.success') : t('page.operationLogs.status.fail')) }
      )
  },
  { title: t('page.operationLogs.columns.errorMessage'), key: 'error_message', width: 150, render: (row) => renderTooltip(row.error_message) },
  {
    title: t('page.operationLogs.columns.createTime'),
    key: 'create_time',
    width: 180,
    render: (row) => (row.create_time ? dayjs(row.create_time).format('YYYY-MM-DD HH:mm:ss') : '-')
  }
]);

const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  prefix({ itemCount }) {
    return t('page.operationLogs.pagination.total', { count: itemCount })
  },
  onChange: (page: number) => {
    pagination.value.page = page;
    fetchData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    fetchData();
  }
});

async function fetchData() {
  loading.value = true;
  try {
    const { data, error } = await fetchOperationLogs({
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      ...searchParams
    });
    if (!error) {
      tableData.value = data.list || [];
      pagination.value.itemCount = data.pagination.total || 0;
    } else {
      message.error(t('page.operationLogs.messages.fetchFail'));
    }
  } catch (err) {
    message.error(t('page.operationLogs.messages.fetchError'));
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <n-card class="flex-initial" content-style="padding: 16px;">
      <n-space>
        <n-select
          :value="searchParams.user_id"
          filterable
          :placeholder="t('page.operationLogs.searchBar.selectUser')"
          :options="userOptions"
          clearable
          style="width: 200px"
          @update:value="(val) => { searchParams.user_id = val; handleSearch(); }"
        />
        <n-select
          :value="searchParams.status"
          :placeholder="t('page.operationLogs.searchBar.selectStatus')"
          :options="statusOptions"
          clearable
          style="width: 120px"
          @update:value="(val) => { searchParams.status = val; handleSearch(); }"
        />
        <n-select
          :value="searchParams.module"
          :placeholder="t('page.operationLogs.searchBar.selectModule')"
          :options="moduleOptions"
          clearable
          style="width: 150px"
          @update:value="(val) => { searchParams.module = val; handleSearch(); }"
        />
        <n-select
          :value="searchParams.operation_type"
          :placeholder="t('page.operationLogs.searchBar.selectOperationType')"
          :options="operationTypeOptions"
          clearable
          style="width: 150px"
          @update:value="(val) => { searchParams.operation_type = val; handleSearch(); }"
        />

        <n-button @click="handleReset">{{ t('page.operationLogs.searchBar.reset') }}</n-button>
      </n-space>
    </n-card>
    <n-card :title="t('page.operationLogs.title')" class="flex-1 overflow-hidden" content-style="padding: 0;">
      <n-data-table
        flex-height
        remote
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :scroll-x="2400"
        class="h-full"
      />
    </n-card>
  </div>
</template>

<style scoped></style>
