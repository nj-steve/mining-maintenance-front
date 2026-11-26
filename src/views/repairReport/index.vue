<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { NButton, NDatePicker, NRadioButton, NRadioGroup, NTab, NTabs, useMessage, useThemeVars } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import ReportIcon from '~icons/ant-design/bar-chart-outlined';
import CalendarIcon from '~icons/ant-design/calendar-outlined';
import SearchIcon from '~icons/ant-design/search-outlined';
import TableIcon from '~icons/ant-design/table-outlined';
import SiteInfo from './components/siteInfo.vue';
import StationInfo from './components/stationInfo.vue';

const { t } = useI18n();
const message = useMessage();
const theme = useThemeVars();
const themeStyle = computed(() => ({
  '--report-surface': theme.value.cardColor,
  '--report-line': theme.value.dividerColor,
  '--report-ink': theme.value.textColor1,
  '--report-muted': theme.value.textColor2,
  '--report-accent': theme.value.primaryColor
}));

const ranges = [
  { days: 30, label: 'last30Days' },
  { days: 60, label: 'last60Days' },
  { days: 90, label: 'last90Days' },
  { days: 0, label: 'all' }
] as const;

const periodMode = ref<'custom' | 'quick'>('quick');
const quickRange = ref<number>(60);
const customRange = ref<[number, number] | null>(null);
const activeTab = ref<'site' | 'station'>('site');
const query = ref(quickDates(60));
const queryVersion = ref(0);
const queryLabel = computed(() => query.value.start
  ? `${query.value.start} – ${query.value.end}`
  : t('page.repairReport.all'));

function quickDates(days: number) {
  const now = dayjs();
  return days === 0
    ? { start: '', end: '' }
    : { start: now.subtract(days, 'day').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') };
}

function applyQuery() {
  if (periodMode.value === 'custom' && customRange.value) {
    const [start, end] = customRange.value;
    query.value = { start: dayjs(start).format('YYYY-MM-DD'), end: dayjs(end).format('YYYY-MM-DD') };
  } else {
    query.value = quickDates(periodMode.value === 'quick' ? quickRange.value : 30);
  }
  queryVersion.value += 1;
}

function selectRange(days: number) {
  quickRange.value = days;
  applyQuery();
}

function reset() {
  periodMode.value = 'quick';
  quickRange.value = 30;
  customRange.value = null;
  applyQuery();
  message.success(t('page.repairReport.resetSuccess'));
}

function showDetails() {
  const details = document.getElementById('repair-report-details');
  details?.scrollIntoView({ block: 'start' });
  details?.focus({ preventScroll: true });
}
</script>

<template>
  <div class="repair-report" :style="themeStyle">
    <header class="report-heading">
      <div class="report-heading__title">
        <span class="report-heading__icon" aria-hidden="true"><ReportIcon /></span>
        <h1>{{ t('route.repairreport') }}</h1>
      </div>
      <div class="report-heading__actions">
        <span class="report-period" :title="t('page.repairReport.statisticalPeriod')">
          <CalendarIcon aria-hidden="true" />{{ queryLabel }}
        </span>
        <NButton size="small" @click="showDetails">
          <template #icon><TableIcon /></template>
          {{ t('page.repairReport.details') }}
        </NButton>
      </div>
    </header>

    <div class="report-controls">
      <NTabs v-model:value="activeTab" class="report-dimensions" size="small" type="segment">
        <NTab name="site" :tab="t('page.repairReport.siteDimension')" />
        <NTab name="station" :tab="t('page.repairReport.stationDimension')" />
      </NTabs>
      <div class="report-date-filter">
        <NRadioGroup v-model:value="periodMode" size="small" :aria-label="t('page.repairReport.statisticalPeriod')">
          <NRadioButton value="quick">{{ t('page.repairReport.quick') }}</NRadioButton>
          <NRadioButton value="custom">{{ t('page.repairReport.custom') }}</NRadioButton>
        </NRadioGroup>
        <NDatePicker
          v-if="periodMode === 'custom'"
          v-model:value="customRange"
          class="report-date-picker"
          type="daterange"
          clearable
          size="small"
          @update:value="applyQuery"
        />
        <div v-else class="report-quick-ranges">
          <NButton
            v-for="range in ranges"
            :key="range.days"
            size="small"
            :type="quickRange === range.days ? 'primary' : 'default'"
            :secondary="quickRange === range.days"
            :aria-pressed="quickRange === range.days"
            @click="selectRange(range.days)"
          >
            {{ t(`page.repairReport.${range.label}`) }}
          </NButton>
        </div>
      </div>
      <div class="report-controls__actions">
        <NButton size="small" type="primary" @click="applyQuery">
          <template #icon><SearchIcon /></template>
          {{ t('page.repairReport.search') }}
        </NButton>
        <NButton size="small" @click="reset">{{ t('common.reset') }}</NButton>
      </div>
    </div>

    <component
      :is="activeTab === 'site' ? SiteInfo : StationInfo"
      :key="activeTab"
      :start-date="query.start"
      :end-date="query.end"
      :query-version="queryVersion"
    />
  </div>
</template>

<style src="./report.css"></style>
