<script lang="ts">
export interface ReportSummaryData {
  total_repairs?: number;
  total_fixed?: number;
  total_pending?: number;
  total_scrap_count?: number;
  total_scrap_rate?: number;
  total_return_count?: number;
  total_return_rate?: number;
  repair_rate?: number;
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { NSkeleton } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import TotalIcon from '~icons/ant-design/file-text-outlined';
import FixedIcon from '~icons/ant-design/check-circle-outlined';
import PendingIcon from '~icons/ant-design/clock-circle-outlined';
import ReturnIcon from '~icons/ant-design/retweet-outlined';
import RateIcon from '~icons/ant-design/rise-outlined';
import ScrapIcon from '~icons/ant-design/delete-outlined';

const props = defineProps<{
  dimension: 'site' | 'station';
  summary: ReportSummaryData | null;
  loading: boolean;
}>();

const { t, locale } = useI18n();
const numberFormat = computed(() => new Intl.NumberFormat(locale.value));
const percentFormat = computed(() => new Intl.NumberFormat(locale.value, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}));

const metrics = computed(() => {
  const summary = props.summary;
  const count = (value?: number) => value == null ? '—' : numberFormat.value.format(value);
  const rate = (value?: number) => value == null ? '—' : percentFormat.value.format(value / 100);
  const unit = t('page.repairReport.unitMachine');
  const repairRate = summary?.repair_rate ?? (summary?.total_repairs
    ? ((summary.total_fixed ?? 0) / summary.total_repairs) * 100
    : summary?.total_repairs);

  const total = { key: 'totalRepairs', value: count(summary?.total_repairs), icon: TotalIcon, tone: '#4179d9', featured: true };
  if (props.dimension === 'station') {
    return [
      total,
      {
        key: 'totalReturnRate', value: rate(summary?.total_return_rate), icon: ReturnIcon, tone: '#b26713',
        detail: summary?.total_return_count == null ? '' : `${count(summary.total_return_count)} ${unit}`, featured: true
      },
      {
        key: 'totalScrapRate', value: rate(summary?.total_scrap_rate), icon: ScrapIcon, tone: '#bd5268',
        detail: summary?.total_scrap_count == null ? '' : `${count(summary.total_scrap_count)} ${unit}`, featured: true
      }
    ] as const;
  }

  return [
    total,
    { key: 'repaired', value: count(summary?.total_fixed), icon: FixedIcon, tone: '#168460', featured: true },
    { key: 'pendingRepair', value: count(summary?.total_pending), icon: PendingIcon, tone: '#b26713', featured: true },
    { key: 'repairRate', value: rate(repairRate), icon: RateIcon, tone: '#168460', featured: true },
    { key: 'scrappedCount', value: count(summary?.total_scrap_count), icon: ScrapIcon, tone: '#bd5268' },
    { key: 'scrapRate', value: rate(summary?.total_scrap_rate), icon: ScrapIcon, tone: '#bd5268' }
  ] as const;
});
</script>

<template>
  <section class="report-metrics" :class="`report-metrics--${dimension}`" :aria-busy="loading" :aria-label="t('route.repairreport')">
    <article
      v-for="metric in metrics"
      :key="metric.key"
      class="report-metric"
      :class="{ 'report-metric--featured': 'featured' in metric }"
      :style="{ '--metric-tone': metric.tone }"
    >
      <h2>
        <span class="report-metric__icon" aria-hidden="true"><component :is="metric.icon" /></span>
        {{ t(`page.repairReport.${metric.key}`) }}
      </h2>
      <NSkeleton v-if="loading" class="report-metric__placeholder" width="72px" height="28px" />
      <div v-else class="report-metric__reading">
        <strong>{{ metric.value }}</strong>
        <span v-if="'detail' in metric && metric.detail" class="report-metric__detail">{{ metric.detail }}</span>
      </div>
    </article>
  </section>
</template>
