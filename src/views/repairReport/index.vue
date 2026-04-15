<template>
  <div class="p-16px space-y-16px">
    <NCard :bordered="false" class="rounded-8px shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-12px">
          <span class="text-14px text-gray-600">{{ $t('page.repairReport.statisticalPeriod') }}</span>
          <NRadioGroup v-model:value="periodMode" size="small">
            <NRadioButton value="custom">{{ $t('page.repairReport.custom') }}</NRadioButton>
            <NRadioButton value="quick">{{ $t('page.repairReport.quick') }}</NRadioButton>
          </NRadioGroup>
          <div v-if="periodMode === 'custom'" class="flex items-center gap-8px">
            <NDatePicker v-model:value="customRange" type="daterange" clearable size="small" @update:value="handleQuery" />
          </div>
          <div v-else class="flex items-center gap-8px">
            <NButton size="small" :type="quickRange === 30 ? 'primary' : 'default'" :ghost="quickRange === 30" @click="quickRange = 30;handleQuery()">{{ $t('page.repairReport.last30Days') }}</NButton>
            <NButton size="small" :type="quickRange === 60 ? 'primary' : 'default'" :ghost="quickRange === 60" @click="quickRange = 60;handleQuery()">{{ $t('page.repairReport.last60Days') }}</NButton>
            <NButton size="small" :type="quickRange === 90 ? 'primary' : 'default'" :ghost="quickRange === 90" @click="quickRange = 90;handleQuery()">{{ $t('page.repairReport.last90Days') }}</NButton>
            <NButton size="small" :type="quickRange === 0 ? 'primary' : 'default'" :ghost="quickRange === 0" @click="quickRange = 0;handleQuery()">{{ $t('page.repairReport.all') }}</NButton>
          </div>
        </div>
        <div class="flex items-center gap-8px">
          <NButton type="primary" size="small" @click="handleQuery">
            <template #icon>
              <Icon icon="ant-design:search-outlined" />
            </template>
            {{ $t('common.search') }}
          </NButton>
          <NButton size="small" @click="handleReset">{{ $t('common.reset') }}</NButton>
        </div>
      </div>
    </NCard>

    <NTabs v-model:value="activeTab" type="line">
      <NTab name="site" :tab="$t('page.repairReport.siteDimensionAnalysis')" />
      <NTab name="station" :tab="$t('page.repairReport.stationDimensionAnalysis')" />
    </NTabs>
    <div v-if="activeTab === 'site'">
      <SiteInfo :start-date="queryStartDate" :end-date="queryEndDate" />
    </div>
    <div v-else>
      <StationInfo :start-date="queryStartDate" :end-date="queryEndDate"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { NButton, NCard, NTabs, NTab, NDatePicker, useMessage, NRadioGroup, NRadioButton } from 'naive-ui'
import { Icon } from '@iconify/vue'
import SiteInfo from './components/siteInfo.vue'
import StationInfo from './components/stationInfo.vue'
import dayjs from 'dayjs'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()

const periodMode = ref<'custom' | 'quick'>('quick')
const quickRange = ref<number>(60)
const customRange = ref<[number, number] | null>(null)
const activeTab = ref<'site' | 'station'>('site')
const loading = ref(false)

const queryStartDate = ref(dayjs().subtract(60, 'day').format('YYYY-MM-DD'))
const queryEndDate = ref(dayjs().format('YYYY-MM-DD'))

function handleQuery() {
  let start = ''
  let end = ''
  loading.value = true


  if (periodMode.value === 'quick') {
    if (quickRange.value === 0) {
      start = ''
      end = ''
    } else {
      end = dayjs().format('YYYY-MM-DD')
      start = dayjs().subtract(quickRange.value, 'day').format('YYYY-MM-DD')
    }
  } else if (customRange.value) {
    start = dayjs(customRange.value[0]).format('YYYY-MM-DD')
    end = dayjs(customRange.value[1]).format('YYYY-MM-DD')
  } else {
    // Default fallback
    end = dayjs().format('YYYY-MM-DD')
    start = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  }

  queryStartDate.value = start
  queryEndDate.value = end

  message.success(t('page.repairReport.searchSuccess'))
}

function handleReset() {
  periodMode.value = 'quick'
  quickRange.value = 30
  customRange.value = null
  // activeTab.value = 'site' // Keep current tab
  handleQuery() // Reset triggers query with default values
  message.success(t('page.repairReport.resetSuccess'))
}

watch([periodMode, quickRange, customRange], () => {
  // Optional: Auto-query on quick range change?
  // usually quick range buttons should trigger update.
  if (periodMode.value === 'quick') {
      // handleQuery() // Uncomment if auto-query is desired for quick range
  }
}, { immediate: false })

onMounted(() => {
  handleQuery()
})
</script>

<style scoped></style>
