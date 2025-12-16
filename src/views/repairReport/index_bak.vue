<template>
  <div class="p-16px space-y-16px">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-12px">
        <span class="text-14px text-gray-600">统计周期</span>
        <NRadioGroup v-model:value="periodMode" class="flex items-center gap-8px">
          <NRadioButton value="custom">自定义</NRadioButton>
          <NRadioButton value="quick">快捷</NRadioButton>
        </NRadioGroup>
        <div v-if="periodMode === 'custom'" class="flex items-center gap-8px">
          <NDatePicker v-model:value="customRange" type="daterange" clearable />
        </div>
        <div v-else class="flex items-center gap-8px">
          <NButton :type="quickRange === 30 ? 'primary' : 'default'" @click="quickRange = 30">近 30 天</NButton>
          <NButton :type="quickRange === 60 ? 'primary' : 'default'" @click="quickRange = 60">近 60 天</NButton>
          <NButton :type="quickRange === 90 ? 'primary' : 'default'" @click="quickRange = 90">近 90 天</NButton>
        </div>
      </div>
      <div class="flex items-center gap-8px">
        <NButton type="primary" @click="handleQuery">查询</NButton>
        <NButton @click="handleReset">重置</NButton>
      </div>
    </div>

    <NTabs v-model:value="activeTab" type="line">
      <NTab name="site" tab="场地维度分析" />
      <NTab name="station" tab="网点维度分析" />
    </NTabs>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-16px">
      <NCard size="large">
        <div class="flex items-center justify-between mb-12px">
          <div class="text-14px text-gray-600">总维修数</div>
          <Icon icon="ant-design:copy-outlined" class="text-gray-400" />
        </div>
        <div class="text-28px font-semibold">{{ totalRepairs }}</div>
        <div class="mt-6px text-12px text-gray-500">Total Repairs</div>
      </NCard>
      <NCard size="large">
        <div class="flex items-center justify-between mb-12px">
          <div class="text-14px text-gray-600">总二返率</div>
          <Icon icon="ant-design:reload-outlined" class="text-gray-400" />
        </div>
        <div class="text-28px font-semibold">{{ totalReturnRate }}%</div>
        <div class="mt-6px text-12px text-gray-500">{{ totalReturnCount }} 台</div>
      </NCard>
      <NCard size="large">
        <div class="flex items-center justify-between mb-12px">
          <div class="text-14px text-gray-600">总报废率</div>
          <Icon icon="ant-design:delete-outlined" class="text-gray-400" />
        </div>
        <div class="text-28px font-semibold">{{ totalScrapRate }}%</div>
        <div class="mt-6px text-12px text-gray-500">{{ totalScrapCount }} 台</div>
      </NCard>
    </div>

    <NCard size="large" title="趋势分析 (Trend Analysis)">
      <div class="h-320px">
        <div ref="chartRef" class="w-full h-full" />
      </div>
    </NCard>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-16px">
      <NCard size="large" title="二返修率 (Top 5)">
        <div class="h-240px">
          <div ref="topReturnChartRef" class="w-full h-full" />
        </div>
      </NCard>
      <NCard size="large" title="报废率 (Top 5)">
        <div class="h-240px">
          <div ref="topScrapChartRef" class="w-full h-full" />
        </div>
      </NCard>
    </div>

    <NCard size="large">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div>
            <span class="text-14px">详细数据统计</span>
            <span class="ml-8px text-12px text-gray-500">{{ recordCount }}</span>
          </div>
          <div class="flex items-center gap-12px">
            <div class="flex items-center gap-8px">
              <span class="text-13px text-gray-600">选择维度</span>
              <NSelect v-model:value="selectedDimension" :options="dimensionOptions" style="width: 160px" />
            </div>
            <NButton @click="exportCSV" tertiary>
              <template #icon>
                <Icon icon="ant-design:download-outlined" />
              </template>
              导出
            </NButton>
          </div>
        </div>
      </template>
      <NDataTable :columns="columns" :data="tableData" size="large" :bordered="false" />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, h } from 'vue'
import { NButton, NCard, NTabs, NTab, NDatePicker, useMessage, NSelect, NDataTable, NTag, NRadioGroup, NRadioButton } from 'naive-ui'
import * as echarts from 'echarts'
import { Icon } from '@iconify/vue'

const message = useMessage()

const periodMode = ref<'custom' | 'quick'>('quick')
const quickRange = ref<number>(30)
const customRange = ref<[number, number] | null>(null)
const activeTab = ref<'site' | 'station'>('site')

const totalRepairs = ref<number>(19845)
const totalReturnRate = ref<number>(11.77)
const totalReturnCount = ref<number>(2335)
const totalScrapRate = ref<number>(4.41)
const totalScrapCount = ref<number>(876)

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const topReturnChartRef = ref<HTMLDivElement | null>(null)
const topScrapChartRef = ref<HTMLDivElement | null>(null)
let topReturnChart: echarts.ECharts | null = null
let topScrapChart: echarts.ECharts | null = null

