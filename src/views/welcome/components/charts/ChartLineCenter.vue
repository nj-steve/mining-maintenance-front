<script setup lang="ts">
import { type PropType, ref, computed } from "vue";
import { useDark, useECharts } from "@PureAdmin/utils";

const props = defineProps({
  xdata: {
    type: Array as PropType<Array<string>>,
    default: () => []
  },
  data: {
    type: Array as PropType<Array<number>>,
    default: () => []
  },
  color: {
    type: String,
    default: "#41b6ff"
  }
});

const { isDark } = useDark();

const theme = computed(() => (isDark.value ? "dark" : "light"));

const chartRef = ref();
const { setOptions } = useECharts(chartRef, {
  theme,
  renderer: "svg"
});

setOptions({
  container: ".line-card",
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: "category",
    show: true,
    data: props.xdata
  },
  grid: {
    top: "15px",
    bottom: 0,
    left: 0,
    right: 0
  },
  yAxis: {
    show: true,
    type: "value"
  },
  series: [
    {
      data: props.data,
      type: "line",
      symbol: "none",
      smooth: true,
      color: props.color,
      lineStyle: {
        shadowOffsetY: 3,
        shadowBlur: 7,
        shadowColor: props.color
      }
    }
  ]
});
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 365px" />
</template>
