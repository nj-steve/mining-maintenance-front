<template>
  <NButton text size="tiny" style="margin-right: 8px;" @click="open">
    <Icon icon="ant-design:edit-outlined" width="16" height="16" />
  </NButton>
  <NModal v-model:show="show" style="width: 600px" preset="card" title="修改故障机">
   
   
    <NForm :model="editForm" label-width="100">
       <NFormItem label="SN">
        <NInput  v-model:value="editForm.sn" />
      </NFormItem>
       <NFormItem label="型号">
        <NInput v-model:value="editForm.model" />
      </NFormItem>
       <NFormItem label="所属场地">
        <NSelect v-model:value="editForm.site_id" :options="sites" option-label="name" option-value="id" />
      </NFormItem>
     
      <NFormItem label="状态">
        <NSelect v-model:value="editForm.status" :options="statusOptions" option-label="name" option-value="value" />
      </NFormItem>

      <NFormItem label="描述">
        <NInput v-model:value="editForm.description" />
      </NFormItem>
    
     
        <NFormItem label="位置">
        <NInput v-model:value="editForm.location" />
      </NFormItem>
      
      <!-- 新增：下架时间 -->
      <NFormItem label="下架时间">
        <NDatePicker v-model:value="editForm.down_time_ts" type="date" clearable placeholder="选择下架日期" />
      </NFormItem>
      <!-- 新增：上架时间 -->
      <NFormItem label="上架时间">
        <NDatePicker v-model:value="editForm.on_shelf_time_ts" type="date" clearable placeholder="选择上架日期" />
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
import { NButton, NModal, NForm, NFormItem, NSelect, NSpace, useMessage, NDatePicker } from 'naive-ui'
import { updateFaults } from '@/service/api/faults'
import { Icon } from '@iconify/vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

interface Faults {
  id: number;
  description?: string;
  location?: string;
  model?: string;
  site_id?: number;
  sn?: string;
  status?: number;
  warranty_status?: number;
  down_time?: string;
  on_shelf_time?: string;
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
const editForm = ref<{ 
  id: number; 
  description: string; 
  location: string; 
  model: string; 
  site_id: number; 
  sn: string; 
  status: number | null; 
  warranty_status: number;
  down_time_ts: number | null;
  on_shelf_time_ts: number | null;
}>({
  id: props.row.id,
  description: props.row.description ?? '',
  location: props.row.location ?? '',
  model: props.row.model ?? '',
  site_id: props.row.site_id ?? 0,
  sn: props.row.sn ?? '',
  status: props.row.status_value ?? null,
  warranty_status: props.row.warranty_status ?? 0,
  down_time_ts: props.row.date ? new Date(props.row.date).getTime() : null,
  on_shelf_time_ts: props.row.on_shelf_time ? new Date(props.row.on_shelf_time).getTime() : null,
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
    down_time_ts: props.row.date ? new Date(props.row.date).getTime() : null,
    on_shelf_time_ts: props.row.on_shelf_time ? new Date(props.row.on_shelf_time).getTime() : null,
  }
  show.value = true
}

const save = async () => {
  try {
    // 使用 dayjs 按 Asia/Shanghai 时区格式化为 YYYY-MM-DD
    const formatDate = (ts: number | null) =>
      ts ? dayjs(ts).tz('Asia/Shanghai').format('YYYY-MM-DD') : undefined;
    const params: any = {
      description: editForm.value.description,
      location: editForm.value.location ?? '',
      model: editForm.value.model ?? '',
      site_id: editForm.value.site_id ?? 0,
      sn: editForm.value.sn ?? '',
      status: editForm.value.status ?? 1,
      warranty_status: editForm.value.warranty_status?? 0,
      down_time: editForm.value.down_time_ts ?? null,
      on_shelf_time: editForm.value.on_shelf_time_ts ?? null,
    };
    const downStr = formatDate(editForm.value.down_time_ts);
    const onShelfStr = formatDate(editForm.value.on_shelf_time_ts);
    if (downStr) params.down_time = downStr;
    if (onShelfStr) params.on_shelf_time = onShelfStr;

    const { error, response: { data } } = await updateFaults(props.row.id,params);
    console.log(error, data);
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
