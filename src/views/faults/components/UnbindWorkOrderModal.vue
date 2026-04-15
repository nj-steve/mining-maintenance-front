<template>
  <!-- 触发按钮 -->
  <NButton
    type="error"
    ghost
    size="small"
    :disabled="withOrderRows.length === 0"
    @click="handleOpenModal"
  >
    {{ t('page.faults.unbindWorkOrder.unbindWorkOrder') }} ({{ withOrderRows.length }})
  </NButton>

  <!-- 解绑工单弹框 -->
  <NModal v-model:show="visible" style="width: 700px" preset="card" :title="t('page.faults.unbindWorkOrder.unbindWorkOrderModalTitle')">
    <NForm label-width="120">
      <NAlert type="warning" :title="t('page.faults.unbindWorkOrder.tip')" style="margin-bottom: 12px;">
        {{ t('page.faults.unbindWorkOrder.unbindTipContent') }}
      </NAlert>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <NFormItem :label="t('page.faults.unbindWorkOrder.waitUnbindCount')">
          <NInput size="small" :value="withOrderRows.length.toString()" readonly />
        </NFormItem>
        <NFormItem :label="t('page.faults.unbindWorkOrder.totalSelectCount')">
          <NInput size="small" :value="props.selectedRows.length.toString()" readonly />
        </NFormItem>
      </div>

      <NFormItem :label="t('page.faults.unbindWorkOrder.waitUnbindList')">
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e6; border-radius: 6px; padding: 12px; width: 100%;">
          <div
            v-for="machine in withOrderRows"
            :key="machine.id"
            style="display: flex; justify-content: space-evenly; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; width: 100%;"
          >
            <!-- <div> -->
              <div style="font-weight: 500;font-size: 12px; color: #666;">{{ machine.sn }}</div>
              <div style="font-size: 12px; color: #666;">
                {{ t('page.faults.unbindWorkOrder.workOrder') }}{{ machine.order_no }} | {{ t('page.faults.unbindWorkOrder.site') }}{{ machine.Site?.name || machine.site_name }}
              </div>
            <!-- </div> -->
            <NTag type="error" size="small">{{ t('page.faults.unbindWorkOrder.waitUnbind') }}</NTag>
          </div>
        </div>
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace>
      <NPopconfirm
        :negative-text="t('page.faults.unbindWorkOrder.cancel')"
        :positive-text="t('page.faults.unbindWorkOrder.confirmUnbind')"
        @positive-click="handleSubmit"
      >
        <template #trigger>
          <NButton type="error">{{ t('page.faults.unbindWorkOrder.unbind') }}</NButton>
        </template>
        {{ t('page.faults.unbindWorkOrder.confirmUnbindTip') }}
      </NPopconfirm>
      <NButton @click="handleCancel">{{ t('page.faults.unbindWorkOrder.close') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton, NModal, NForm, NFormItem, NInput, NTag, NAlert, NPopconfirm, useMessage, NSpace } from 'naive-ui';
import { unbindFaultsToOrder } from '@/service/api/faults';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const message = useMessage();

interface Faults {
  id: number;
  serial_number: string;
  sn?: string;
  serial_number_source?: string;
  order_no?: string;
  status_text?: string;
  site_name?: string;
  Site?: {
    id?: number;
    name?: string;
  };
}

interface Props {
  selectedRows: Faults[];
}

interface Emits {
  (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);

// 已绑定工单的机器列表
console.log("props.selectedRows",props.selectedRows)
const withOrderRows = computed(() => props.selectedRows.filter(row => (row.order_no ?? '').toString().trim().length > 0));

// 打开弹框
const handleOpenModal = () => {
  if (props.selectedRows.length === 0) {
    message.warning(t('page.faults.unbindWorkOrder.pleaseSelectMachine'));
    return;
  }
  if (withOrderRows.value.length === 0) {
    message.info(t('page.faults.unbindWorkOrder.noNeedUnbind'));
    return;
  }
  visible.value = true;
};

// 提交解绑
const handleSubmit = async () => {
  const faultIds = withOrderRows.value.map(row => row.id);
  if (faultIds.length === 0) {
    message.error(t('page.faults.unbindWorkOrder.notFoundUnbindMachine'));
    return;
  }

  try {

    const { error, response: { data } } = await unbindFaultsToOrder({ fault_ids: faultIds });

    if (error == null) {
      if (Number(data?.code) == 0) {
        message.success(t('page.faults.unbindWorkOrder.unbindSuccess'));
        visible.value = false;
        emit('refresh');
      }
    }

  } catch (err) {
    message.error(t('page.faults.unbindWorkOrder.unbindFailed'));
    console.error(err);
  }
};

const handleCancel = () => {
  visible.value = false;
};
</script>

<style scoped>
:deep(.n-base-selection .n-base-selection-placeholder){
  font-size: 12px !important;
}
:deep(.n-base-selection-overlay){
  font-size: 12px !important;
}
:deep(.n-button){
  font-size: 12px !important;
}
:deep(.n-input-wrapper){
  font-size: 12px !important;
}
</style>
