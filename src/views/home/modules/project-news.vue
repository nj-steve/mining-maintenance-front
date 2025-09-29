<script setup lang="ts">
import { computed, type PropType, h } from 'vue';
import { NDataTable, NTag } from 'naive-ui';
import { $t } from '@/locales';

defineOptions({
  name: 'ProjectNews'
});

interface NewsItem {
  id: number;
  created_at: string;
  logistics_type: string;
  onsite_text: string;
  order_no: string;
  payment_date: string | null;
  repair_station_name: string;
  settlement_status: number;
  settlement_status_text: string;
}

const props = defineProps({
  orders: {
    type: Array as PropType<NewsItem[]>,
    default: () => []
  }
});

const columns = [
  {
    title: '工单编号',
    key: 'order_no',
    width: 150
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 120
  },
  {
    title: '维修站点',
    key: 'repair_station_name',
    width: 200
  },
  {
    title: '是否驻场',
    key: 'onsite_text',
    width: 100,
    render: (row: NewsItem) => {
      if (!row.onsite_text) return '-';
      const isOnsite = row.onsite_text === '是';
      return h(NTag, {
        type: isOnsite ? 'success' : 'primary'
      }, () => row.onsite_text);
    }
  },
  {
    title: '物流类型',
    key: 'logistics_type',
    width: 100
  },
  {
    title: '付款日期',
    key: 'payment_date',
    width: 120,
    render: (row: NewsItem) => row.payment_date || '-'
  },
  {
    title: '结算状态',
    key: 'settlement_status_text',
    width: 100,
    render: (row: NewsItem) => {
      if (!row.settlement_status_text) return '-';
      const isPayment = row.settlement_status_text === '已付款';
      return h(NTag, {
        type: isPayment ? 'success' : 'warning'
      }, () => row.settlement_status_text);
    }
  }
];

</script>

<template>
  <NCard title="最新工单" :bordered="false" size="small" segmented class="card-wrapper">
    <template #header-extra>
      <a class="text-primary" href="/workflow">{{ $t('page.home.projectNews.moreNews') }}</a>
    </template>
    <NDataTable
      :columns="columns"
      :data="orders"
      :pagination="false"
      size="small"
      :bordered="false"
    />
  </NCard>
</template>

<style scoped></style>
