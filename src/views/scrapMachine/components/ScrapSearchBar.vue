<template>
  <div class="flex flex-col sm:flex-row gap-4">
    <!-- SN 搜索 -->
    <div class="relative w-64">
      <input
        placeholder="搜索 SN 编号..."
        class="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        :value="sn"
        @input="onSnInput($event)"
      />
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon icon="ant-design:search-outlined" width="16" height="16" class="text-gray-400" />
      </div>
      <!-- 清除按钮：有内容时显示 -->
      <button
        v-if="sn && sn.length > 0"
        type="button"
        style="background-color: transparent;"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm"
        @click="clearSn"
        aria-label="清除"
        title="清除"
      >
        <Icon icon="ant-design:close-circle-outlined" width="16" height="16" />
      </button>
    </div>

    <!-- 场地筛选 -->
    <div class="relative">
      <select
        class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md"
        :value="siteId ?? ''"
        @change="onSiteChange($event)"
      >
        <option value="">全部场地</option>
        <option
          v-for="opt in siteOptions"
          :key="String(opt.value)"
          :value="String(opt.value)"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- 状态筛选 -->
    <div class="relative">
      <!-- // 1: 待处理；2:待审核；3:已审批；4: 已修复  -->
      <select
        class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md"
        :value="status ?? ''"
        @change="onStatusChange($event)"
      >
        <option value="">全部状态</option>
        <option :value="1">待处理</option>
        <option :value="2">待审核</option>
        <option :value="3">已审批</option>
        <option :value="4">已修复</option>
      </select>
    </div>

    <!--维修次数-->
    <div class="relative">
      <select
        class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md"
        :value="scrap_count ?? ''"
        @change="onScrapCountChange($event)"
      >
        <option value="">全部维修次数</option>
        <option :value="0">0次</option>
        <option :value="1">1次</option>
        <option :value="2">2次</option>
        <option :value="3">3次</option>
        <option :value="4">4次</option>
        <option :value="5">5次</option>
        <option :value="6">6次</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
interface SiteOption {
  label: string
  value: number | string | null
}

const props = defineProps<{
  sn: string
  siteId: number | null
  status: number | null
  siteOptions: SiteOption[]
  scrap_count: number | null
}>()

const emit = defineEmits<{
  (e: 'update:sn', v: string): void
  (e: 'update:siteId', v: number | null): void
  (e: 'update:status', v: number | null): void
  (e: 'update:scrap_count', v: number | null): void
  (e: 'change'): void
}>()

function onSnInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:sn', v)
  emit('change')
}

function clearSn() {
  emit('update:sn', '')
  emit('change')
}

function onSiteChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  const v = raw === '' ? null : Number(raw)
  emit('update:siteId', isNaN(v as number) ? null : (v as number))
  emit('change')
}

function onStatusChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  const v = raw === '' ? null : Number(raw)
  emit('update:status', isNaN(v as number) ? null : (v as number))
  emit('change')
}

function onScrapCountChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  const v = raw === '' ? null : Number(raw)
  emit('update:scrap_count', isNaN(v as number) ? null : (v as number))
  emit('change')
}
</script>

<style scoped>
</style>
