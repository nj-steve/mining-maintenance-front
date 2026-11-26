<script setup lang="ts">
import { ref, onMounted, onUnmounted, h, watch, computed } from 'vue'
import { NAlert, NEmpty, NButton, NSelect, NDataTable, NTag, NCheckbox, NProgress, NTooltip } from 'naive-ui'
import * as echarts from 'echarts'
import FilterIcon from '~icons/ant-design/filter-outlined';
import DownloadIcon from '~icons/ant-design/download-outlined';
import TableIcon from '~icons/ant-design/table-outlined';
import ReportSummary from './ReportSummary.vue';
import type { ReportSummaryData } from './ReportSummary.vue';
import ReportInsights from './ReportInsights.vue';
import type { ReportRanking, ReportTrendPoint } from './ReportInsights.vue';

import { fetchRepairStatistics, fetchMachineModelStatistics, fetchRepairComponentsStatistics, fetchHeatDissModeStatistics, fetchCountryStatistics } from '@/service/api/summary'
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
const modelChartRef = ref<HTMLDivElement | null>(null)
let modelChart: echarts.ECharts | null = null
const heatModeChartRef = ref<HTMLDivElement | null>(null)
let heatModeChart: echarts.ECharts | null = null
const countryChartRef = ref<HTMLDivElement | null>(null)
let countryChart: echarts.ECharts | null = null
const topComponentChartRef = ref<HTMLDivElement | null>(null)
let topReturnChart: echarts.ECharts | null = null
let topScrapChart: echarts.ECharts | null = null
let topComponentChart: echarts.ECharts | null = null

type RowItem = {
  site: string
  repairs: number
  returnCount: number
  returnRate: number
  scrapCount: number
  scrapRate: number
}

const tableData = ref<RowItem[]>([])
const trendChartData = ref<ReportTrendPoint[]>([])
const modelChartData = ref<{ name: string; value: number }[]>([])
const heatModeChartData = ref<{ name: string; value: number }[]>([])
const countryChartData = ref<{ name: string; value: number }[]>([])
const topReturnChartData = ref<ReportRanking[]>([])
const topScrapChartData = ref<ReportRanking[]>([])
const topComponentChartData = ref<{ name: string; count: number }[]>([])

const dimension = 'site' as const
const selectedSites = ref<string[]>([])
const pagination = ref({
  pageSize: 10,
  prefix: ({ itemCount }: { itemCount: number | undefined }) => t('page.repairReport.totalItems', { count: itemCount ?? 0 })
})

const filteredData = computed(() => selectedSites.value.length
  ? tableData.value.filter(row => selectedSites.value.includes(row.site))
  : tableData.value);

const siteOptions = computed(() => {
  const uniqueSites = Array.from(new Set(tableData.value.map(row => row.site)))
  return uniqueSites.map(site => ({ label: site, value: site }))
})

