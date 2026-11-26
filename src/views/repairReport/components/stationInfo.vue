<script setup lang="ts">
import { ref, onMounted, h, watch, computed } from 'vue'
import { NAlert, NButton, NSelect, NDataTable, NTag, NCheckbox, NProgress, NTooltip } from 'naive-ui'
import FilterIcon from '~icons/ant-design/filter-outlined';
import DownloadIcon from '~icons/ant-design/download-outlined';
import TableIcon from '~icons/ant-design/table-outlined';
import ReportSummary from './ReportSummary.vue';
import type { ReportSummaryData } from './ReportSummary.vue';
import ReportInsights from './ReportInsights.vue';
import type { ReportRanking, ReportTrendPoint } from './ReportInsights.vue';
import { fetchRepairStatistics } from '@/service/api/summary'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  startDate?: string
  endDate?: string
  queryVersion?: number
}>(), {
  startDate: '',
  endDate: '',
  queryVersion: 0
})

const summary = ref<ReportSummaryData | null>(null);
const loading = ref(true);
const loadFailed = ref(false);
let latestRequest = 0;

let chart: echarts.ECharts | null = null
let topReturnChart: echarts.ECharts | null = null
let topScrapChart: echarts.ECharts | null = null

type RowItem = {
  site: string
  repairs: number
  returnCount: number
  returnRate: number
  scrapCount: number
  scrapRate: number
}

const renderLabel = (option: { label: string, value: string }) => {
  return h(
    'div',
    { class: 'flex items-center gap-2' },
    [
      h(NCheckbox, {
        checked: selectedStations.value.includes(option.value),
        style: { pointerEvents: 'none' }
      }),
      h('span', option.label)
    ]
  )
}

const tableData = ref<RowItem[]>([])
const trendChartData = ref<ReportTrendPoint[]>([])
const topReturnChartData = ref<ReportRanking[]>([])
const topScrapChartData = ref<ReportRanking[]>([])


const dimension = 'station' as const
const selectedStations = ref<string[]>([])
const pagination = ref({
  pageSize: 10,
  prefix: ({ itemCount }: { itemCount: number | undefined }) => t('page.repairReport.totalItems', { count: itemCount ?? 0 })
})

const filteredData = computed(() => selectedStations.value.length
  ? tableData.value.filter(row => selectedStations.value.includes(row.site))
  : tableData.value);

const stationOptions = computed(() => {
  const uniqueStations = Array.from(new Set(tableData.value.map(row => row.site)))
  return uniqueStations.map(site => ({ label: site, value: site }))
})

