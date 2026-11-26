<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue';
import { NAlert, NButton, NEmpty, NSkeleton, useThemeVars } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import DashboardIcon from '~icons/ant-design/dashboard-outlined';
import RefreshIcon from '~icons/ant-design/reload-outlined';
import TrendIcon from '~icons/ant-design/line-chart-outlined';
import ComparisonIcon from '~icons/ant-design/bar-chart-outlined';
import ClockIcon from '~icons/ant-design/clock-circle-outlined';
import RepairIcon from '~icons/ant-design/tool-outlined';
import OffShelfIcon from '~icons/ant-design/download-outlined';
import CompletedIcon from '~icons/ant-design/check-circle-outlined';
import PendingIcon from '~icons/ant-design/inbox-outlined';
import TransitIcon from '~icons/ant-design/car-outlined';
import OnShelfIcon from '~icons/ant-design/upload-outlined';
import ScrapIcon from '~icons/ant-design/delete-outlined';
import { fetchDashboard } from '@/service/api/site';
import CardData from './modules/card-data.vue';
import LineChart from './modules/line-chart.vue';
import MetricComparison from './modules/metric-comparison.vue';

const { t, locale } = useI18n();
const theme = useThemeVars();

const dashboardData = shallowRef<Awaited<ReturnType<typeof fetchDashboard>>['data']>(null);
const loading = ref(true);
const loadFailed = ref(false);
const chartData = computed(() => dashboardData.value?.chart_data ?? []);
const period = computed(() => {
  if (!chartData.value.length) return '';
  const first = chartData.value[0].day.slice(0, 10);
  const last = chartData.value[chartData.value.length - 1].day.slice(0, 10);
  return first === last ? first : `${first} – ${last}`;
});
const numberFormat = computed(() => new Intl.NumberFormat(locale.value));
const percentFormat = computed(() => new Intl.NumberFormat(locale.value, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}));

const themeStyle = computed(() => ({
  '--home-surface': theme.value.cardColor,
  '--home-line': theme.value.dividerColor,
  '--home-ink': theme.value.textColor1,
  '--home-muted': theme.value.textColor2,
  '--home-accent': theme.value.primaryColor
}));

const metricDefinitions = [
  { key: 'wait_repair', label: 'pendingRepair', icon: ClockIcon, tone: '#b26713', featured: true },
  { key: 'repairing', label: 'devicesUnderRepair', icon: RepairIcon, tone: '#7860d7', featured: true },
  { key: 'off_shelf', label: 'removedToday', icon: OffShelfIcon, tone: '#4179d9', featured: true },
  { key: 'repaired', label: 'repairedToday', icon: CompletedIcon, tone: '#168460', featured: true },
  { key: 'pending', label: 'pendingProcessing', icon: PendingIcon, tone: '#18859b' },
  { key: 'logistics', label: 'inTransit', icon: TransitIcon, tone: '#4179d9' },
  { key: 'wait_on_shelf', label: 'pendingListing', icon: OnShelfIcon, tone: '#168460' },
  { key: 'scrapped', label: 'scrappedCount', icon: ScrapIcon, tone: '#68758a' }
] as const;

const metrics = computed(() => {
  const today = dashboardData.value?.today_data;
  return metricDefinitions.map(metric => ({
    ...metric,
    title: t(`page.home.section1Area.${metric.label}`),
    count: today?.[`${metric.key}_count`] ?? 0,
    value: today ? numberFormat.value.format(today[`${metric.key}_count`] ?? 0) : '—',
    rate: today ? percentFormat.value.format((today[`${metric.key}_rate`] ?? 0) / 100) : ''
  }));
});

const comparisonData = computed(() => dashboardData.value?.today_data ? metrics.value : []);

async function loadDashboard() {
  loading.value = true;
  loadFailed.value = false;
  try {
    const { data, error } = await fetchDashboard();
    if (error || !data) {
      loadFailed.value = true;
      return;
    }
    dashboardData.value = data;
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="home-page" :style="themeStyle">
    <header class="home-heading">
      <div class="home-heading__title">
        <span class="home-heading__icon" aria-hidden="true"><DashboardIcon /></span>
        <h1>{{ t('page.home.overview') }}</h1>
      </div>
      <NButton size="small" :loading="loading" :disabled="loading" @click="loadDashboard">
        <template #icon><RefreshIcon /></template>
        {{ t('common.refresh') }}
      </NButton>
    </header>

    <NAlert v-if="loadFailed" type="error" role="alert">{{ t('page.home.loadFailed') }}</NAlert>
    <CardData :data="metrics" :loading="loading && !dashboardData" :aria-label="t('page.home.overview')" />

    <div class="home-charts">
      <section class="home-panel" aria-labelledby="home-trend-title">
        <header class="home-panel__header">
          <h2 id="home-trend-title"><TrendIcon aria-hidden="true" />{{ t('page.home.trend') }}</h2>
          <span v-if="chartData.length" class="home-panel__period">{{ period }}</span>
        </header>
        <LineChart v-if="chartData.length" :data="chartData" />
        <div v-else class="home-panel__empty">
          <NSkeleton v-if="loading" height="230px" />
          <NEmpty v-else :description="t('common.noData')" />
        </div>
      </section>

      <section class="home-panel" aria-labelledby="home-comparison-title">
        <header class="home-panel__header">
          <h2 id="home-comparison-title"><ComparisonIcon aria-hidden="true" />{{ t('page.home.comparison') }}</h2>
        </header>
        <MetricComparison v-if="comparisonData.length" :data="comparisonData" />
        <div v-else class="home-panel__empty">
          <NSkeleton v-if="loading" height="230px" />
          <NEmpty v-else :description="t('common.noData')" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  --home-tint: color-mix(in srgb, var(--home-accent) 5%, var(--home-surface));

  display: grid;
  align-content: start;
  min-width: 0;
  gap: 12px;
  padding-bottom: 12px;
}

.home-heading,
.home-panel {
  min-width: 0;
  border: 1px solid var(--home-line);
  border-radius: 10px;
  background: var(--home-surface);
}

.home-heading,
.home-heading__title,
.home-panel__header,
.home-panel__header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-heading {
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(100deg, var(--home-tint), var(--home-surface) 70%);
}

.home-heading__title {
  min-width: 0;
}

.home-heading h1 {
  margin: 0;
  color: var(--home-ink);
  font-size: clamp(20px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.3;
}

.home-heading__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--home-accent);
  background: color-mix(in srgb, var(--home-accent) 12%, var(--home-surface));
  font-size: 18px;
}

.home-charts {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(290px, 1fr);
  gap: 12px;
}

.home-panel {
  overflow: hidden;
}

.home-panel__header {
  min-height: 44px;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid var(--home-line);
}

.home-panel__header h2 {
  margin: 0;
  color: var(--home-ink);
  font-size: 14px;
  font-weight: 650;
}

.home-panel__header h2 svg {
  color: var(--home-accent);
  font-size: 16px;
}

.home-panel__period {
  padding: 3px 7px;
  border-radius: 5px;
  background: var(--home-tint);
  color: var(--home-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.home-panel__empty {
  display: grid;
  place-items: center;
  min-height: 290px;
  padding: 14px;
}

@media (max-width: 1000px) {
  .home-charts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
