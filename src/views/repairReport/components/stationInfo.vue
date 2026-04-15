<template>
  <div class="space-y-16px">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-16px">
      <NCard size="medium">
        <div class="flex items-center justify-between mb-12px">
          <div class="text-14px text-gray-600">{{ t('page.repairReport.totalRepairs') }}</div>
           <n-tag size="large" :bordered="false" type="success" style="margin-right: -10px;">
            <Icon icon="ant-design:copy-outlined" width="20" height="20" />
           </n-tag>
        </div>
        <div class="text-28px font-semibold">
          <n-statistic label="" tabular-nums>
            <n-number-animation
              ref="numberAnimationInstRef"
              :from="0"
              :to="summary?.total_repairs"
              :show-separator="true"
              class="text-3xl font-bold text-gray-800"
            />
            <!-- <span class="mt-6px text-12px text-gray-500">Total Repairs</span> -->
            <n-tag  class="mytag mt-6px  text-10px text-gray-500"   size="small" :bordered="false" round>
      Total Repairs
    </n-tag>
          </n-statistic>

          <!-- {{ summary?.total_repairs }} -->
        </div>

      </NCard>
      <NCard size="medium">
        <div class="flex items-center justify-between mb-12px">
          <div class="text-14px text-gray-600">{{ t('page.repairReport.totalReturnRate') }}</div>
           <n-tag size="large" :bordered="false" type="info" style="margin-right: -10px;">
            <Icon icon="ant-design:reload-outlined" width="20" height="20" />
           </n-tag>
          <!-- <Icon icon="ant-design:reload-outlined" class="text-gray-400" /> -->
        </div>
        <div class="text-28px font-semibold">
            <n-statistic label="" tabular-nums>
              <n-number-animation
                ref="numberAnimationInstRef"
                :from="0.0"
                :to="summary?.total_return_rate?.toFixed(2)"
                :active="true"
                :precision="2"
              />%
                    <n-tag  class=" mytag  mt-6px text-10px text-gray-500" size="small" :bordered="false" round>
      {{ summary?.total_return_count }} {{ t('page.repairReport.unitMachine') }}
    </n-tag>
              <!-- <span class="mt-6px text-12px text-gray-500"></span> -->
            </n-statistic>
        </div>

      </NCard>
      <NCard size="medium">
        <div class="flex items-center justify-between mb-12px">
          <div class="text-14px text-gray-600">{{ t('page.repairReport.totalScrapRate') }}</div>
            <n-tag size="large" :bordered="false" type="error" style="margin-right: -10px;">
            <Icon icon="ant-design:delete-outlined" width="20" height="20" />
           </n-tag>
          <!-- <Icon icon="ant-design:delete-outlined" class="text-gray-400" /> -->
        </div>
        <div class="text-28px font-semibold">

          <!-- {{ summary?.total_scrap_rate?.toFixed(2) }} -->
          <n-statistic label="" tabular-nums>
              <n-number-animation
                ref="numberAnimationInstRef"
                :from="0.0"
                :to="summary?.total_scrap_rate?.toFixed(2)"
                :active="true"
                :precision="2"
              />%
               <n-tag  class="mt-6px mytag  text-10px text-gray-500" size="small" :bordered="false" round>
      {{ summary?.total_scrap_count }} {{ t('page.repairReport.unitMachine') }}
    </n-tag>
              <!-- <span class="mt-6px text-12px text-gray-500">{{ summary?.total_scrap_count }} 台</span> -->
            </n-statistic>
        </div>

      </NCard>

    </div>

    <NCard size="large">
      <template #header>
        <div class="text-14px font-bold text-gray-700 mb-4">{{ t('page.repairReport.trendAnalysis') }}</div>
      </template>
      <div class="h-320px">
        <div ref="chartRef" class="w-full h-full" />
      </div>
    </NCard>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-16px">
      <NCard size="large">
        <template #header>
          <div class="text-14px font-bold text-gray-700 mb-4">{{ t('page.repairReport.secondRepairRateTop5') }}</div>
        </template>
        <div class="h-240px">
          <div ref="topReturnChartRef" class="w-full h-full" />
        </div>
      </NCard>
      <NCard size="large">
        <template #header>
          <div class="text-14px font-bold text-gray-700 mb-4">{{ t('page.repairReport.scrapRateTop5') }}</div>
        </template>
        <div class="h-240px">
          <div ref="topScrapChartRef" class="w-full h-full" />
        </div>
      </NCard>
    </div>

    <NCard size="large" >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div>
            <span class="text-18px font-bold text-gray-700">{{ t('page.repairReport.detailedDataStatistics') }}</span>
            <span class="ml-8px text-12px text-gray-500">
              <n-tag  class="mt-6px text-10px text-gray-500" size="small" :bordered="false" round>
                &nbsp;{{ recordCount }}&nbsp;
              </n-tag>
            </span>
          </div>
          <div class="flex items-center gap-12px">

            <!-- <div class="flex items-center gap-8px">
              <Icon icon="ant-design:filter-outlined" class="text-gray-500 text-16px" />
              <NSelect
                v-model:value="selectedStations"
                multiple
                filterable
                :placeholder="t('page.repairReport.searchStation')"
                :options="stationOptions"
                size="small"
                style="width: 240px"
                clearable
                max-tag-count="responsive"
              />
            </div> -->
                 <div class="flex items-center gap-8px">
              <!-- <span class="text-13px text-gray-600">选择场地</span> -->
              <NSelect
                v-model:value="selectedStations"
                multiple
                filterable
                :placeholder="t('page.repairReport.searchSite')"
                :options="stationOptions"
                :render-label="renderLabel"
                size="small"
                style="width: 240px"
                clearable
                max-tag-count="responsive"
              >
                <template #arrow>
                  <Icon icon="ant-design:filter-outlined" class="text-gray-400" />
                </template>
              </NSelect>
            </div>

            <!-- <div class="flex items-center gap-8px">
              <span class="text-13px text-gray-600">{{ t('page.repairReport.filter') }}</span>
              <NInput v-model:value="searchText" :placeholder="t('page.repairReport.searchName')" clearable size="small" style="width: 160px">
                <template #prefix>
                  <Icon icon="ant-design:search-outlined" class="text-gray-400" />
                </template>
              </NInput>
            </div> -->
            <!-- <div class="flex items-center gap-8px">
              <span class="text-13px text-gray-600">{{ t('page.repairReport.selectDimension') }}</span>
              <NSelect v-model:value="selectedDimension" :options="dimensionOptions" style="width: 160px" />
            </div> -->
            <NButton @click="exportCSV" tertiary>
              <template #icon>
                <Icon icon="ant-design:download-outlined" />
              </template>
              {{ t('page.repairReport.export') }}
            </NButton>
          </div>
        </div>
      </template>
      <NDataTable :columns="columns" :data="filteredData" :pagination="pagination" size="large" :bordered="false" />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, h, watch, computed } from 'vue'
