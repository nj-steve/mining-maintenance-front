<template>
  <!-- 触发按钮 -->
  <NButton 
    type="primary" 
    ghost
    size="small"
    :disabled="selectedRows.length === 0"
    @click="handleOpenModal"
  >
    绑定工单 ({{ selectedRows.length }})
  </NButton>

  <!-- 绑定工单弹框 -->
  <NModal v-model:show="visible" style="width: 700px" preset="card" title="绑定工单">
    <NForm :model="form" label-width="120">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <NFormItem label="工单号" required>
          <NInput 
            size="small"
            v-model:value="form.workOrderNo"
            placeholder="请输入工单号"
            style="font-size: 12px;"
          />
        </NFormItem>

        <NFormItem label="工单日期" required>
          <NInput 
            size="small"
            v-model:value="form.workOrderDate"
            placeholder="YYYY-MM-DD"
            style="font-size: 12px;"
          />
        </NFormItem>

        <NFormItem label="场地">
          <NInput size="small" :value="siteName" readonly />
        </NFormItem>

        <NFormItem label="故障机台数">
          <NInput size="small" :value="selectedRows.length.toString()" readonly />
        </NFormItem>
      </div>

      <NFormItem label="选中故障机列表">
        
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
        <NButton size="medium" type="primary" @click="handleSubmit">提交</NButton>
        <NButton size="medium" @click="handleCancel">取消</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton, NModal, NForm, NFormItem, NInput, NTag, useMessage } from 'naive-ui';
import { bindFaultsToOrder } from '@/service/api/faults';

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
    message.warning('请先选择机器');
    return;
  }

  // 校验订单号一致性（如果已有订单号）
  const orderNoSet = new Set(props.selectedRows.map(row => row.order_no ?? null));
  if (orderNoSet.size > 1) {
    message.warning('请选择相同订单的机器');
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
    message.error('请输入工单号');
    return;
  }
  if (!form.value.workOrderDate.trim()) {
    message.error('请输入工单日期');
    return;
  }

  const faultIds = props.selectedRows.map(row => row.id);
  if (faultIds.length === 0) {
    message.error('未选择故障机');
    return;
  }

  try {
    const submitData = {
      date: form.value.workOrderDate,
      fault_ids: faultIds,
      order_no: form.value.workOrderNo,
      site_id: siteId.value
    };

    const { error } = await bindFaultsToOrder(submitData);
    if (error === null) {
      message.success('绑定工单成功！');
      visible.value = false;
      emit('refresh');
    } else {
      message.error(`绑定失败: ${error}`);
    }
  } catch (err) {
    message.error('绑定失败');
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