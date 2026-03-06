<script setup lang="ts">
import { ref, onMounted, h, reactive } from 'vue';
import { NDataTable, useMessage, NCard, NTooltip, NSpace, NSelect, NButton, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchOperationLogs, fetchUser } from '@/service/api';
import type { OperationLog } from '@/service/api/log';
import dayjs from 'dayjs';

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

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 }
];

const moduleOptions = [
  { label: '场地', value: '场地' },
  { label: '故障机', value: '故障机' },
  { label: '工单', value: '工单' },
  { label: '报废机', value: '报废机' },
  { label: '维修明细', value: '维修明细' }
];

const operationTypeOptions = [
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '派单', value: 'dispatch' },
  { label: '导入故障机', value: 'import' },
  { label: '绑定工单', value: 'bind_order' },
  { label: '解绑工单', value: 'unbind_order' }


];

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

const columns: DataTableColumns<OperationLog> = [
  { title: 'ID', key: 'id', width: 80 },
  // { title: '用户ID', key: 'user_id', width: 80 },
  { title: '用户名', key: 'user_name', width: 100 },
  { title: '模块', key: 'module', width: 100 },
  { title: '操作类型', key: 'operation_type', width: 100 },
  { title: '目标表', key: 'target_table', width: 120 },
  { title: '目标ID', key: 'target_id', width: 80, render: (row) => renderTooltip(row.target_id) },
  { title: '请求方法', key: 'request_method', width: 100 },
  { title: '请求URL', key: 'request_url', width: 200, render: (row) => renderTooltip(row.request_url) },
  { title: '请求参数', key: 'request_params', width: 200, render: (row) => renderTooltip(row.request_params) },
  { title: '修改前数据', key: 'before_data', width: 200, render: (row) => renderTooltip(row.before_data) },
  { title: '修改后数据', key: 'after_data', width: 200, render: (row) => renderTooltip(row.after_data) },
  { title: 'IP地址', key: 'ip_address', width: 140 },
  { title: 'UserAgent', key: 'user_agent', width: 150, render: (row) => renderTooltip(row.user_agent) },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(
        NTag,
        {
          type: row.status === 1 ? 'success' : 'error',
          size: 'small'
        },
        { default: () => (row.status === 1 ? '成功' : '失败') }
      )
  },
  { title: '错误信息', key: 'error_message', width: 150, render: (row) => renderTooltip(row.error_message) },
  {
    title: '创建时间',
    key: 'create_time',
    width: 180,
    render: (row) => (row.create_time ? dayjs(row.create_time).format('YYYY-MM-DD HH:mm:ss') : '-')
  }
];

const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
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
      message.error('获取日志失败');
    }
  } catch (err) {
    message.error('获取日志异常');
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
          placeholder="选择用户"
          :options="userOptions"
          clearable
          style="width: 200px"
          @update:value="(val) => { searchParams.user_id = val; handleSearch(); }"
        />
        <n-select
          :value="searchParams.status"
          placeholder="选择状态"
          :options="statusOptions"
          clearable
          style="width: 120px"
          @update:value="(val) => { searchParams.status = val; handleSearch(); }"
        />
        <n-select
          :value="searchParams.module"
          placeholder="选择模块"
          :options="moduleOptions"
          clearable
          style="width: 150px"
          @update:value="(val) => { searchParams.module = val; handleSearch(); }"
        />
        <n-select
          :value="searchParams.operation_type"
          placeholder="选择操作类型"
          :options="operationTypeOptions"
          clearable
          style="width: 150px"
          @update:value="(val) => { searchParams.operation_type = val; handleSearch(); }"
        />
        <!-- <n-button type="primary" @click="handleSearch">搜索</n-button> -->
        <n-button @click="handleReset">重置</n-button>
      </n-space>
    </n-card>
    <n-card title="操作日志" class="flex-1 overflow-hidden" content-style="padding: 0;">
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