const fetchData = async () => {
  const request = ++latestRequest;
  loading.value = true;
  loadFailed.value = false;
  try {
    const { data, error } = await fetchRepairStatistics(dimension, props.startDate, props.endDate);
    if (request !== latestRequest) return;
    if (!data || error) throw error;
    summary.value = data.summary ?? null;
    trendChartData.value = data.trend_data ?? [];
    topReturnChartData.value = data.return_rate_top5 ?? [];
    topScrapChartData.value = data.scrap_rate_top5 ?? [];

    const list = Array.isArray(data) ? data : (data.station_stats ?? []);
    tableData.value = list.map((item: any) => ({
      site: item.station_name || item.RepairStationName || 'Unknown',
      repairs: item.repairs ?? item.total_repairs ?? 0,
      returnCount: item.returnCount ?? item.return_count ?? 0,
      returnRate: item.returnRate ?? item.return_rate ?? 0,
      scrapCount: item.scrapCount ?? item.scrap_count ?? 0,
      scrapRate: item.scrapRate ?? item.scrap_rate ?? 0
    }));
  } catch {
    if (request !== latestRequest) return;
    loadFailed.value = true;
    summary.value = null;
    tableData.value = [];
    trendChartData.value = [];
    topReturnChartData.value = [];
    topScrapChartData.value = [];
  } finally {
    if (request === latestRequest) loading.value = false;
  }
};
const columns = computed(() => [
  {
    title: () => h('div', { class: 'report-table-heading' }, t('page.repairReport.stationName')),
    key: 'site',
    width: 190,
    sorter: 'default' as const,
    render(row: RowItem) {
      const content = row.site
      return h(
        NTooltip,
        { placement: 'top', trigger: 'hover' },
        {
          trigger: () => h('div', {
            class: 'report-table-name',
            style: {
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }
          }, content),
          default: () => content
        }
      )
    }
  },
  {
    title: () => h('div', { class: 'report-table-heading' }, t('page.repairReport.totalRepairs')),
    key: 'repairs',
    width: 130,
    sorter: (row1: RowItem, row2: RowItem) => row1.repairs - row2.repairs,
    render(row: RowItem) {
      return h('div', { class: 'text-sm text-gray-500 text-right' }, row.repairs)
    }
  },
  {
    title: () => h('div', { class: 'report-table-heading' }, t('page.repairReport.secondRepairCount')),
    key: 'returnCount',
    width: 135,
    sorter: (row1: RowItem, row2: RowItem) => row1.returnCount - row2.returnCount,
    render(row: RowItem) {
      return h('div', { class: 'text-sm text-gray-500 text-right' }, row.returnCount)
    }
  },
  {
    title: () => h('div', { class: 'report-table-heading' }, t('page.repairReport.secondRepairRate')),
    key: 'returnRate',
    width: 160,
    sorter: (row1: RowItem, row2: RowItem) => row1.returnRate - row2.returnRate,
    render(row: RowItem) {
      const type = row.returnRate >= 10 ? 'error' : row.returnRate >= 6 ? 'warning' : 'success'
      return h('div', { class: 'flex items-center gap-8px' }, [
        h(NProgress, {
          type: 'line',
          percentage: Math.min(Number(row.returnRate.toFixed(2)), 100),
          status: type,
          showIndicator: false,
          height: 8,
          style: { width: '80px' }
        }),
        h(NTag, { type: type, size: 'small',round: true, bordered: false }, { default: () => `${row.returnRate.toFixed(2)}%` })
      ])
    }
  },
  {
    title: () => h('div', { class: 'report-table-heading' }, t('page.repairReport.scrappedCount')),
    key: 'scrapCount',
    width: 128,
    sorter: (row1: RowItem, row2: RowItem) => row1.scrapCount - row2.scrapCount,
    render(row: RowItem) {
      return h('div', { class: 'text-sm text-gray-500 text-right' }, row.scrapCount)
    }
  },
  {
    title: () => h('div', { class: 'report-table-heading' }, t('page.repairReport.scrapRate')),
    key: 'scrapRate',
    width: 152,
    sorter: (row1: RowItem, row2: RowItem) => row1.scrapRate - row2.scrapRate,
    render(row: RowItem) {
      const type = row.scrapRate >= 6 ? 'error' : row.scrapRate >= 3 ? 'warning' : 'success'
      return h('div', { class: 'flex items-center gap-8px' }, [
        h(NProgress, {
          type: 'line',
          percentage: Math.min(Number(row.scrapRate.toFixed(2)), 100),
          status: type,
          showIndicator: false,
          height: 8,
          style: { width: '80px' }
        }),
        h(NTag, { type: type, size: 'small',round: true, bordered: false }, { default: () => `${row.scrapRate.toFixed(2)}%` })
      ])
    }
  }
])

function exportCSV() {
  const headers = [t('page.repairReport.stationName'), t('page.repairReport.totalRepairs'), t('page.repairReport.secondRepairCount'), t('page.repairReport.secondRepairRatePercent'), t('page.repairReport.scrappedCount'), t('page.repairReport.scrapRatePercent')]
  const rows = tableData.value.map(r => [r.site, r.repairs, r.returnCount, r.returnRate.toFixed(2), r.scrapCount, r.scrapRate.toFixed(2)])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'repair-report.csv'
  a.click()
  URL.revokeObjectURL(url)
}

watch(() => props.queryVersion, fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="report-view">
    <NAlert v-if="loadFailed" type="error" role="alert">{{ t('page.repairReport.loadFailed') }}</NAlert>
    <ReportSummary dimension="station" :summary="summary" :loading="loading" />
    <ReportInsights :trend="trendChartData" :returns="topReturnChartData" :scraps="topScrapChartData" :loading="loading" />


    <section id="repair-report-details" class="report-panel report-details" tabindex="-1" aria-labelledby="report-details-heading">
      <header class="report-panel__heading">
        <h2 id="report-details-heading">
          <TableIcon aria-hidden="true" />
          {{ t('page.repairReport.detailedDataStatistics') }}
          <span class="report-detail-count">{{ t('page.repairReport.totalItems', { count: filteredData.length }) }}</span>
        </h2>
        <div class="report-detail-actions">
          <NSelect
            v-model:value="selectedStations"
            class="report-detail-filter"
            multiple
            filterable
            clearable
            :placeholder="t('page.repairReport.searchStation')"
            :options="stationOptions"
            :render-label="renderLabel"
            size="small"
            max-tag-count="responsive"
          >
            <template #arrow><FilterIcon /></template>
          </NSelect>
          <NButton size="small" :disabled="loading || !tableData.length" @click="exportCSV">
            <template #icon><DownloadIcon /></template>
            {{ t('page.repairReport.export') }}
          </NButton>
        </div>
      </header>
      <NDataTable
        class="report-table"
        :columns="columns"
        :data="filteredData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="895"
        size="small"
        :bordered="false"
      />
    </section>
  </div>
</template>
