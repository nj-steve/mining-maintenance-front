<template>
  <NButton type="info" ghost style="margin-right: 8px;" @click="open">
    {{ t('page.faults.editFault.edit') }}
  </NButton>
  <NModal v-model:show="show" style="width: 600px" preset="card" :title="t('page.faults.editFault.editFaultInfo')">
    <NForm :model="editForm" label-width="100">
      <NFormItem :label="t('page.faults.editFault.status')">
        <NSelect v-model:value="editForm.status_value" :options="statusOptions" :placeholder="t('page.faults.batchStatus.pleaseSelectStatus')" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace>
        <NButton type="primary" @click="save">{{ t('page.faults.editFault.save') }}</NButton>
        <NButton @click="show = false">{{ t('page.faults.editFault.cancel') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NModal, NForm, NFormItem, NSelect, NSpace, useMessage } from 'naive-ui'
import { updateFaultsStatus } from '@/service/api/faults'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
      message.success(t('page.faults.editFault.editSuccess'))
      emit('updated')
    } else {
      message.error(t('page.faults.editFault.editFailed') + ':' + error)
    }
  } catch (err) {
    message.error(t('page.faults.editFault.editFailed'))
  } finally {
    show.value = false
  }
}
</script>
