<template>
  <NModal v-model:show="localShow" style="width: 500px" preset="card" :title="t('page.workflow.addOrderLogTitle')">
    <NForm :model="form" label-width="100">
      <!-- 工单状态 -->
      <NFormItem :label="t('page.workflow.orderStatus')" required>
        <NSelect
          v-model:value="form.order_status"
          :options="statusOptions"
          :placeholder="t('page.workflow.pleaseSelectOrderStatus')"
        />
      </NFormItem>

      <!-- 操作时间 -->
      <NFormItem :label="t('page.workflow.operationTime')" required>
        <NDatePicker
          v-model:value="form.occurred_at"
          type="datetime"
          :placeholder="t('page.workflow.pleaseSelectOperationTime')"
          style="width: 100%"
        />
      </NFormItem>

      <!-- 操作描述 -->
      <NFormItem :label="t('page.workflow.operationDescription')" required>
        <NInput
          v-model:value="form.description"
          size="small"
          type="textarea"
          :placeholder="t('page.workflow.pleaseEnterOperationDescription')"
          :rows="4"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NButton type="primary" @click="handleSubmit" style="margin-right: 8px; font-size: 12px;">{{ t('page.workflow.confirmAdd') }}</NButton>
      <NButton @click="close">{{ t('page.workflow.cancel') }}</NButton>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import dayjs from 'dayjs';
import { NModal, NForm, NFormItem, NSelect, NDatePicker, NInput, NButton, useMessage } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { createOrdersLog } from '@/service/api/workflow';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
    message.error(t('page.workflow.pleaseSelectOrderStatus'));
    return;
  }
  if (!form.value.description.trim()) {
    message.error(t('page.workflow.pleaseEnterOperationDescription'));
    return;
  }
  try {
    const { error } = await createOrdersLog(props.orderId, {
      status: form.value.order_status,
      date_time: dayjs(form.value.occurred_at).format('YYYY-MM-DD HH:mm:ss'),
      remark: form.value.description
    });
    if (error) {
      message.error(`${t('page.workflow.addLogFailed')}: ${error}`);
      return;
    }
    message.success(t('page.workflow.addLogSuccess'));
    emit('submitted');
    close();
  } catch (err) {
    message.error(t('page.workflow.addLogFailed'));
  }
};
</script>
