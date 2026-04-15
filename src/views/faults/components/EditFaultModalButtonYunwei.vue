<template>
  <NButton type="info" ghost style="margin-right: 8px;" @click="open">
    {{ t('page.faults.editFault.editDesc') }}
  </NButton>
  <NModal v-model:show="show" style="width: 600px" preset="card" :title="t('page.faults.editFault.editFaultDesc')">
    <NForm :model="editForm" label-width="100">
      <NFormItem :label="t('page.faults.editFault.desc')">
        <NInput v-model:value="editForm.description" />
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
import { NButton, NModal, NForm, NFormItem, NSelect, NSpace, useMessage, NInput } from 'naive-ui'
import { updateFaults } from '@/service/api/faults'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Faults {
  id: number;
  description?: string;
  location?: string;
  model?: string;
  site_id?: number;
  sn?: string;
  status?: number;
  warranty_status?: number;
  [key: string]: any;
}

const props = defineProps<{
  row: Faults
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const message = useMessage()

const show = ref(false)
const editForm = ref<{ id: number; description: string }>({
  id: props.row.id,
  description: props.row.description ?? ''
})

const open = () => {
  editForm.value = {
    id: props.row.id,
    description: props.row.description ?? ''
  }
  show.value = true
}

const save = async () => {
  try {
    const params = {
      description: editForm.value.description,
      location: props.row.location ?? '',
      model: props.row.model ?? '',
      site_id: props.row.site_id ?? 0,
      sn: props.row.sn ?? '',
      status: props.row.status_value ?? 1,
      warranty_status: props.row.warranty_status ?? 0,
    }
    // const {error,response} = await updateFaults(props.row.id,params)


    const { error, response: { data } } = await updateFaults(props.row.id,params);

    if (error == null) {
      if (Number(data?.code) == 0) {
        message.success(t('page.faults.editFault.editSuccess'));
        emit('updated');
      }
    }

  } catch (err) {
    message.error(t('page.faults.editFault.editFailed'))
  } finally {
    show.value = false
  }
}
</script>
