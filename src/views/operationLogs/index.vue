<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { NDataTable, useMessage, NCard, NTooltip } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchOperationLogs } from '@/service/api';
import type { OperationLog } from '@/service/api/log';

const message = useMessage();
const loading = ref(false);
const tableData = ref<OperationLog[]>([]);

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
  { title: '用户ID', key: 'user_id', width: 80 },
  { title: '用户名', key: 'user_name', width: 100 },
  { title: '模块', key: 'module', width: 100 },
  { title: '操作类型', key: 'operation_type', width: 100 },
  { title: '目标表', key: 'target_table', width: 120 },
  { title: '目标ID', key: 'target_id', width: 80 },
  { title: '请求方法', key: 'request_method', width: 100 },
  { title: '请求URL', key: 'request_url', width: 200, render: (row) => renderTooltip(row.request_url) },
  { title: '请求参数', key: 'request_params', width: 200, render: (row) => renderTooltip(row.request_params) },
  { title: '修改前数据', key: 'before_data', width: 200, render: (row) => renderTooltip(row.before_data) },
  { title: '修改后数据', key: 'after_data', width: 200, render: (row) => renderTooltip(row.after_data) },
  { title: 'IP地址', key: 'ip_address', width: 140 },
  { title: 'UserAgent', key: 'user_agent', width: 150, render: (row) => renderTooltip(row.user_agent) },
  { title: '状态', key: 'status', width: 80 },
  { title: '错误信息', key: 'error_message', width: 150, render: (row) => renderTooltip(row.error_message) },
  { title: '创建时间', key: 'create_time', width: 180 }
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
      page_size: pagination.value.pageSize
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
  <div class="h-full flex flex-col">
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
