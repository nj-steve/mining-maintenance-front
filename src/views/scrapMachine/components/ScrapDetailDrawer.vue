<template>
  <NDrawer v-model:show="visible" placement="right" :width="320">
    <NDrawerContent title="报废机详情">
      <div v-if="item" class="grid grid-cols-1 md:grid-cols-1 gap-x-4 gap-y-6">
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">编号</div><div class="flex-1 text-base text-gray-900">{{ item.id }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">场地</div><div class="flex-1 text-base text-gray-900">{{ item.site_name }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">机型</div><div class="flex-1 text-base text-gray-900">{{ item.model }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">整机 SN</div><div class="flex-1 text-base text-gray-900">{{ item.sn }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">控制板 SN</div>
        <div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.control_sn }}</span>
          <Icon :icon="flagIcon(item.control_sn_flag)" :class="flagClass(item.control_sn_flag)" width="16" height="16" /></div>
        </div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">板1 SN</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.board_sn1 }}</span><Icon :icon="flagIcon(item.board_sn1_flag)" :class="flagClass(item.board_sn1_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">板2 SN</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.board_sn2 }}</span><Icon :icon="flagIcon(item.board_sn2_flag)" :class="flagClass(item.board_sn2_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">板3 SN</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.board_sn3 }}</span><Icon :icon="flagIcon(item.board_sn3_flag)" :class="flagClass(item.board_sn3_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">电源 SN</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.power_sn }}</span><Icon :icon="flagIcon(item.power_sn_flag)" :class="flagClass(item.power_sn_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">状态</div><div class="flex-1 text-base text-gray-900">{{ statusLabel(item.status) }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">报废日期</div><div class="flex-1 text-base text-gray-900">{{ item.scrap_time }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">报废次数</div><div class="flex-1 text-base text-gray-900">{{ item.scrap_count }} 次</div></div>
      </div>
      <div v-else class="text-gray-500">暂无数据</div>
    </NDrawerContent>
  </NDrawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { Icon } from '@iconify/vue'

interface ScrapItemApi {
  id: number
  site_name: string
  model: string
  sn: string
  control_sn: string
  board_sn1: string
  board_sn2: string
  board_sn3: string
  power_sn: string
  status: number
  scrap_time: string
  scrap_count: number
  control_sn_flag: number
  board_sn1_flag: number
  board_sn2_flag: number
  board_sn3_flag: number
  power_sn_flag: number
  sn_flag: number
}

const props = defineProps<{ show: boolean; item: ScrapItemApi | null }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>()

const visible = computed({
  get: () => props.show,
  set: v => emit('update:show', v)
})

function statusLabel(status: number) {
  if (status === 1) return '待处理'
  if (status === 2) return '待审核'
  if (status === 3) return '已审批'
  if (status === 4) return '已修复'
  return '未知'
}

// 标记图标与颜色（0: 未标注 -> 橙；2: 正常 -> 绿；1: 损坏 -> 红）
function flagIcon(flag: number) {
  return flag === 2
    ? 'mdi:check-circle'
    : flag === 1
    ? 'mdi:close-circle'
    : 'mdi:alert-circle-outline'
}

function flagClass(flag: number) {
  return flag === 2
    ? 'text-green-500'
    : flag === 1
    ? 'text-red-500'
    : 'text-orange-500'
}
</script>

<style scoped></style>
