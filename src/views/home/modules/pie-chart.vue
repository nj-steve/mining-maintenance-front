<script setup lang="ts">
import { watch } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';
import { $t } from '@/locales';

defineOptions({
  name: 'PieChart'
});

const appStore = useAppStore();
interface CardData {
  key: string;
  title: string;
  value: number;
  rate: number;
  unit: string;
  color: {
    start: string;
    end: string;
  };
  icon: string;
}

interface TodayData {
  wait_repair_count: number;
  wait_repair_rate: number;
  off_shelf_count: number;
  off_shelf_rate: number;
  pending_count: number;
  pending_rate: number;
  logistics_count: number;
  logistics_rate: number;
  repairing_count: number;
  repairing_rate: number;
  repaired_count: number;
  repaired_rate: number;
  wait_on_shelf_count: number;
  wait_on_shelf_rate: number;
  scrapped_count: number;
  scrapped_rate: number;
}

const props = defineProps<{
  data: { today_data?: Partial<TodayData> };
}>();

// 移除旧的 CardData 及错误的 cardData 计算
// interface CardData { /* removed */ }
// const cardData = computed<TodayData[]>(() => props.data);

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: '1%',
    left: 'center',
    itemStyle: {
      borderWidth: 0
    }
  },
  series: [
    {
      color: ['#8e9dff', '#26deca', '#ff9f7f', '#ffc658', '#5da8ff', '#9c88ff'],
      name: $t('page.home.schedule'),
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '12'
        }
      },
      labelLine: {
        show: false
      },
      data: [] as { name: string; value: number }[]
    }
  ]
}));

// 根据传入的 dashboard 数据更新饼图
watch(
  () => props.data,
  val => {
    const today = (val?.today_data || {}) as Partial<TodayData>;
    updateOptions(opts => {
      opts.series[0].data = [
        { name: '待修数', value: today.wait_repair_count ?? 0 },
        { name: '今日下架', value: today.off_shelf_count ?? 0 },
        { name: '待处理', value: today.pending_count ?? 0 },
        { name: '物流中', value: today.logistics_count ?? 0 },
        { name: '在修设备', value: today.repairing_count ?? 0 },
        { name: '今日维修', value: today.repaired_count ?? 0 },
        { name: '待上架', value: today.wait_on_shelf_count ?? 0 },
        { name: '报废数', value: today.scrapped_count ?? 0 }
      ];
      return opts;
    });
  },
  { immediate: true, deep: true }
);

// 删除无用的 mockData 与 init
// async function mockData() { /* removed */ }
// async function init() { /* removed */ }
// init();

function updateLocale() {
  updateOptions((opts, factory) => {
    const originOpts = factory();
    opts.series[0].name = originOpts.series[0].name;
    return opts;
  });
}

// 移除 init 和 mockData 调用，改为根据 props 变化驱动
// 删除 init 与 mockData 调用
// async function init() {
//   mockData();
// }

watch(
  () => appStore.locale,
  () => {
    // updateLocale();
  }
);

// 删除 init 调用
// init();
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </NCard>
</template>

<style scoped></style>
