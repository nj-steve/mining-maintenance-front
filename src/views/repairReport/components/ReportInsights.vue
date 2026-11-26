<script lang="ts">
export interface ReportTrendPoint {
  date: string;
  repair_count: number;
  scrap_count: number;
}

export interface ReportRanking {
  name: string;
  return_rate: number;
  scrap_rate: number;
}
</script>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { NEmpty, NSkeleton, useThemeVars } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import TrendIcon from '~icons/ant-design/line-chart-outlined';
import RankIcon from '~icons/ant-design/bar-chart-outlined';
import { useEcharts, type ECOption } from '@/hooks/common/echarts';

const props = defineProps<{
  trend: ReportTrendPoint[];
  returns: ReportRanking[];
  scraps: ReportRanking[];
  loading: boolean;
}>();

const { t, locale } = useI18n();
const theme = useThemeVars();
const percentageFormat = computed(() => new Intl.NumberFormat(locale.value, {
  style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2
}));

const rankings = computed(() => ([
  { key: 'return', title: t('page.repairReport.secondRepairRateTop5'), color: '#b26713', rows: props.returns, rate: 'return_rate' },
  { key: 'scrap', title: t('page.repairReport.scrapRateTop5'), color: '#bd5268', rows: props.scraps, rate: 'scrap_rate' }
] as const).map(({ rows, rate, ...ranking }) => {
  const topRows = rows.slice(0, 5).map(item => ({ name: item.name, value: item[rate] }));
  return { ...ranking, rows: topRows, max: Math.max(1, ...topRows.map(row => row.value)) };
}));

const options = computed<ECOption>(() => {
  const { textColor2, dividerColor } = theme.value;
  return {
    animation: false,
    color: ['#4179d9', '#bd5268'],
    tooltip: { trigger: 'axis', confine: true },
    legend: {
      type: 'scroll',
      top: 12,
      left: 14,
      right: 14,
      itemWidth: 15,
      textStyle: { color: textColor2, fontSize: 11 }
    },
    grid: { left: 14, right: 18, top: 46, bottom: 14, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.trend.map(point => point.date),
      axisLine: { lineStyle: { color: dividerColor } },
      axisTick: { show: false },
      axisLabel: {
        color: textColor2,
        fontSize: 11,
        hideOverlap: true,
        formatter: (date: string) => date.slice(5, 10)
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: textColor2, fontSize: 11 },
      splitLine: { lineStyle: { color: dividerColor, type: 'dashed' } }
    },
    series: [
      { name: t('page.repairReport.repairCount'), type: 'line', showSymbol: props.trend.length <= 12, data: props.trend.map(point => point.repair_count) },
      { name: t('page.repairReport.scrapCountTrend'), type: 'line', showSymbol: props.trend.length <= 12, data: props.trend.map(point => point.scrap_count) }
    ]
  };
});
const { domRef, updateOptions } = useEcharts(() => options.value, {
  onRender: chart => { chart.setOption(options.value, true); }
});
watch(options, () => void updateOptions(() => options.value), { flush: 'post' });
</script>

<template>
  <div class="report-insights">
    <section class="report-panel report-trend">
      <header class="report-panel__heading">
        <h2><TrendIcon aria-hidden="true" />{{ t('page.repairReport.trendAnalysis') }}</h2>
      </header>
      <div v-if="trend.length && !loading" ref="domRef" class="report-trend__canvas" role="img" :aria-label="t('page.repairReport.trendAnalysis')" />
      <div v-else class="report-trend__canvas report-chart-empty">
        <NSkeleton v-if="loading" height="100%" />
        <NEmpty v-else :description="t('common.noData')" />
      </div>
    </section>

    <section v-for="ranking in rankings" :key="ranking.key" class="report-panel report-ranking">
      <header class="report-panel__heading">
        <h2><RankIcon aria-hidden="true" />{{ ranking.title }}</h2>
      </header>
      <div v-if="loading || !ranking.rows.length" class="report-chart-empty report-ranking__empty">
        <NSkeleton v-if="loading" height="100%" />
        <NEmpty v-else :description="t('common.noData')" />
      </div>
      <ol v-else class="report-ranking__rows">
        <li v-for="(row, index) in ranking.rows" :key="index" class="report-ranking__row">
          <span :title="row.name" class="report-ranking__name">{{ row.name }}</span>
          <strong>{{ percentageFormat.format(row.value / 100) }}</strong>
          <span class="report-ranking__track" aria-hidden="true">
            <span :style="{ width: `${row.value / ranking.max * 100}%`, backgroundColor: ranking.color }" />
          </span>
        </li>
      </ol>
    </section>
  </div>
</template>