const renderLabel = (option: { label: string, value: string }) => {
  return h(
    'div',
    { class: 'flex items-center gap-2' },
    [
      h(NCheckbox, {
        checked: selectedSites.value.includes(option.value),
        style: { pointerEvents: 'none' }
      }),
      h('span', option.label)
    ]
  )
}

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

    const list = Array.isArray(data) ? data : (data.site_stats ?? []);
    tableData.value = list.map((item: any) => ({
      site: item.site_name || item.RepairStationName || 'Unknown',
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
const fetchModelTypeData = async () => {
  const request = latestRequest;
  modelChartData.value = [];
  const start = props.startDate
  const end = props.endDate
  try {
    const { data, error } = await fetchMachineModelStatistics(dimension, start, end)
    if (request === latestRequest && !error && data) {
       // Assume data is an array of { name: string, value: number }
       modelChartData.value = Array.isArray(data) ? data : (data.items || [])
       buildModelChart()
    }
  } catch (err) {
    console.error('Failed to fetch machine model type statistics', err)
  }
}

const fetchHeatModeData = async () => {
  const request = latestRequest;
  heatModeChartData.value = [];
  const start = props.startDate
  const end = props.endDate
  try {
    const { data, error } = await fetchHeatDissModeStatistics(dimension, start, end)
    if (request === latestRequest && !error && data) {
      const list = Array.isArray(data) ? data : (data.items || data.list || data.data || [])
      heatModeChartData.value = list
        .filter((item: any) => {
          const nm = item.heat_diss_mode_name ?? item.name
          if (nm === 0 || nm === '0') return false
          if (nm === null || nm === undefined) return false
          if (String(nm).trim() === '') return false
          return true
        })
        .map((item: any) => ({
          name: String(item.heat_diss_mode_name ?? item.name),
          value: item.fault_count ?? item.value ?? 0
        }))
      buildHeatModeChart()
    }
  } catch (err) {
    console.error('Failed to fetch heat dissipation mode statistics', err)
  }
}

const fetchCountryData = async () => {
  const request = latestRequest;
  countryChartData.value = [];
  const start = props.startDate
  const end = props.endDate
  try {
    const { data, error } = await fetchCountryStatistics(dimension, start, end)
    if (request === latestRequest && !error && data) {
      const list = Array.isArray(data) ? data : (data.items || data.list || data.data || [])
      countryChartData.value = list
        .filter((item: any) => {
          const nm = item.country_name ?? item.name
          if (nm === 0 || nm === '0') return false
          if (nm === null || nm === undefined) return false
          if (String(nm).trim() === '') return false
          return true
        })
        .map((item: any) => ({
          name: String(item.country_name ?? item.name),
          value: item.fault_count ?? item.value ?? 0
        }))
      buildCountryChart()
    }
  } catch (err) {
    console.error('Failed to fetch country statistics', err)
  }
}

const fetchComponentData = async () => {
  const request = latestRequest;
  topComponentChartData.value = [];
  const start = props.startDate
  const end = props.endDate
  try {
    const { data, error } = await fetchRepairComponentsStatistics(dimension, start, end)
    if (request === latestRequest && !error && data) {
       const list = Array.isArray(data) ? data : (data.list || data.items || data.data || [])
       topComponentChartData.value = list.map((item: any) => ({
         name: item.name || item.component_name || 'Unknown',
         count: item.count || item.value || 0
       })).reverse()

       if (topComponentChart) {
          topComponentChart.setOption({
            yAxis: { data: topComponentChartData.value.map(d => d.name) },
            series: [{ data: topComponentChartData.value.map(d => d.count) }]
          })
       }
    }
  } catch (err) {
    console.error('Failed to fetch repair components statistics', err)
  }
}

const columns = computed(() => [
  {
    title: () => h('div', { class: 'report-table-heading' }, t('page.repairReport.siteName')),
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
        h(NTag, { type: type, size: 'small', round: true, bordered: false }, { default: () => `${row.returnRate.toFixed(2)}%` })
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

function buildTopComponentChart() {
  if (!topComponentChartRef.value) return
  if (topComponentChart) topComponentChart.dispose()

  topComponentChart = echarts.init(topComponentChartRef.value)
  topComponentChart.setOption({
    grid: {
      left: '100px',
      right: '3%',
      top: '0%',
      bottom: '10%'
    },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      axisLine: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: topComponentChartData.value.map(d => d.name),
      axisLabel: {
        fontSize: 12,
        color: '#374151',
        margin: 16
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'transparent',
      borderRadius: 8,
      formatter: (params: any) => {
        const param = params[0]
        const seriesName = param.seriesName === t('page.repairReport.repairCountLabel') ? t('page.repairReport.repairCountLabel') : param.seriesName
        return `${param.name}<br/>${param.marker} ${seriesName}: ${param.value}`
      }
    },
    series: [
      {
        // name: $t('page.repairReport.repairCount'),
         name: t('page.repairReport.repairCountLabel'),
        type: 'bar',
        data: topComponentChartData.value.map(d => d.count),
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: 20
      }
    ]
  })
}

function buildModelChart() {
  if (!modelChartRef.value) return
  if (modelChart) modelChart.dispose()
  modelChart = echarts.init(modelChartRef.value)
  modelChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      icon: 'circle'
    },
    series: [
      {
        name: t('page.repairReport.machineFaultRate'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: modelChartData.value
      }
    ]
  })
}

function buildHeatModeChart() {
  if (!heatModeChartRef.value) return
  if (heatModeChart) heatModeChart.dispose()
  heatModeChart = echarts.init(heatModeChartRef.value)
  heatModeChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      icon: 'circle'
    },
    series: [
      {
        name: t('page.repairReport.coolingModeFaultRate'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: heatModeChartData.value
      }
    ]
  })
}

function buildCountryChart() {
  if (!countryChartRef.value) return
  if (countryChart) countryChart.dispose()
  countryChart = echarts.init(countryChartRef.value)
  countryChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      icon: 'circle'
    },
    series: [
      {
        name: t('page.repairReport.regionFaultMachineRate'),
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: countryChartData.value
      }
    ]
  })
}

