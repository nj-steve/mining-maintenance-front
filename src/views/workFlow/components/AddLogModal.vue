<template>
  <NModal v-model:show="localShow" style="width: 500px" preset="card" title="添加工单操作日志">
    <NForm :model="form" label-width="100">
      <!-- 工单状态 -->
      <NFormItem label="工单状态" required>
        <NSelect 
          v-model:value="form.order_status"
          :options="statusOptions"
          placeholder="请选择工单状态"
        />
      </NFormItem>

      <!-- 操作时间 -->
      <NFormItem label="操作时间" required>
        <NDatePicker 
          v-model:value="form.occurred_at"
          type="datetime"
          placeholder="请选择操作时间"
          style="width: 100%"
        />
      </NFormItem>

      <!-- 操作描述 -->
      <NFormItem label="操作描述" required>
        <NInput 
          v-model:value="form.description"
          size="small"
          type="textarea"
          placeholder="请填写操作描述"
          :rows="4"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NButton type="primary" @click="handleSubmit" style="margin-right: 8px; font-size: 12px;">确认添加</NButton>
      <NButton @click="close">取消</NButton>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import dayjs from 'dayjs';
import { NModal, NForm, NFormItem, NSelect, NDatePicker, NInput, NButton, useMessage } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { createOrdersLog } from '@/service/api/workflow';

const props = defineProps<{
  show: boolean;
  orderId: number;
  defaultOrderStatus: number | null;
  statusOptions: SelectOption[];
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
  (e: 'submitted'): void;
}>();

const message = useMessage();

const localShow = computed({
  get: () => props.show,
  set: v => emit('update:show', v)
});

const form = ref({
  order_status: props.defaultOrderStatus as null | number,
  occurred_at: Date.now(),
  description: ''
});

watch(
  () => [props.show, props.defaultOrderStatus, props.orderId],
  () => {
    if (props.show) {
      form.value = {
        order_status: props.defaultOrderStatus as null | number,
        occurred_at: Date.now(),
        description: ''
      };
    }
  }
);

const close = () => {
  emit('update:show', false);
};

const handleSubmit = async () => {
  if (form.value.order_status === null) {
    message.error('请选择工单状态');
    return;
  }
  if (!form.value.description.trim()) {
    message.error('请填写操作描述');
    return;
  }
  try {
    const { error } = await createOrdersLog(props.orderId, {
      status: form.value.order_status,
      date_time: dayjs(form.value.occurred_at).format('YYYY-MM-DD HH:mm:ss'),
      remark: form.value.description
    });
    if (error) {
      message.error(`添加操作日志失败: ${error}`);
      return;
    }
    message.success('操作日志添加成功');
    emit('submitted');
    close();
  } catch (err) {
    message.error('添加操作日志失败');
  }
};
</script>