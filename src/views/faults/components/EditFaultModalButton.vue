<template>
  <NButton type="info" ghost style="margin-right: 8px;" @click="open">
    修改
  </NButton>
  <NModal v-model:show="show" style="width: 600px" preset="card" title="修改矿机信息">
    <NForm :model="editForm" label-width="100">
      <NFormItem label="状态">
        <NSelect v-model:value="editForm.status_value" :options="statusOptions" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace>
        <NButton type="primary" @click="save">保存</NButton>
        <NButton @click="show = false">取消</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NModal, NForm, NFormItem, NSelect, NSpace, useMessage } from 'naive-ui'
import { updateFaultsStatus } from '@/service/api/faults'

interface Faults {
  id: number;
  status_value?: number;
  [key: string]: any;
}

const props = defineProps<{
  row: Faults
  statusOptions: Array<{ label: string; value: number }>
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const message = useMessage()

const show = ref(false)
const editForm = ref<{ id: number; status_value: number }>({
  id: props.row.id,
  status_value: props.row.status_value ?? 0
})

const open = () => {
  editForm.value = {
    id: props.row.id,
    status_value: props.row.status_value ?? 0
  }
  show.value = true
}

const save = async () => {
  try {
    const params = {
      status: editForm.value.status_value,
      fault_ids: [editForm.value.id]
    }
    const { error } = await updateFaultsStatus(params)
    if (error == null) {
      message.success('修改成功！')
      emit('updated')
    } else {
      message.error('修改失败:' + error)
    }
  } catch (err) {
    message.error('修改失败')
  } finally {
    show.value = false
  }
}
</script>