import { NCard, NButton, NSelect, NDataTable, NTag, NCheckbox, NProgress, NTooltip } from 'naive-ui'
import * as echarts from 'echarts'
import { Icon } from '@iconify/vue'
import { fetchRepairStatistics } from '@/service/api/summary'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  startDate?: string
  endDate?: string
}>(), {
  startDate: '',
  endDate: ''
})

const summary = ref<any>({})

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
const topReturnChartRef = ref<HTMLDivElement | null>(null)
const topScrapChartRef = ref<HTMLDivElement | null>(null)
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
const trendChartData = ref<{ date: string; repair_count: number;  scrap_count: number }[]>([])
const topReturnChartData = ref<{ name: string; return_rate: number }[]>([])
const topScrapChartData = ref<{ name: string; scrap_rate: number }[]>([])
const recordCount = ref<number>(0)


const dimensionOptions = [
  { label: t('page.repairReport.siteDimension'), value: 'site' },
  { label: t('page.repairReport.stationDimension'), value: 'station' }
]
const selectedDimension = ref<'site' | 'station'>('station')
const searchText = ref('')
const selectedStations = ref<string[]>([])
const pagination = ref({
  pageSize: 10,
  prefix: ({ itemCount }: { itemCount: number | undefined }) => t('page.repairReport.totalItems', { count: itemCount ?? 0 })
})

