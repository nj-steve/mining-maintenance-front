<script setup lang="ts">
import { ref, watch, computed,h } from 'vue'
import { NDrawer, NDrawerContent, NButton, useMessage, NSpace, NDataTable, NRadioGroup, NRadio, NInput } from 'naive-ui'
import QiniuImageUpload from '@/components/upload/QiniuImageUpload.vue'
import type { DataTableColumns } from 'naive-ui'
import { fetchRepairDetailsByID,fetchScrapsDetailInfo, updateRepairDetail } from '@/service/api/repair'
import { updateRepairDetails } from '@/service/api/repair'
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs';

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
  // sn_flag: 0
})

type RowItem = {
  key: keyof typeof formModel.value
  name: string
  sn: string
}
const tableRows = ref<RowItem[]>([])
const editRow =ref({
    date: dayjs().format('YYYY-MM-DD'),
    work_order_no: "",
    machine_model: "",
    repairStation: "",
    device_sn: "",
    powerSN: "",
    defect_code_2: "",
    defect_code_3: "",
    // boardSN: ["BRD120240118001234556", "BRD220240118001234556", "BRD320240118001234556"],
    repair_component: "",
    defect_reason: "",
    defect_code: "",
    control_sn: "",
    board_sn_1: "",
    board_sn_2: "",
    board_sn_3: "",
    position: "",
    verify_defect: "",
    images: "",
    repair_image_urls: "",
    start_time: dayjs().format('YYYY-MM-DD HH:mm'),
    end_time: dayjs().format('YYYY-MM-DD HH:mm'),
    repair_result: 0,
    repairer_name: "",
    power_sn: "",
    motherboard_sn: "",
    extra_operations: ""
    
  })
const newestRow = ref<Record<string, any> | null>(null)

  
// 当前正在编辑的行（按 key 标识）与输入值
const editingKey = ref<RowItem['key'] | null>(null)
const editingValue = ref('')

// 图片编辑态（显示上传组件）
const isImageEditing = ref(false)

const visible = computed({
  get: () => props.show,
  set: (v: boolean) => emit('update:show', v)
})

