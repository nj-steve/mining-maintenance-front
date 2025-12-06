<template>
  <div class="flex flex-col sm:flex-row gap-4">
    <!-- SN 搜索 -->
    <div class="relative w-64">
      <input
        placeholder="搜索 SN 编号..."
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        :value="sn"
        @input="onSnInput($event)"
      />
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <i class="fas fa-search text-gray-400"></i>
      </div>
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
      <select
        class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md"
        :value="status ?? ''"
        @change="onStatusChange($event)"
      >
        <option value="">全部状态</option>
        <option :value="3">待审核</option>
        <option :value="1">待处理</option>
        <option :value="2">已审批</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SiteOption {
  label: string
  value: number | string | null
}

const props = defineProps<{
  sn: string
  siteId: number | null
  status: number | null
  siteOptions: SiteOption[]
}>()

const emit = defineEmits<{
  (e: 'update:sn', v: string): void
  (e: 'update:siteId', v: number | null): void
  (e: 'update:status', v: number | null): void
  (e: 'change'): void
}>()

function onSnInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:sn', v)
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
</script>

<style scoped>
</style>

