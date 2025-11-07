<template>
  <NButton type="info" ghost style="margin-right: 8px;" @click="open">
    修改描述
  </NButton>
  <NModal v-model:show="show" style="width: 600px" preset="card" title="修改故障描述">
    <NForm :model="editForm" label-width="100">
      <NFormItem label="描述">
        <NInput v-model:value="editForm.description" />
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
import { updateFaults } from '@/service/api/faults'

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
        message.success('修改成功！');
        emit('updated');
      }
    } 



    // console.log(response)
    // if (error==null &&  response?.data?.code == 0) {
    //   message.success('修改成功！')
    //   emit('updated')
    // } else {
    //   message.error('修改失败:' + response?.data?.msg)
    // }
  } catch (err) {
    message.error('修改失败')
  } finally {
    show.value = false
  }
}
</script>