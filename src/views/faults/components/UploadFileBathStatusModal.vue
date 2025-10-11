<template>
  <!-- 触发按钮 -->
  <NButton 
    type="warning" 
    size="small"
    @click="handleOpenModal"
  >
    SN导入更新
  </NButton>

  <!-- 导入机器修改状态弹框 -->
  <NModal v-model:show="visible" style="width: 500px" preset="card" title="批量修改状态">
    <NForm :model="form" label-width="100">
      <!-- 工单输入框 -->
      <NFormItem label="工单号">
        <NInput 
          v-model:value="form.orderNumbers"
          placeholder="请输入工单号"
        />
      </NFormItem>

      <!-- 状态下拉选择 -->
      <NFormItem label="状态" required>
        <NSelect 
          v-model:value="form.status"
          :options="statusOptions"
          placeholder="请选择状态"
        />
      </NFormItem>

      <!-- 文件上传 -->
      <NFormItem label="文件上传">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input 
            ref="fileInputRef"
            type="file" 
            accept=".xlsx,.xls,.csv"
            @change="handleFileChange"
            style="width: 100%;"
          />
          <div style="font-size: 12px; color: #666;">
            支持上传 Excel 或 CSV 文件，文件中应包含工单号列表
          </div>
          <div v-if="form.file" style="font-size: 12px; color: #18a058;">
            已选择文件: {{ form.file.name }}
          </div>
        </div>
      </NFormItem>
       <!-- 下载模板链接 -->
       <NButton 
            text 
            type="primary" 
            @click="downloadTemplate"
            style="font-size: 12px; padding: 0; text-align: left;"
          >
            📥 下载模板
          </NButton>
    </NForm>
    
    <template #footer>
      <NButton type="primary" @click="handleSubmit">提交</NButton>
      <NButton @click="handleCancel">取消</NButton>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NModal, NForm, NFormItem, NInput, NSelect, useMessage } from 'naive-ui';
import { batchUpdateStatus } from '@/service/api/faults';

const message = useMessage();

interface Props {
  statusOptions: Array<{ label: string; value: number }>;
}

interface Emits {
  (e: 'refresh'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const form = ref({
  orderNumbers: '',
  status: null as null | number,
  file: null as File | null
});

// 打开弹框的方法
const handleOpenModal = () => {
  // 重置表单
  form.value = {
    orderNumbers: '',
    status: null,
    file: null
  };
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
  visible.value = true;
};

// 处理文件上传
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    form.value.file = target.files[0];
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!form.value.orderNumbers.trim() && !form.value.file) {
    message.error('请输入工单号或上传文件');
    return;
  }
  
  if (form.value.status === null) {
    message.error('请选择状态');
    return;
  }
  
  try {
    // 这里需要调用批量修改状态的API
    const formData = new FormData();
    formData.append('order_no', form.value.orderNumbers.toString());
    formData.append('status', Number(form.value.status).toString());
    if (form.value.file) {
      formData.append('file', form.value.file);
    }
    const { error } = await batchUpdateStatus(formData);
    if (error) {
      message.error(error.message || '批量修改状态失败');
      return;
    }else{
      // 临时模拟成功
      message.success('批量修改状态成功');
      visible.value = false;
      
      // 通知父组件刷新数据
      emit('refresh');
    }
  } catch (error) {
    message.error('批量修改状态失败');
    console.error('批量修改状态失败:', error);
  }
};

// 取消操作
const handleCancel = () => {
  visible.value = false;
  form.value = {
    orderNumbers: '',
    status: null,
    file: null
  };
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// 下载模板
const downloadTemplate = () => {
  // 创建一个临时链接来下载模板文件
  const link = document.createElement('a');
  link.href = '/src/assets/template/site_machine_template.xlsx'; // 模板文件路径
  link.download = '场地矿机导入模板.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success('模板下载已开始');
};
</script>