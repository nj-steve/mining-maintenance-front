<template>
  <NDrawer v-model:show="visible" placement="right" :width="320">
    <NDrawerContent :title="t('page.scrapMachine.detailTitle')">
      <div v-if="item" class="grid grid-cols-1 md:grid-cols-1 gap-x-4 gap-y-6">
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.scrapNo') }}</div><div class="flex-1 text-base text-gray-900">{{ item.id }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.site') }}</div><div class="flex-1 text-base text-gray-900">{{ item.site_name }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.model') }}</div><div class="flex-1 text-base text-gray-900">{{ item.model }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.machineSn') }}</div><div class="flex-1 text-base text-gray-900">{{ item.sn }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.controlSn') }}</div>
        <div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.control_sn }}</span>
          <Icon :icon="flagIcon(item.control_sn_flag)" :class="flagClass(item.control_sn_flag)" width="16" height="16" /></div>
        </div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.board1Sn') }}</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.board_sn1 }}</span><Icon :icon="flagIcon(item.board_sn1_flag)" :class="flagClass(item.board_sn1_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.board2Sn') }}</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.board_sn2 }}</span><Icon :icon="flagIcon(item.board_sn2_flag)" :class="flagClass(item.board_sn2_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.board3Sn') }}</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.board_sn3 }}</span><Icon :icon="flagIcon(item.board_sn3_flag)" :class="flagClass(item.board_sn3_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.powerSn') }}</div><div class="flex-1 text-base text-gray-900 flex items-center"><span class="mr-2">{{ item.power_sn }}</span><Icon :icon="flagIcon(item.power_sn_flag)" :class="flagClass(item.power_sn_flag)" width="16" height="16" /></div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.status') }}</div><div class="flex-1 text-base text-gray-900">{{ statusLabel(item.status) }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.scrapDate') }}</div><div class="flex-1 text-base text-gray-900">{{ item.scrap_time }}</div></div>
        <div class="flex items-center"><div class="w-24 text-sm text-gray-500">{{ t('page.scrapMachine.scrapCount') }}</div><div class="flex-1 text-base text-gray-900">{{ item.scrap_count }} {{ t('page.scrapMachine.times') }}</div></div>
      </div>
      <div v-else class="text-gray-500">{{ t('page.scrapMachine.noData') }}</div>
    </NDrawerContent>
  </NDrawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
  if (status === 1) return t('page.scrapMachine.pendingProcess')
  if (status === 2) return t('page.scrapMachine.pendingReview')
  if (status === 3) return t('page.scrapMachine.approved')
  if (status === 4) return t('page.scrapMachine.repaired')
  return t('page.scrapMachine.unknown')
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
