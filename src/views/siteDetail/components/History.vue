<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useMessage, NButton, NCard, NSpin, NIcon } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import { fetchSitesHistory } from '@/service/api/site';

const route = useRoute();
const historyData = ref<any[]>([]);
const columns = [
  {
    title: '日期',
    key: 'date',
    width: 180,
    render: (row: any) => {
      const d = row.date ?? '';
      if (typeof d === 'string') return d.split('T')[0];
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const da = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      }
      return '';
    }
  },
  {
    title: '故障数',
    key: 'fault_count',
    width: 120,
  },
  {
    title: '物流中',
    key: 'in_logistics_count',
    width: 120,
  },
  {
    title: '在修数',
    key: 'repairing',
    width: 120,
  },
  {
    title: '待修数',
    key: 'wait_repair_count',
    width: 120,
  },
  {
    title: '待上架',
    key: 'wait_on_shelf_count',
    width: 120,
  },
  {
    title: '报废数',
    key: 'scrapped_count',
    width: 120,
  },
];
const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
});

onMounted(async () => {
  try {
    const { data, error } = await fetchSitesHistory(Number(route.params.id));
    console.log('historyData', data);
    historyData.value = [];
    if (!error && Array.isArray(data) && data.length > 0) {
      historyData.value = data;
      pagination.value.itemCount = data.length;
    }
  } catch (e) {
    console.error('加载场地历史数据失败', e);
  }
});
</script>

<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <NDataTable
      :data="historyData"
      :columns="columns"
      :pagination="pagination"
      @update:page="(p:number) => (pagination.page = p)"
      @update:pageSize="(ps:number) => (pagination.pageSize = ps)"
      :row-key="(row: any) => row.id"
    />
  </div>
</template>