const tableData = ref<RowItem[]>([
  { site: 'Bitmain-US-TX-Rockdale', repairs: 1969, returnCount: 176, returnRate: 8.94, scrapCount: 135, scrapRate: 8.86 },
  { site: 'CoreScientific-US-GA-Dalton', repairs: 1850, returnCount: 176, returnRate: 9.51, scrapCount: 44, scrapRate: 2.83 },
  { site: 'Hut8-CA-Alberta-MedicineHat', repairs: 1764, returnCount: 385, returnRate: 21.83, scrapCount: 93, scrapRate: 5.27 },
  { site: 'Ebang-CN-Henan-Zhengzhou', repairs: 1409, returnCount: 87, returnRate: 6.17, scrapCount: 122, scrapRate: 8.66 },
  { site: 'Bitfury-GE-Tbilisi', repairs: 1366, returnCount: 64, returnRate: 4.69, scrapCount: 46, scrapRate: 3.37 },
  { site: 'United Projects-HH01-Sohar', repairs: 1154, returnCount: 58, returnRate: 5.03, scrapCount: 11, scrapRate: 0.95 }
])

function buildChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['二返数', '报废数'] },
    grid: { left: 24, right: 24, bottom: 24, top: 24 },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    yAxis: { type: 'value' },
    series: [
      { name: '二返数', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230, 210] },
      { name: '报废数', type: 'line', smooth: true, data: [80, 82, 91, 84, 60, 130, 110] }
    ]
  })
}

function disposeChart() {
  if (chart) {
    chart.dispose()
    chart = null
  }
  if (topReturnChart) {
    topReturnChart.dispose()
    topReturnChart = null
  }
  if (topScrapChart) {
    topScrapChart.dispose()
    topScrapChart = null
  }
}

function handleQuery() {
  message.success('已按筛选条件查询（示例占位）')
}

function handleReset() {
  periodMode.value = 'quick'
  quickRange.value = 30
  customRange.value = null
  activeTab.value = 'site'
  message.success('已重置筛选（示例占位）')
}

watch([periodMode, quickRange, customRange, activeTab], () => {
  // 这里可以触发实际的数据请求；当前为演示静态布局
}, { immediate: false })

onMounted(() => {
  buildChart()
  buildTopCharts()
  window.addEventListener('resize', () => {
    chart?.resize()
    topReturnChart?.resize()
    topScrapChart?.resize()
  })
})

onUnmounted(() => {
  disposeChart()
})

// ------ Top 5 charts ------
function buildTopCharts() {
  if (topReturnChartRef.value) {
    topReturnChart = echarts.init(topReturnChartRef.value)
    topReturnChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 24, right: 24, bottom: 24, top: 24 },
      xAxis: { type: 'category', data: tableData.value.map(i => i.site).slice(0, 5) },
      yAxis: { type: 'value' },
      series: [
        { type: 'bar', 
        data: tableData.value.map(i => i.returnRate).slice(0, 5), 
        itemStyle: { color: '#3b82f6' } 
       },
    //   yAxis: { type: 'value' },
    //   series: [
    //     { type: 'bar', data: tableData.value.map(i => i.scrapRate).slice(0, 5), itemStyle: { color: '#3b82f6' } }
      ]
    })
  }
  if (topScrapChartRef.value) {
    topScrapChart = echarts.init(topScrapChartRef.value)
    topScrapChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 24, right: 24, bottom: 24, top: 24 },
      xAxis: { type: 'category', data: tableData.value.map(i => i.site).slice(0, 5) },
      yAxis: { type: 'value' },
      series: [
        { type: 'bar', data: tableData.value.map(i => i.scrapRate).slice(0, 5), itemStyle: { color: '#ef4444' } }
      ]
    })
  }
}

// ------ Table data & columns ------
type RowItem = {
  site: string
  repairs: number
  returnCount: number
  returnRate: number
  scrapCount: number
  scrapRate: number
}

const recordCount = ref<number>(tableData.value.length)

const dimensionOptions = [
  { label: '场地维度', value: 'site' },
  { label: '网点维度', value: 'station' }
]
const selectedDimension = ref<'site' | 'station'>('site')

const columns = [
  { title: '场地名称', key: 'site' },
  { title: '维修总数', key: 'repairs' },
  { title: '二返数量', key: 'returnCount' },
  {
    title: '二返率',
    key: 'returnRate',
    render(row: RowItem) {
      const type = row.returnRate >= 10 ? 'error' : row.returnRate >= 6 ? 'warning' : 'success'
      return h(NTag, { type, round: true }, { default: () => `${row.returnRate}%` })
    }
  },
  { title: '报废数量', key: 'scrapCount' },
  {
    title: '报废率',
    key: 'scrapRate',
    render(row: RowItem) {
      const type = row.scrapRate >= 6 ? 'error' : row.scrapRate >= 3 ? 'warning' : 'success'
      return h(NTag, { type, round: true }, { default: () => `${row.scrapRate}%` })
    }
  }
]

function exportCSV() {
  const headers = ['场地名称','维修总数','二返数量','二返率(%)','报废数量','报废率(%)']
  const rows = tableData.value.map(r => [r.site, r.repairs, r.returnCount, r.returnRate, r.scrapCount, r.scrapRate])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'repair-report.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped></style>