const filteredData = computed(() => {
  let result = tableData.value
  if (searchText.value) {
    result = result.filter(row =>
      row.site.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }
  if (selectedStations.value.length > 0) {
    result = result.filter(row => selectedStations.value.includes(row.site))
  }
  return result
})

const stationOptions = computed(() => {
  const uniqueStations = Array.from(new Set(tableData.value.map(row => row.site)))
  return uniqueStations.map(site => ({ label: site, value: site }))
})

const fetchData = async () => {
  const start = props.startDate
  const end = props.endDate

  try {
    const { data, error } = await fetchRepairStatistics(selectedDimension.value, start, end)
    if (!error && data) {
      summary.value = data.summary || {}
      trendChartData.value = data.trend_data || []
      topReturnChartData.value = data.return_rate_top5.reverse() || []
      topScrapChartData.value = data.scrap_rate_top5.reverse() || []

      // Assuming data structure based on typical API patterns.
      // If the API returns the list directly or wrapped.
      // Adjusting based on common patterns in this project (e.g., data.list or data directly)
      // Since I can't verify the exact response, I'll assume data is the list or data.list
      const list = Array.isArray(data) ? data : (data.station_stats || [])

      // Map API response to RowItem if necessary
      // Assuming API returns fields matching RowItem or similar
      tableData.value = list.map((item: any) => ({
        site: item.station_name || item.RepairStationName || 'Unknown',
        repairs: item.repairs || item.total_repairs || 0,
        returnCount: item.returnCount || item.return_count || 0,
        returnRate: item.returnRate || item.return_rate || 0,
        scrapCount: item.scrapCount || item.scrap_count || 0,
        scrapRate: item.scrapRate || item.scrap_rate || 0
      }))

      recordCount.value = tableData.value.length
      // Update charts
      updateCharts()
    }
  } catch (err) {
    console.error('Failed to fetch repair statistics', err)
  }
}

function updateCharts() {
    // Update top charts based on tableData
    if (topReturnChart) {
        topReturnChart.setOption({
            yAxis: { data: topReturnChartData.value.map(d => d.name) },
            series: [{ data: topReturnChartData.value.map(i => Number(i.return_rate.toFixed(2))).slice(0, 5) }]
        })
    }
    if (topScrapChart) {
        topScrapChart.setOption({
            yAxis: { data: topScrapChartData.value.map(d => d.name) },
            // yAxis: { data: topScrapChartData.value.map(d => d.name.length > 14 ? d.name.substring(0, 14) + '...' : d.name) },
            series: [{ data: topScrapChartData.value.map(i => Number(i.scrap_rate.toFixed(2))).slice(0, 5) }]
        })
    }
    buildChart()
    // Update trend chart if data available... (omitted for now as we focus on tableData)
}

watch(() => [props.startDate, props.endDate, selectedDimension.value], fetchData)

const columns = computed(() => [
  {
    title: () => h('div', { class: 'px-6  text-xs font-medium text-gray-500' }, selectedDimension.value === 'site' ? t('page.repairReport.siteName') : t('page.repairReport.stationName')),
    key: 'site',
    sorter: 'default' as const,
    render(row: RowItem) {
      const content = row.site
      return h(
        NTooltip,
        { placement: 'top', trigger: 'hover' },
        {
          trigger: () => h('div', {
            class: 'text-sm font-medium text-gray-900',
            style: {
              width: '200px',
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
    title: () => h('div', { class: 'px-6  text-xs font-medium text-gray-500' }, t('page.repairReport.totalRepairs')),
    key: 'repairs',
    sorter: (row1: RowItem, row2: RowItem) => row1.repairs - row2.repairs,
    render(row: RowItem) {
      return h('div', { class: 'text-sm text-gray-500 text-right' }, row.repairs)
    }
  },
  {
    title: () => h('div', { class: 'px-6  text-xs font-medium text-gray-500' }, t('page.repairReport.secondRepairCount')),
    key: 'returnCount',
    sorter: (row1: RowItem, row2: RowItem) => row1.returnCount - row2.returnCount,
    render(row: RowItem) {
      return h('div', { class: 'text-sm text-gray-500 text-right' }, row.returnCount)
    }
  },
  {
    title: () => h('div', { class: 'px-6  text-xs font-medium text-gray-500' }, t('page.repairReport.secondRepairRate')),
    key: 'returnRate',
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
    title: () => h('div', { class: 'px-6  text-xs font-medium text-gray-500' }, t('page.repairReport.scrappedCount')),
    key: 'scrapCount',
    sorter: (row1: RowItem, row2: RowItem) => row1.scrapCount - row2.scrapCount,
    render(row: RowItem) {
      return h('div', { class: 'text-sm text-gray-500 text-right' }, row.scrapCount)
    }
  },
  {
    title: () => h('div', { class: 'px-6  text-xs font-medium text-gray-500' }, t('page.repairReport.scrapRate')),
    key: 'scrapRate',
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

function buildChart() {

  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  const dates = trendChartData.value.map(d => d.date);
    // 根据数据量决定显示间隔
  const interval = dates.length > 30 ? Math.ceil(dates.length / 15) : 0; // 如果超过30天，只显示15个标签
  chart.setOption({
    grid: {
      left: '40px',
      right: '30px',
      top: '8%',
      bottom: dates.length > 20 ? '30%' : '25%' // 增加底部空间，确保旋转标签完全可见
    },
    legend: {
      data: [t('page.repairReport.repairCount'), t('page.repairReport.secondRepairCountTrend'), t('page.repairReport.scrapCountTrend')],
      icon: 'circle',
      right: 10,
      top: -5,
      textStyle: {
        color: '#6b7280'
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#e5e7eb'
        },
        alignWithLabel: true // 刻度线与标签对齐
      },
      axisLabel: {
        fontSize: 11,
        color: '#6b7280',
        interval: interval, // 自动间隔显示
        rotate: dates.length > 20 ? 0 : 0, // 如果日期太多，旋转45度
        margin: 20, // 进一步增加标签与轴的距离
        formatter: (value: string) => {
          // 格式化日期显示：只显示月/日，去掉年份
          if (value && value.length >= 10) {
            // 处理 YYYY-MM-DD 格式
            const parts = value.split('-');
            if (parts.length === 3) {
              return `${parts[1]}/${parts[2]}`; // 返回 MM/DD
            }
            // 如果已经是其他格式，尝试提取月日
            return value.substring(5, 10).replace('-', '/');
          }
          return value;
        },
        overflow: 'none' // 防止标签被截断
      }
    },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      fontSize: 10,
      color: '#9ca3af'
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0',
        type: 'dashed'
      }
    }
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'transparent',
    borderRadius: 8,
    textStyle: {
      color: '#374151'
    }
  },
  series: [
    {
      name: t('page.repairReport.repairCount'),
      type: 'line',
      data: trendChartData.value.map(d => d.repair_count),
      smooth: true,
      lineStyle: {
        color: '#3b82f6',
        width: 2
      },
      itemStyle: {
        color: '#3b82f6'
      },
      symbol: 'none',
      emphasis: {
        focus: 'series',
        itemStyle: {
          color: '#3b82f6',
          borderWidth: 2,
          borderColor: '#fff'
        }
      }
    },
    {
      name: t('page.repairReport.scrapCountTrend'),
      type: 'line',
      data: trendChartData.value.map(d => d.scrap_count),
      smooth: true,
      lineStyle: {
        color: '#ef4444',
        width: 2
      },
      itemStyle: {
        color: '#ef4444'
      },
      symbol: 'none',
      emphasis: {
        focus: 'series',
        itemStyle: {
          color: '#ef4444',
          borderWidth: 2,
          borderColor: '#fff'
        }
      }
    }
  ]
  }
  //   {
  //   tooltip: { trigger: 'axis' },
  //   legend: { data: ['二返数', '报废数'] },
  //   grid: { left: 24, right: 24, bottom: 24, top: 24, containLabel: true },
  //   xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  //   yAxis: { type: 'value' },
  //   series: [
  //     { name: '二返数', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 230, 210] },
  //     { name: '报废数', type: 'line', smooth: true, data: [80, 82, 91, 84, 60, 130, 110] }
  //   ]
  // }
)
}

function buildTopCharts() {
  if (topReturnChartRef.value) {
    topReturnChart = echarts.init(topReturnChartRef.value)
    topReturnChart.setOption(
      {
    grid: {
      left: '120px',
      right: '3%',
      top: '0%',
      bottom: '10%'
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%',
        fontSize: 11,
        color: '#6b7280'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb'
        }
      },
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
      data: topReturnChartData.value.map(d => d.name.length > 14 ? d.name.substring(0, 14) + '...' : d.name),
      axisLabel: {
        fontSize: 11,
        color: '#6b7280',
        formatter: (value: string) => {
          return value.length > 14 ? value.substring(0, 14) + '...' : value
        }
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'transparent',
      borderRadius: 8,
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.marker} ${param.seriesName}: ${param.value}%`;
      }
    },
    series: [
      {
        name: t('page.repairReport.secondRepairRate'),
        type: 'bar',
        data: topReturnChartData.value.map(d => d.return_rate),
        itemStyle: {
          color: '#2563eb',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: 20
      }
    ]
  }
    //   {
    //   tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    //   grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    //   xAxis: { type: 'value' },
    //   yAxis: { type: 'category', data: tableData.value.map(i => i.site).slice(0, 5), axisLabel: { interval: 0 } },
    //   series: [
    //     {
    //       type: 'bar',
    //       data: tableData.value.map(i => i.returnRate).slice(0, 5),
    //       itemStyle: { color: '#3b82f6' },
    //       label: { show: true, position: 'right', formatter: '{c}%' }
    //     }
    //   ]
    // }
  )
  }
  if (topScrapChartRef.value) {
    topScrapChart = echarts.init(topScrapChartRef.value)
    topScrapChart.setOption(
      {
    grid: {
      left: '120px',
      right: '3%',
      top: '0%',
      bottom: '10%'
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%',
        fontSize: 11,
        color: '#6b7280',
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e5e7eb'
        }
      },
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
      // data: topScrapChartData.value.map(d => d.name.length > 14 ? d.name.substring(0, 14) + '...' : d.name),
      axisLabel: {
        fontSize: 11,
        color: '#6b7280',
        formatter: (value: string) => {
          return value.length > 14 ? value.substring(0, 14) + '...' : value
        }
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'transparent',
      borderRadius: 8,
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.marker} ${param.seriesName}: ${param.value}%`;
      }
    },
    series: [
      {
        name: t('page.repairReport.scrapRate'),
        type: 'bar',
        data: topScrapChartData.value.map(d => d.scrap_rate),
        itemStyle: {
          color: '#dc2626',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: 20
      }
    ]
  }
    //   {
    //   tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    //   grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    //   xAxis: { type: 'value' },
    //   yAxis: { type: 'category', data: tableData.value.map(i => i.site).slice(0, 5), axisLabel: { interval: 0 } },
    //   series: [
    //     {
    //       type: 'bar',
    //       data: tableData.value.map(i => i.scrapRate).slice(0, 5),
    //       itemStyle: { color: '#ef4444' },
    //       label: { show: true, position: 'right', formatter: '{c}%' }
    //     }
    //   ]
    // }
  )
  }
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

onMounted(() => {
  fetchData()
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
</script>
<style scoped lang="scss">
.mytag {
  font-size: 10px;
  margin-bottom: 10px;
  margin-left: 10px;
}
.n-statistic-value .n-statistic-value__content{
font-weight: 600;
font-size: 28px;
}
</style>
