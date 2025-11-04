<template>
  <!-- 触发按钮 -->
  <NButton 
    type="error" 
    ghost
    size="small"
    :disabled="withOrderRows.length === 0"
    @click="handleOpenModal"
  >
    解绑工单 ({{ withOrderRows.length }})
  </NButton>

  <!-- 解绑工单弹框 -->
  <NModal v-model:show="visible" style="width: 700px" preset="card" title="解绑工单">
    <NForm label-width="120">
      <NAlert type="warning" title="提示" style="margin-bottom: 12px;">
        仅对已绑定工单的故障机进行解绑，其它未绑定工单的机器不会受影响。
      </NAlert>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <NFormItem label="待解绑台数">
          <NInput size="small" :value="withOrderRows.length.toString()" readonly />
        </NFormItem>
        <NFormItem label="总选择台数">
          <NInput size="small" :value="props.selectedRows.length.toString()" readonly />
        </NFormItem>
      </div>

      <NFormItem label="待解绑列表">
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e0e0e6; border-radius: 6px; padding: 12px; width: 100%;">
          <div 
            v-for="machine in withOrderRows" 
            :key="machine.id" 
            style="display: flex; justify-content: space-evenly; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; width: 100%;"
          >
            <!-- <div> -->
              <div style="font-weight: 500;font-size: 12px; color: #666;">{{ machine.sn }}</div>
              <div style="font-size: 12px; color: #666;">
                工单：{{ machine.order_no }} | 场地：{{ machine.Site?.name || machine.site_name }}
              </div>
            <!-- </div> -->
            <NTag type="error" size="small">待解绑</NTag>
          </div>
        </div>
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace>
      <NPopconfirm
        :negative-text="'取消'"
        :positive-text="'确认解绑'"
        @positive-click="handleSubmit"
      >
        <template #trigger>
          <NButton type="error">解绑</NButton>
        </template>
        是否确认解绑这些机器的工单？
      </NPopconfirm>
      <NButton @click="handleCancel">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton, NModal, NForm, NFormItem, NInput, NTag, NAlert, NPopconfirm, useMessage } from 'naive-ui';
import { unbindFaultsToOrder } from '@/service/api/faults';

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
    message.warning('请先选择机器');
    return;
  }
  if (withOrderRows.value.length === 0) {
    message.info('所选机器暂无工单，无需解绑');
    return;
  }
  visible.value = true;
};

// 提交解绑
const handleSubmit = async () => {
  const faultIds = withOrderRows.value.map(row => row.id);
  if (faultIds.length === 0) {
    message.error('未找到需解绑的机器');
    return;
  }

  try {
    const { error } = await unbindFaultsToOrder({ fault_ids: faultIds });
    if (error === null) {
      message.success('解绑工单成功！');
      visible.value = false;
      emit('refresh');
    } else {
      message.error(`解绑失败: ${error}`);
    }
  } catch (err) {
    message.error('解绑失败');
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