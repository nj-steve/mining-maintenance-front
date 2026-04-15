<template>
  <!-- 触发按钮 -->
  <NButton
    type="warning"
    size="small"
    ghost
    :disabled="selectedRows.length === 0"
    @click="handleOpenModal"
  >
    {{ t('page.faults.batchStatus.modifyStatus') }} ({{ selectedRows.length }})
  </NButton>

  <!-- 弹框 -->
  <NModal v-model:show="visible" style="width: 500px" preset="card" :title="t('page.faults.batchStatus.batchModifyStatus')">
    <NForm :model="form" label-width="100">
      <!-- 状态下拉选择 -->
      <NFormItem :label="t('page.faults.batchStatus.status')" required>
        <NSelect
          v-model:value="form.status"
          :options="statusOptions"
          :placeholder="t('page.faults.batchStatus.pleaseSelectStatus')"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace>
      <NButton type="primary" @click="handleSubmit">{{ t('page.faults.batchStatus.submit') }}</NButton>
      <NButton @click="handleCancel">{{ t('page.faults.batchStatus.cancel') }}</NButton>
      </NSpace>
    </template>
  </NModal>

  <!-- 结果弹框 -->
  <NModal v-model:show="resultVisible" style="width: 600px" preset="card" :title="t('page.faults.batchStatus.batchModifyResult')">
    <div style="font-size: 12px;">{{ t('page.faults.batchStatus.success') }}{{ resultData.success_count }}，{{ t('page.faults.batchStatus.failure') }}{{ resultData.failure_count }}</div>
    <div v-if="resultData.errors && resultData.errors.length" style="margin-top: 12px;">
      <NAlert type="warning" :title="t('page.faults.batchStatus.errorList')">
        <div style="max-height: 240px; overflow: auto; font-size: 12px;">
          <ul style="padding-left: 18px; margin: 0;">
            <li v-for="(err, idx) in resultData.errors" :key="idx" style="margin-bottom: 6px; color: #d03050;">
              {{ err }}
            </li>
          </ul>
        </div>
      </NAlert>
    </div>
    <template #footer>
      <NSpace>
        <NButton type="primary" @click="handleResultClose">{{ t('page.faults.batchStatus.close') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NSelect, NButton, NAlert, useMessage } from 'naive-ui';
import { updateFaultsStatus } from '@/service/api/faults';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const message = useMessage();

interface Faults {
  id: number;
  serial_number: string;
  order_no?: string;
  Status?: {
    name?: string;
  };
  status_text?: string;
}

interface Props {
  selectedRows: Faults[];
  statusOptions: Array<{ label: string; value: number }>;
}

interface Emits {
  (e: 'submit', status: number | null): void;
  (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const form = ref({
  status: null as null | number
});

// 结果弹框状态与数据
const resultVisible = ref(false);
const resultData = ref<{ success_count: number; failure_count: number; errors: string[] }>({
  success_count: 0,
  failure_count: 0,
  errors: []
});

// 打开弹框的方法
const handleOpenModal = () => {
  // 过滤出状态为"非新下架"的机器
  const validMachines = props.selectedRows.filter(row => {
    const statusText = row.Status?.name || row.status_text || '';
    return statusText !== t('page.faults.newOffShelf') && statusText !== '新下架';
  });

  if (validMachines.length === 0) {
    message.warning(t('page.faults.batchStatus.selectNotNewOffShelf'));
    return;
  }

  // 订单号一致性校验
  const orderNoSet = new Set(props.selectedRows.map(row => row.order_no ?? null));
  if (orderNoSet.size > 1) {
    message.warning(t('page.faults.batchStatus.selectSameOrder'));
    return;
  }

  // 重置表单并显示弹框
  form.value = {
    status: null
  };
  visible.value = true;
};



const handleSubmit = async () => {
  if (form.value.status === null) {
    message.error(t('page.faults.batchStatus.pleaseSelectStatus'));
    return;
  }

  // 获取有效的机器ID列表
  const validMachines = props.selectedRows.filter(row => {
    const statusText = row.Status?.name || row.status_text || '';
    return statusText !== t('page.faults.newOffShelf') && statusText !== '新下架';
  });

  const faultIds = validMachines.map(row => row.id);

  try {

    const { error, response: { data } } = await updateFaultsStatus({
      fault_ids: faultIds,
      status: form.value.status
    });
    // console.log('创建工单响应:', data, error);
    // console.log('data.code', data?.code);

    if (error == null) {
      if (Number(data?.code) == 0) {
        const info = (data?.data || {}) as { success_count?: number; failure_count?: number; errors?: string[] };
        resultData.value = {
          success_count: Number(info.success_count || 0),
          failure_count: Number(info.failure_count || 0),
          errors: Array.isArray(info.errors) ? info.errors : []
        };
        // message.success('批量修改状态成功!');
        visible.value = false;
        resultVisible.value = true;
        emit('refresh');
      } else {
        message.error(String(data?.msg || t('page.faults.batchStatus.modifyFailed')));
      }
    } else {
      message.error(t('page.faults.batchStatus.modifyFailed'));
    }

  } catch (error) {
    message.error(t('page.faults.batchStatus.modifyFailed'));
  }
};

const handleCancel = () => {
  visible.value = false;
  resultVisible.value = false;
  resultData.value = { success_count: 0, failure_count: 0, errors: [] };
};

// 关闭结果弹框
const handleResultClose = () => {
  resultVisible.value = false;
  resultData.value = { success_count: 0, failure_count: 0, errors: [] };
};
</script>
