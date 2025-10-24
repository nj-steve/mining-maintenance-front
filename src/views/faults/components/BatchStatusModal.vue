<template>
  <!-- 触发按钮 -->
  <NButton 
    type="warning" 
    size="small"
    ghost
    :disabled="selectedRows.length === 0"
    @click="handleOpenModal"
  >
    修改状态 ({{ selectedRows.length }})
  </NButton>

  <!-- 弹框 -->
  <NModal v-model:show="visible" style="width: 500px" preset="card" title="批量修改状态">
    <NForm :model="form" label-width="100">
      <!-- 状态下拉选择 -->
      <NFormItem label="状态" required>
        <NSelect 
          v-model:value="form.status"
          :options="statusOptions"
          placeholder="请选择状态"
        />
      </NFormItem>
    </NForm>
    
    <template #footer>
      <NButton type="primary" @click="handleSubmit">提交</NButton>
      <NButton @click="handleCancel">取消</NButton>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NSelect, NButton, useMessage } from 'naive-ui';
import { updateFaultsStatus } from '@/service/api/faults';
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

// 打开弹框的方法
const handleOpenModal = () => {
  // 过滤出状态为"非新下架"的机器
  const validMachines = props.selectedRows.filter(row => {
    const statusText = row.Status?.name || row.status_text || '';
    return statusText !== '新下架';
  });
  
  if (validMachines.length === 0) {
    message.warning('请选择状态为"非新下架"的机器');
    return;
  }

  // 订单号一致性校验
  const orderNoSet = new Set(props.selectedRows.map(row => row.order_no ?? null));
  if (orderNoSet.size > 1) {
    message.warning('请选择相同订单机器');
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
    message.error('请选择状态');
    return;
  }
  
  // 获取有效的机器ID列表
  const validMachines = props.selectedRows.filter(row => {
    const statusText = row.Status?.name || row.status_text || '';
    return statusText !== '新下架';
  });
  
  const faultIds = validMachines.map(row => row.id);
  
  try {
    // 调用API批量修改状态
    const res = await updateFaultsStatus({
      fault_ids: faultIds,
      status: form.value.status
    });
    
    message.success('批量修改状态成功');
    visible.value = false;
    emit('refresh');
  } catch (error) {
    message.error('批量修改状态失败');
  }
};

const handleCancel = () => {
  visible.value = false;
};
</script>