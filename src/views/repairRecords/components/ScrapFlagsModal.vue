<script setup lang="ts">
import { ref, watch, computed,h } from 'vue'
import { NModal, NButton, useMessage, NSpace, NDataTable, NRadioGroup, NRadio } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { fetchRepairDetailInfo, updateRepairDetail } from '@/service/api/repair'

interface Props {
  show: boolean
  detailId: number | null
  // 当前行数据（包含各 SN 值）
  detailRow?: Record<string, any> | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'success'): void
}>()

const message = useMessage()
const loading = ref(false)

// 仅提供功能状态单选：正常=2，损坏=1
const formModel = ref({
  board_sn1_flag: 0,
  board_sn2_flag: 0,
  board_sn3_flag: 0,
  control_sn_flag: 0,
  power_sn_flag: 0,
  sn_flag: 0
})

type RowItem = {
  key: keyof typeof formModel.value
  name: string
  sn: string
}
const tableRows = ref<RowItem[]>([])

const visible = computed({
  get: () => props.show,
  set: (v: boolean) => emit('update:show', v)
})

function buildTableRows() {
  const r = props.detailRow || {}
  // console.log("repair detail row:", r)
  tableRows.value = [
    // { key: 'sn_flag', name: '整机 SN', sn: r.DeviceSN || '' },
    { key: 'control_sn_flag', name: '控制板 SN', sn: r.ControlSN || '' },
    { key: 'power_sn_flag', name: '电源 SN', sn: r.PowerSN || '' },
    { key: 'board_sn1_flag', name: '板1 SN', sn: r.BoardSN1 || '' },
    { key: 'board_sn2_flag', name: '板2 SN', sn: r.BoardSN2 || '' },
    { key: 'board_sn3_flag', name: '板3 SN', sn: r.BoardSN3 || '' }
  ]
}

async function loadDetail() {
  if (!props.detailId) return
  loading.value = true
  try {
    const { data, error } = await fetchRepairDetailInfo(props.detailId)
    console.log("repair detail info:", data)
    if (error === null && data) {
      formModel.value = {
        board_sn1_flag: Number(data.board_sn1_flag ?? 0),
        board_sn2_flag: Number(data.board_sn2_flag ?? 0),
        board_sn3_flag: Number(data.board_sn3_flag ?? 0),
        control_sn_flag: Number(data.control_sn_flag ?? 0),
        power_sn_flag: Number(data.power_sn_flag ?? 0),
        sn_flag: Number(data.sn_flag ?? 0)
      }
    }
    //  else {
    //   message.error(`加载标记失败：${error}`)
    // }
  } catch (err) {
    message.error('加载标记失败')
  } finally {
    buildTableRows()
    loading.value = false
  }
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      buildTableRows()
      loadDetail()
    }
  }
)

watch(
  () => props.detailRow,
  () => {
    if (props.show) buildTableRows()
  }
)

async function handleSave() {
  if (!props.detailId) {
    message.error('缺少维修明细 ID')
    return
  }
  loading.value = true
  try {
    const { error } = await updateRepairDetail(props.detailId, { ...formModel.value })
    if (error === null) {
      message.success('保存成功')
      emit('success')
      emit('update:show', false)
    } else {
      message.error('保存失败')
    }
  } catch (err) {
    message.error('保存失败')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('update:show', false)
}

const columns: DataTableColumns<RowItem> = [
  { title: () => h('span', { class: 'text-sm text-gray-500' }, '部件名称'), key: 'name', width: 80, render: (row) => (
    h('span', { class: 'text-sm text-gray-500' }, row.name)
  ) },
  { title: () => h('span', { class: 'text-sm text-gray-500' }, '序列号'), width: 150, key: 'sn', render: (row) => (
    h('span', { class: 'text-sm text-gray-500' }, row.sn || '-')
  ) },
  { title: () => h('span', { class: 'text-sm text-gray-500' }, '功能状态'), key: 'flag', width: 140, render: (row) => (
    h(NRadioGroup, {
      value: (formModel.value as any)[row.key],
      'onUpdate:value': (v: number) => ((formModel.value as any)[row.key] = v)
    }, {
      default: () => [
        h(NRadio, {class: 'text-sm text-green-500', value: 2 }, { default: () => '正常' }),
        h(NRadio, { class: 'text-sm text-red-500', value: 1, 
        style: 'margin-left: 16px;' }, 
        { default: () => '损坏' }) 
      ]
    })
  ) }
]
</script>

<template>
  <NModal size="large" v-model:show="visible" preset="dialog" title="报废标记" :mask-closable="false" >
    <NDataTable :columns="columns" :data="tableRows" size="medium" />
    <NSpace justify="end" style="margin-top: 12px;">
      <NButton size="small" ghost @click="handleCancel">取消</NButton>
      <NButton size="small" type="primary" :loading="loading" @click="handleSave">保存</NButton>
    </NSpace>
  </NModal>
</template>

<style scoped>
</style>
