<template>
  <NButton type="info" ghost style="margin-right: 8px;" @click="open">
    修改
  </NButton>
  <NModal v-model:show="show" style="width: 600px" preset="card" title="修改故障机">
   
   
    <NForm :model="editForm" label-width="100">
       <NFormItem label="SN">
        <NInput disabled v-model:value="editForm.sn" />
      </NFormItem>
       <NFormItem label="型号">
        <NInput v-model:value="editForm.model" />
      </NFormItem>
       <!-- <NFormItem label="所属场地">
        <NSelect v-model:value="editForm.site_id" :options="sites" option-label="name" option-value="id" />
      </NFormItem> -->
     
      <NFormItem label="状态">
        <NSelect v-model:value="editForm.status" :options="statusOptions" option-label="name" option-value="value" />
      </NFormItem>

      <NFormItem label="描述">
        <NInput v-model:value="editForm.description" />
      </NFormItem>
    
     
        <NFormItem label="位置">
        <NInput v-model:value="editForm.location" />
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
  row: Faults,
  sites: Array<{ label: string; value: number }>,
  statusOptions: Array<{ label: string; value: number }>,

}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const message = useMessage()

const show = ref(false)
const editForm = ref<{ id: number; description: string; location: string; model: string; site_id: number; sn: string; status: number; warranty_status: number }>({
  id: props.row.id,
  description: props.row.description ?? '',
  location: props.row.location ?? '',
  model: props.row.model ?? '',
  site_id: props.row.site_id ?? 0,
  sn: props.row.sn ?? '',
  status: props.row.status_value,
  warranty_status: props.row.warranty_status ?? 0,
})

const open = () => {
  editForm.value = {
    id: props.row.id,
    description: props.row.description ?? '',
    location: props.row.location ?? '',
    model: props.row.model ?? '',
    site_id: props.row.site_id ?? 0,
    sn: props.row.sn ?? '',
    status: props.row.status_value ?? null,
    warranty_status: props.row.warranty_status ?? 0,
  }
  show.value = true
}

const save = async () => {
  try {
    const params = {
      description: editForm.value.description,
      location: editForm.value.location ?? '',
      model: editForm.value.model ?? '',
      site_id: props.row.site_id ?? 0,
      sn: props.row.sn ?? '',
      status: editForm.value.status ?? 1,
      warranty_status: props.row.warranty_status?? 0,
    }
    // const { error } = await updateFaults(props.row.id,params)
    // if (error == null) {
    //   message.success('修改成功！')
    //   emit('updated')
    // }

    const { error, response: { data } } = await updateFaults(props.row.id,params);
    // console.log('创建工单响应:', data, error);
    // console.log('data.code', data?.code);

    if (error == null) {
      if (Number(data?.code) == 0) {
        message.success('修改成功!');
        emit('updated');
      }
    } 



  } catch (err) {
    message.error('修改失败')
  } finally {
    show.value = false
  }
}
</script>