function buildTableRows() {
  const r = newestRow.value || props.detailRow || {}
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
    const { data, error } = await fetchRepairDetailsByID(props.detailId)
    // console.log("repair detail info:", data)
    if (error === null && data) {
      const detail = data;
      editRow.value = {
          date: detail.Date ? dayjs(detail.Date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          work_order_no: detail.WorkOrderNo || '',
          machine_model: detail.MachineModel || '',
          repairStation: detail.RepairStationName || '',
          device_sn: detail.DeviceSN || '',
          powerSN: detail.PowerSN || '',
          defect_code_2: detail.DefectCode2 || '',
          defect_code_3: detail.DefectCode3 || '',
          // boardSN: detail.BoardSN ? detail.BoardSN.split(',') : [],
          repair_component: detail.RepairComponent || '',
          defect_reason: detail.DefectReason || '',
          defect_code: detail.DefectCode || '',
          control_sn: detail.ControlSN || '',
          board_sn_1: detail.BoardSN1 || '',
          board_sn_2: detail.BoardSN2 || '',
          board_sn_3: detail.BoardSN3 || '',
          position: detail.Position || '',
          verify_defect: detail.VerifyDefect || '',
          images:detail.RepairImageUrls ? detail.RepairImageUrls.split(',') : [],
          repair_image_urls: detail.RepairImageUrls || '',
          start_time: detail.StartTime ? dayjs(detail.StartTime).format('YYYY-MM-DD HH:mm') : dayjs().format('YYYY-MM-DD HH:mm'),
          end_time: detail.EndTime ? dayjs(detail.EndTime).format('YYYY-MM-DD HH:mm') : dayjs().format('YYYY-MM-DD HH:mm'),
          repair_result: detail.RepairResult ?? 1,
          repairer_name: detail.RepairerName || '',
          power_sn: detail.PowerSN || '',
          motherboard_sn: detail.BoardSN || '',
          extra_operations: detail.extra_operations || ''
        };
      newestRow.value = detail
     
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

async function loadScrapFlagDetail(){
  if (!props.detailId) return
  loading.value = true
  try {
    const { data, error } = await fetchScrapsDetailInfo(props.detailId)
    if (error === null && data) {
      formModel.value = {
        board_sn1_flag: Number(data.board_sn1_flag ?? 0),
        board_sn2_flag: Number(data.board_sn2_flag ?? 0),
        board_sn3_flag: Number(data.board_sn3_flag ?? 0),
        control_sn_flag: Number(data.control_sn_flag ?? 0),
        power_sn_flag: Number(data.power_sn_flag ?? 0),
        // sn_flag: Number(data.sn_flag ?? 0)
      }
  }
} finally {
  loading.value = false
}
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      buildTableRows()
      loadScrapFlagDetail()
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
    // 先保存图片（维修详情字段）
    // const payload: Record<string, any> = {
    //   ...editRow.value,
      // repair_image_urls: Array.isArray(editRow.value.images) ? editRow.value.images.join(',') : ''
    // }
    // const { error: imgError } = await updateRepairDetails(props.detailId, payload)
    // 再保存功能状态标记
    const { error: flagError } = await updateRepairDetail(props.detailId, { ...formModel.value })
    if (flagError === null) {
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

function startEdit(row: RowItem) {
  editingKey.value = row.key
  editingValue.value = row.sn || ''
}

function cancelEditInline() {
  editingKey.value = null
  editingValue.value = ''
}

function startEditImages() {
  isImageEditing.value = true
}

function cancelEditImages() {
  isImageEditing.value = false
}

async function saveImagesOnly() {
  if (!props.detailId) {
    message.error('缺少维修明细 ID')
    return
  }
  try {
    loading.value = true
    const payload: Record<string, any> = {
      ...editRow.value,
      repair_image_urls: Array.isArray(editRow.value.images) ? editRow.value.images.join(',') : ''
    }
    const { error } = await updateRepairDetails(props.detailId, payload)
    if (error === null) {
      message.success('图片已添加')
      isImageEditing.value = false
    } else {
      message.error('保存失败')
    }
  } catch (err) {
    message.error('保存失败')
  } finally {
    loading.value = false
  }
}

function getSnFieldByKey(key: RowItem['key']): string | null {
  const map: Record<RowItem['key'], string> = {
    control_sn_flag: 'control_sn',
    power_sn_flag: 'power_sn',
    board_sn1_flag: 'board_sn_1',
    board_sn2_flag: 'board_sn_2',
    board_sn3_flag: 'board_sn_3',
    // sn_flag: 'DeviceSN'
  }
  return map[key] ?? null
}
// 保存序列号；若未传 row，则保存图片
async function saveSnInline(row?: RowItem) {
  if (!row) {
    return await saveImagesOnly()
  }
  if (!props.detailId) {
    message.error('缺少维修明细 ID')
    return
  }
  const field = getSnFieldByKey(row.key)
  if (!field) {
    message.error('未知部件，无法保存')
    return
  }
  const value = editingValue.value.trim()
  if (!value) {
    message.warning('请输入有效的序列号')
    return
  }
  try {
    loading.value = true

    const payload: Record<string, any> = { ...editRow.value, [field]: value }
    
    const { data,error } = await updateRepairDetails(props.detailId, payload)
    // console.log("update repair details:", data)
    if (error === null ) {
      // 更新本地显示
      const idx = tableRows.value.findIndex(r => r.key === row.key)
      if (idx >= 0) tableRows.value[idx].sn = value
      message.success('序列号已保存')
      cancelEditInline()
    } else {
      message.error('保存失败')
    }
  } catch (err) {
    message.error('保存失败')
  } finally {
    loading.value = false
  }
}

const columns: DataTableColumns<RowItem> = [
  { title: () => h('span', { class: 'text-sm text-gray-500' }, '部件名称'), key: 'name', width: 80, render: (row) => (
    h('span', { class: 'text-sm text-gray-500' }, row.name)
  ) },
  { title: () => h('span', { class: 'text-sm text-gray-500' }, '序列号'), width: 200, key: 'sn', render: (row) => {
    const isEditing = editingKey.value === row.key
    if (isEditing) {
      return h('div', { style: 'display:flex; align-items:center; gap:8px;' }, [
        h(NInput, {
          value: editingValue.value,
          'onUpdate:value': (v: string) => (editingValue.value = v),
          size: 'small',
          class: 'text-sm',
          placeholder: '请输入序列号',
          style: 'width: 110px'
        }),
        h(NButton, {
          size: 'small',
          type: 'primary',
          class: 'text-sm',
          onClick: () => saveSnInline(row)
        }, { default: () => '保存' }),
        h(NButton, {
          size: 'small',
          ghost: true,
          class: 'text-sm',
          onClick: () => cancelEditInline()
        }, { default: () => '取消' })
      ])
    }
    // 非编辑态：若为空，显示占位和编辑按钮；否则直接显示
    if (!row.sn) {
      return h('div', { style: 'display:flex; align-items:center; gap:8px;' }, [
        h('span', { class: 'text-sm text-gray-500' }, '-'),
        h(NButton, {
          size: 'small',
          quaternary: true,
          onClick: () => startEdit(row)
        }, {
          default: () => h(Icon, { icon: 'mdi:pencil', width: 18, height: 18 })
        })
      ])
    }
    return h('span', { class: 'text-sm text-gray-500' }, row.sn)
  } },
  { title: () => h('span', { class: 'text-sm text-gray-500' }, '功能状态'), key: 'flag', width: 220, render: (row) => (
    h(NRadioGroup, {
      value: (formModel.value as any)[row.key],
      'onUpdate:value': (v: number) => ((formModel.value as any)[row.key] = v)
    }, {
      default: () => [
        h(NRadio, {class: 'text-sm text-red-500', value: 2}, { default: () => '正常' }),
        h(NRadio, {class: 'text-sm text-green-500', value: 1,style:'margin-left: 2px;' }, { default: () => '损坏' }),
        h(NRadio, {class: 'text-sm text-gray-500', value: 0,style:'margin-left: 2px;' }, { default: () => '全不选' }),
      ]
    })
  ) }
]
</script>

<template>
  <NDrawer v-model:show="visible" placement="right" :width="550" :mask-closable="false">
    <NDrawerContent title="部件标记">
      <NDataTable :columns="columns" :data="tableRows" size="small" />
      <!-- 维修部位图片 -->
      <div class="mt-4 border border-gray-200 p-4 rounded" >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm text-gray-500">维修部位图片</span>
          <template v-if="!isImageEditing">
            <NButton text size="small" class="text-sm" @click="startEditImages">
              <Icon icon="ant-design:upload-outlined" width="16" height="16" />
              <span style="margin-left:4px">上传图</span>
            </NButton>
          </template>
        </div>

        <template v-if="!isImageEditing">
          <div class="flex gap-2 text-sm text-gray-600" v-if="editRow && editRow.repair_image_urls" >
            <div v-for="img in (editRow as any).images.filter(Boolean)" :key="img" class="relative w-24 h-24">
              <img :src="img" class="w-24 h-24 object-cover rounded" />
            </div>
          </div>
        </template>

        <template v-else>
          <div class="text-sm text-gray-600">
            <QiniuImageUpload
              v-model:images="(editRow as any).images"
              :max="10"
              button-text="上传图片"
              @uploaded="(url: string) => (editRow as any).images.push(url)"
              @removed="(url: string) => (editRow as any).images = (editRow as any).images.filter((u: string) => u !== url)"
            />
          </div>
          <NSpace justify="end" style="margin-top: 8px;">
            <NButton size="small" ghost class="text-sm" @click="cancelEditImages">取消</NButton>
            <NButton size="small" type="primary" class="text-sm" :loading="loading" @click="saveSnInline()">添加</NButton>
          </NSpace>
        </template>
      </div>

      <NSpace justify="end" style="margin-top: 12px;">
        <NButton size="small" ghost @click="handleCancel">取消</NButton>
        <NButton size="small" type="primary" :loading="loading" @click="handleSave">保存</NButton>
      </NSpace>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
</style>
