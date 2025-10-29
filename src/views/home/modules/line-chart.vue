<script setup lang="ts">
import { watch,computed } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useEcharts } from '@/hooks/common/echarts';
import { $t } from '@/locales';

defineOptions({
  name: 'LineChart'
});

const appStore = useAppStore();

// const props = defineProps<{
//   // data: {
//   //   xAxisData: string[];
//   //   seriesData: number[][];
//   // };
// }>();

const props = defineProps<{
  data: [];
}>();

const cardData = computed<any[]>(() => props.data);
const xAxisData = computed<string[]>(() => cardData.value.map(item => item.day.slice(0, 10)));
const seriesOff_shelfData = computed<number[][]>(() => cardData.value.map(item => [item.off_shelf]));
const seriesPendingData = computed<number[][]>(() => cardData.value.map(item => [item.pending]));
const seriesRepairingData = computed<number[][]>(() => cardData.value.map(item => [item.repairing]));
const seriesCompletedData = computed<number[][]>(() => cardData.value.map(item => [item.completed]));



const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: ["今日下架", "待处理", "在修设备", "今日维修"]
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    // data: [] as string[]
    data: xAxisData.value
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      color: '#8e9dff',
      name: "今日下架",
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#8e9dff'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      // data: [] as number[]
      data: seriesOff_shelfData.value.map(item => item[0])
    },
    {
      color: '#26deca',
      name: "待处理",
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#26deca'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      // data: [] as number[]
      data: seriesPendingData.value.map(item => item[0])
    },
    {
      color: '#ff9f7f',
      name: "在修设备",
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#ff9f7f'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      // data: [] as number[]
      data: seriesRepairingData.value.map(item => item[0])
    },
    {
      color: '#ffc658',
      name: "今日维修",
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#ffc658'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      // data: [] as number[]
      data: seriesCompletedData.value.map(item => item[0])
    }
  ]
}));

async function mockData() {
  await new Promise(resolve => {
    setTimeout(resolve, 1000);
  });

  updateOptions(opts => {
    opts.xAxis.data = xAxisData.value;
    // opts.xAxis.data = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'];
    opts.series[0].data = seriesOff_shelfData.value.map(item => item[0]);
    opts.series[1].data = seriesPendingData.value.map(item => item[0]);
    opts.series[2].data = seriesRepairingData.value.map(item => item[0]);
    opts.series[3].data = seriesCompletedData.value.map(item => item[0]);

    return opts;
  });
}

function updateLocale() {
  updateOptions((opts, factory) => {
    const originOpts = factory();

    opts.legend.data = originOpts.legend.data;
    opts.series[0].name = originOpts.series[0].name;
    opts.series[1].name = originOpts.series[1].name;
    opts.series[2].name = originOpts.series[2].name;
    opts.series[3].name = originOpts.series[3].name;

    return opts;
  });
}

async function init() {
  mockData();
}

watch(
  () => appStore.locale,
  () => {
    // updateLocale();
  }
);

// init
init();
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <div ref="domRef" class="h-360px overflow-hidden"></div>
  </NCard>
</template>

<style scoped></style>
