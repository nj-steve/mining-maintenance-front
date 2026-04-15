<template>
  <!-- 触发按钮 -->
  <NButton
    type="primary"
    ghost
    size="small"
    :disabled="selectedRows.length === 0"
    @click="handleOpenModal"
  >
    {{ t('page.faults.bindWorkOrder.bindWorkOrder') }} ({{ selectedRows.length }})
  </NButton>

  <!-- 绑定工单弹框 -->
  <NModal v-model:show="visible" style="width: 700px" preset="card" :title="t('page.faults.bindWorkOrder.bindWorkOrder')">
    <NForm :model="form" label-width="120">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <NFormItem :label="t('page.faults.bindWorkOrder.workOrderNo')" required>
          <NInput
            size="small"
            v-model:value="form.workOrderNo"
            :placeholder="t('page.faults.bindWorkOrder.inputWorkOrderNo')"
            style="font-size: 12px;"
          />
        </NFormItem>

        <NFormItem :label="t('page.faults.bindWorkOrder.workOrderDate')" required>
          <NInput
            size="small"
            v-model:value="form.workOrderDate"
            :placeholder="t('page.faults.bindWorkOrder.inputWorkOrderDate')"
            style="font-size: 12px;"
          />
        </NFormItem>

        <NFormItem :label="t('page.faults.bindWorkOrder.site')">
          <NInput size="small" :value="siteName" readonly />
        </NFormItem>

        <NFormItem :label="t('page.faults.bindWorkOrder.faultMachineCount')">
          <NInput size="small" :value="selectedRows.length.toString()" readonly />
        </NFormItem>
      </div>

      <NFormItem :label="t('page.faults.bindWorkOrder.selectedFaultMachines')">

        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e6; border-radius: 6px; padding: 12px;width: 100%;">
          <div
            v-for="machine in selectedRows"
            :key="machine.id"
            style="display: flex; justify-content:space-evenly; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;width: 100%;"
          >
            <!-- <div> -->
              <div style="font-weight: 500;font-size: 12px; color: #666;">{{ machine.sn }}</div>
 <div style="font-size: 12px; color: #666;">{{ machine.FaultsType?.name || machine.model }}</div>
              <div style="font-size: 12px; color: #666;">
                 <!-- |  -->
                {{ machine.Site?.name || machine.site_name }}
              </div>
            <!-- </div> -->
            <NTag type="warning">{{ machine.Status?.name || machine.status_text }}</NTag>
          </div>
        </div>
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace>
        <NButton size="medium" type="primary" @click="handleSubmit">{{ t('page.faults.bindWorkOrder.submit') }}</NButton>
        <NButton size="medium" @click="handleCancel">{{ t('page.faults.bindWorkOrder.cancel') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton, NSpace, NTag, useMessage } from 'naive-ui';
import { bindFaultsToOrder } from '@/service/api/faults';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const message = useMessage();

interface Faults {
  id: number;
  serial_number: string;
  sn?: string;
  serial_number_source?: string;
  status_text?: string;
  site_name?: string;
  site_id?: number;
  model?: string;
  order_no?: string;
  FaultsType?: {
    name?: string;
    hash_rate?: number;
    name_source?: string;
  };
  Site?: {
    id?: number;
    name?: string;
  };
  Status?: {
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
const form = ref({
  workOrderNo: '',
  workOrderDate: new Date().toISOString().split('T')[0]
});

const siteName = computed(() => {
  const first = props.selectedRows[0];
  return first?.Site?.name || first?.site_name || '';
});

const siteId = computed(() => {
  const first = props.selectedRows[0];
  return first?.Site?.id || first?.site_id || 0;
});

// 打开弹框
const handleOpenModal = () => {
  if (!props.selectedRows.length) {
    message.warning(t('page.faults.bindWorkOrder.pleaseSelectMachine'));
    return;
  }

  // 校验订单号一致性（如果已有订单号）
  const orderNoSet = new Set(props.selectedRows.map(row => row.order_no ?? null));
  if (orderNoSet.size > 1) {
    message.warning(t('page.faults.bindWorkOrder.pleaseSelectSameOrder'));
    return;
  }

  // 默认生成一个工单号，用户可编辑
  // form.value.workOrderNo = `WO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  form.value.workOrderNo="";
  form.value.workOrderDate = new Date().toISOString().split('T')[0];

  visible.value = true;
};

// 提交绑定
const handleSubmit = async () => {
  if (!form.value.workOrderNo.trim()) {
    message.error(t('page.faults.bindWorkOrder.inputWorkOrderNo'));
    return;
  }
  if (!form.value.workOrderDate.trim()) {
    message.error(t('page.faults.bindWorkOrder.inputWorkOrderDate'));
    return;
  }

  const faultIds = props.selectedRows.map(row => row.id);
  if (faultIds.length === 0) {
    message.error(t('page.faults.bindWorkOrder.notSelectNewOffShelf'));
    return;
  }

  try {
    const submitData = {
      date: form.value.workOrderDate,
      fault_ids: faultIds,
      order_no: form.value.workOrderNo,
      site_id: siteId.value
    };

        // 调用创建工单API
    const { error, response: { data } } = await bindFaultsToOrder(submitData);
    // console.log('创建工单响应:', data, error);
    // console.log('data.code', data?.code);

    if (error == null) {
      if (Number(data?.code) == 0) {
        message.success(t('page.faults.bindWorkOrder.bindSuccess'));
        visible.value = false;
        emit('refresh');
      }
    }
    // const { error } = await bindFaultsToOrder(submitData);
    // if (error === null) {
    //   message.success(t('page.faults.bindWorkOrder.bindSuccess'));
    //   visible.value = false;
    //   emit('refresh');
    // }
    // else {
    //   message.error(`${t('page.faults.bindWorkOrder.bindFailed')}: ${error}`);
    // }
  } catch (err) {
    message.error(t('page.faults.bindWorkOrder.bindFailed'));
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
