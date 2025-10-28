<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/store/modules/app';
import HeaderBanner from './modules/header-banner.vue';
import CardData from './modules/card-data.vue';
import LineChart from './modules/line-chart.vue';
import PieChart from './modules/pie-chart.vue';
import ProjectNews from './modules/project-news.vue';
import CreativityBanner from './modules/creativity-banner.vue';
import { fetchDashboard } from '@/service/api/site';
import { onMounted } from 'vue';
import { ref } from 'vue';
import { round } from 'echarts/types/src/util/number.js';

const appStore = useAppStore();

const dashboardData = ref<any>({});

const orders = computed(() => dashboardData.value.recent_orders || []);

const cardDataForChild = computed(() => {
  const data = dashboardData.value;
  if (!data || Object.keys(data).length === 0) {
    return [];
  }
  const today_data = data.today_data || {};
  const result = [
    {
      key: 'assetCount',
      title: '待修数',
      value: today_data.wait_repair_count || 0,
      rate: today_data.wait_repair_rate || 0,
      unit: '',
      color: { start: '#ec4786', end: '#b955a4' },
      icon: 'ant-design:bar-chart-outlined' 
    },
    {
      key: 'todayOffShelfCount',
      title: '今日下架',
      value: today_data.off_shelf_count || 0,
      rate: today_data.off_shelf_rate || 0,
      unit: '',
      color: { start: '#865ec0', end: '#5144b4' },
      icon: 'ant-design:money-collect-outlined'
    },
    {
      key: 'pendingCount',
      title: '待处理',
      // value: Math.floor(Math.random() * 500) || 0,
      value: today_data.pending_count || 0,
      rate: today_data.pending_rate || 0,
      unit: '',
      color: { start: '#56cdf3', end: '#719de3' },
      icon: 'carbon:document-download'
    },
    {
      key: 'inTransitCount',
      title: '物流中',
      value: today_data.logistics_count || 0,
      rate: today_data.logistics_rate || 0,
      // value: data.in_transit_count || 0,
      unit: '',
      color: { start: '#fcbc25', end: '#f68057' },
      icon: 'ant-design:trademark-circle-outlined'
    },
    {
      key: 'repairingCount',
      title: '在修设备',
      // value: Math.floor(Math.random() * 200) || 0,
      value:today_data.repairing_count,
      rate: today_data.repairing_rate || 0,
      unit: '',
      color: { start: '#ec4786', end: '#b955a4' },
      icon: 'ant-design:bar-chart-outlined'
    },
    {
      key: 'todayRepairedCount',
      title: '今日维修',
      // value: Math.floor(Math.random() * 300) || 0,
      value: today_data.repaired_count || 0,
      rate: today_data.repaired_rate || 0,
      unit: '',
      color: { start: '#865ec0', end: '#5144b4' },
      icon: 'ant-design:money-collect-outlined'
    },
    {
      key: 'toBeShelvedCount',
      title: '待上架',
      // value: Math.floor(Math.random() * 200) || 0,
      value: today_data.wait_on_shelf_count || 0,
      rate: today_data.wait_on_shelf_rate || 0,
      unit: '',
      color: { start: '#56cdf3', end: '#719de3' },
      icon: 'carbon:document-download'
    },
    {
      key: 'totalOffShelfCount',
      title: '报废数',
      // value:Math.floor(Math.random() * 100) ,
      value: today_data.scrapped_count || 0,
      rate: today_data.scrapped_rate || 0,
      unit: '',
      color: { start: '#fcbc25', end: '#f68057' },
      icon: 'ant-design:trademark-circle-outlined'
    }
  ];
  return result;
});

const gap = computed(() => (appStore.isMobile ? 0 : 16));

onMounted(async () => {
  const { data, error } = await fetchDashboard();
  console.log('res', data);
  console.log('error', error);
  if (error === null) {
    // console.log('res~~~', data);
    dashboardData.value = data;
  }
});
</script>

<template>
  <NSpace vertical :size="16">
    <!-- <NAlert :title="$t('common.warning')" type="warning">
      {{ $t('page.home.branchDesc') }}
    </NAlert> -->
    <!-- <HeaderBanner /> -->
    <CardData :data="cardDataForChild" />
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:14">
        <NCard :bordered="false" class="card-wrapper">
          <LineChart />
        </NCard>
      </NGi>
      <NGi span="24 s:24 m:10">
        <NCard :bordered="false" class="card-wrapper">
          <PieChart />
        </NCard>
      </NGi>
    </NGrid>
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <!-- <NGi span="24 s:24 m:24">
        <ProjectNews :orders="orders" />
      </NGi> -->
      <!-- <NGi span="24 s:24 m:10">
        <CreativityBanner />
      </NGi> -->
    </NGrid>
  </NSpace>
</template>

<style scoped></style>