function disposeChart() {
  if (modelChart) {
    modelChart.dispose()
    modelChart = null
  }
  if (heatModeChart) {
    heatModeChart.dispose()
    heatModeChart = null
  }
  if (countryChart) {
    countryChart.dispose()
    countryChart = null
  }
  if (topComponentChart) {
    topComponentChart.dispose()
    topComponentChart = null
  }
}

function exportCSV() {
  const headers = [t('page.repairReport.siteName'), t('page.repairReport.totalRepairs'), t('page.repairReport.secondRepairCount'), t('page.repairReport.secondRepairRatePercent'), t('page.repairReport.scrappedCount'), t('page.repairReport.scrapRatePercent')]
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

function loadReport() {
  void fetchData();
  void fetchModelTypeData();
  void fetchComponentData();
  void fetchHeatModeData();
  void fetchCountryData();
}

function resizeCharts() {
  modelChart?.resize();
  heatModeChart?.resize();
  countryChart?.resize();
  topComponentChart?.resize();
}

watch(() => props.queryVersion, loadReport);
onMounted(() => {
  buildTopComponentChart();
  loadReport();
  window.addEventListener('resize', resizeCharts);
});
onUnmounted(() => {
  latestRequest += 1;
  window.removeEventListener('resize', resizeCharts);
  disposeChart();
});
</script>

<template>
  <div class="report-view">
    <NAlert v-if="loadFailed" type="error" role="alert">{{ t('page.repairReport.loadFailed') }}</NAlert>
    <ReportSummary dimension="site" :summary="summary" :loading="loading" />
    <ReportInsights :trend="trendChartData" :returns="topReturnChartData" :scraps="topScrapChartData" :loading="loading" />

    <div class="report-breakdowns">
      <section class="report-panel">
        <header class="report-panel__heading"><h2>{{ t('page.repairReport.machineFaultRate') }}</h2></header>
        <div class="report-breakdown__body">
          <div ref="modelChartRef" class="report-breakdown__chart" role="img" :aria-label="t('page.repairReport.machineFaultRate')" />
          <div v-if="!modelChartData.length" class="report-breakdown__empty">
            <NEmpty :description="t('common.noData')" />
          </div>
        </div>
      </section>
      <section class="report-panel">
        <header class="report-panel__heading"><h2>{{ t('page.repairReport.componentFaultRate') }}</h2></header>
        <div class="report-breakdown__body">
          <div ref="topComponentChartRef" class="report-breakdown__chart" role="img" :aria-label="t('page.repairReport.componentFaultRate')" />
          <div v-if="!topComponentChartData.length" class="report-breakdown__empty">
            <NEmpty :description="t('common.noData')" />
          </div>
        </div>
      </section>
      <section class="report-panel">
        <header class="report-panel__heading"><h2>{{ t('page.repairReport.coolingModeFaultRate') }}</h2></header>
        <div class="report-breakdown__body">
          <div ref="heatModeChartRef" class="report-breakdown__chart" role="img" :aria-label="t('page.repairReport.coolingModeFaultRate')" />
          <div v-if="!heatModeChartData.length" class="report-breakdown__empty">
            <NEmpty :description="t('common.noData')" />
          </div>
        </div>
      </section>
      <section class="report-panel">
        <header class="report-panel__heading"><h2>{{ t('page.repairReport.regionFaultMachineRate') }}</h2></header>
        <div class="report-breakdown__body">
          <div ref="countryChartRef" class="report-breakdown__chart" role="img" :aria-label="t('page.repairReport.regionFaultMachineRate')" />
          <div v-if="!countryChartData.length" class="report-breakdown__empty">
            <NEmpty :description="t('common.noData')" />
          </div>
        </div>
      </section>
    </div>


    <section id="repair-report-details" class="report-panel report-details" tabindex="-1" aria-labelledby="report-details-heading">
      <header class="report-panel__heading">
        <h2 id="report-details-heading">
          <TableIcon aria-hidden="true" />
          {{ t('page.repairReport.detailedDataStatistics') }}
          <span class="report-detail-count">{{ t('page.repairReport.totalItems', { count: filteredData.length }) }}</span>
        </h2>
        <div class="report-detail-actions">
          <NSelect
            v-model:value="selectedSites"
            class="report-detail-filter"
            multiple
            filterable
            clearable
            :placeholder="t('page.repairReport.searchSite')"
            :options="siteOptions"
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
