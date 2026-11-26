<script setup lang="ts">
import { computed, watch } from 'vue';
import { useThemeVars } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import { useEcharts, type ECOption } from '@/hooks/common/echarts';
import type { DashboardChartPoint } from '@/service/api/site';

const props = defineProps<{ data: readonly DashboardChartPoint[] }>();
const { t } = useI18n();
const theme = useThemeVars();

const seriesDefinitions = [
  { key: 'off_shelf', label: 'removedToday', color: '#4179d9' },
  { key: 'pending', label: 'pendingProcessing', color: '#18859b' },
  { key: 'repairing', label: 'devicesUnderRepair', color: '#7860d7' },
  { key: 'completed', label: 'repairedToday', color: '#168460' }
] as const;

const options = computed<ECOption>(() => {
  const { textColor2, dividerColor } = theme.value;
  return {
    animation: false,
    color: seriesDefinitions.map(series => series.color),
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, confine: true },
    legend: {
      type: 'scroll',
      top: 14,
      left: 12,
      right: 12,
      itemWidth: 15,
      itemHeight: 8,
      textStyle: { color: textColor2, fontSize: 11 }
    },
    grid: { left: 14, right: 16, top: 54, bottom: 18, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map(point => point.day.slice(0, 10)),
      axisLine: { lineStyle: { color: dividerColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor2, fontSize: 11, formatter: (day: string) => day.slice(5), hideOverlap: true }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: textColor2, fontSize: 11 },
      splitLine: { lineStyle: { color: dividerColor, type: 'dashed' } }
    },
    series: seriesDefinitions.map(series => ({
      id: series.key,
      name: t(`page.home.section1Area.${series.label}`),
      type: 'line',
      showSymbol: props.data.length <= 14,
      symbolSize: 5,
      lineStyle: { width: 2 },
      data: props.data.map(point => point[series.key])
    }))
  };
});

const { domRef, updateOptions } = useEcharts(() => options.value, {
  onRender: chart => { chart.setOption(options.value, true); }
});
watch(options, () => void updateOptions(() => options.value), { flush: 'post' });
</script>

<template>
  <div ref="domRef" class="home-trend" role="img" :aria-label="t('page.home.trend')" />
</template>

<style scoped>
.home-trend {
  height: 290px;
}
</style>
