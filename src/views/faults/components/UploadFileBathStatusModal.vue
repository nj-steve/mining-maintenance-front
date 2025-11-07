<template>
  <!-- 触发按钮 -->
  <NButton 
    type="warning" 
    ghost
    size="small"
    @click="handleOpenModal"
  >
   <template #icon>
          <NIcon>
            <SvgIcon icon="material-symbols:upload" />
          </NIcon>
        </template>
    导入更新状态
  </NButton>

  <!-- 导入机器修改状态弹框 -->
  <NModal v-model:show="visible" style="width: 500px" preset="card" title="批量修改状态">
    <NForm :model="form" label-width="100">
      <!-- 工单输入框 -->
      <NFormItem label="工单号" required>
        <NInput 
          size="small"
          v-model:value="form.orderNumbers"
          placeholder="请输入工单号"
          style="font-size: 12px;"
        />
      </NFormItem>

      <!-- 状态下拉选择 -->
      <NFormItem label="状态" required>
        <NSelect 
        size="small"
          v-model:value="form.status"
          :options="statusOptions"
          placeholder="请选择状态"
          style="font-size: 12px;"
        />
      </NFormItem>

      <!-- 文件上传 -->
      <NFormItem label="文件上传" required>
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

      <!-- 批量更新结果显示（移除原有内嵌结果提示，改用独立结果弹框） -->
      <!-- <NAlert v-if="resultInfo" type="success" title="批量更新结果" style="margin-top: 12px;">
        <div style="font-size: 12px;">成功：{{ resultInfo.success_count }}，失败：{{ resultInfo.failure_count }}</div>
      </NAlert> -->
    </NForm>
    
    <template #footer>
      <NSpace>
      <NButton type="primary" @click="handleSubmit">提交</NButton>
      <NButton @click="handleCancel">取消</NButton>
      </NSpace>
    </template>
  </NModal>

  <!-- 结果弹框 -->
  <NModal v-model:show="resultVisible" style="width: 600px" preset="card" title="批量修改结果">
    <div style="font-size: 12px;">成功：{{ resultData.success_count }}，失败：{{ resultData.failure_count }}</div>
    <div v-if="resultData.errors && resultData.errors.length" style="margin-top: 12px;">
      <NAlert type="warning" title="错误信息列表">
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
        <NButton type="primary" @click="handleResultClose">关闭</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NModal, NForm, NFormItem, NInput, NSelect, useMessage, NAlert } from 'naive-ui';
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
const resultVisible = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const form = ref({
  orderNumbers: '',
  status: null as null | number,
  file: null as File | null
});

// 结果展示（新的结果数据结构，包含错误列表）
const resultData = ref<{ success_count: number; failure_count: number; errors: string[] }>({
  success_count: 0,
  failure_count: 0,
  errors: []
});
// 保留旧变量以兼容（不再在模板中使用）
const resultInfo = ref<{ success_count: number; failure_count: number } | null>(null);
const resultMsg = ref('');

// 打开弹框的方法
const handleOpenModal = () => {
  // 重置表单
  form.value = {
    orderNumbers: '',
    status: null,
    file: null
  };
  resultInfo.value = null;
  resultMsg.value = '';
  resultData.value = { success_count: 0, failure_count: 0, errors: [] };
  resultVisible.value = false;
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
  if (!form.value.orderNumbers.trim() ) {
    message.error('请输入工单号');
    return;
  }

  if (form.value.status === null) {
    message.error('请选择状态');
    return;
  }

  if (!form.value.file) {
    message.error('请上传文件');
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

    const { error, response: { data } } = await batchUpdateStatus(formData);

    if (error == null) {
      if (Number(data?.code) == 0) {
        // 成功：展示结果弹框，并关闭原弹框
        const info = (data?.data || {}) as { success_count?: number; failure_count?: number; errors?: string[] };
        resultData.value = {
          success_count: Number(info.success_count || 0),
          failure_count: Number(info.failure_count || 0),
          errors: Array.isArray(info.errors) ? info.errors : []
        };
        resultInfo.value = {
          success_count: Number(info.success_count || 0),
          failure_count: Number(info.failure_count || 0)
        };
        resultMsg.value = String(data?.msg || '操作成功');
        message.success('批量修改状态成功！');
        // 关闭原始弹框，打开结果弹框
        visible.value = false;
        resultVisible.value = true;
        // 通知父组件刷新数据
        emit('refresh');
      } else {
        message.error(String(data?.msg || '批量修改状态失败'));
      }
    } else {
      message.error('批量修改状态失败');
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
  resultInfo.value = null;
  resultMsg.value = '';
  resultData.value = { success_count: 0, failure_count: 0, errors: [] };
  resultVisible.value = false;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// 关闭结果弹框
const handleResultClose = () => {
  resultVisible.value = false;
  resultData.value = { success_count: 0, failure_count: 0, errors: [] };
};

// 下载模板
const downloadTemplate = () => {
  // 创建一个临时链接来下载模板文件
  const link = document.createElement('a');
  link.href = '/template/status_machine_template.xlsx'; // 模板文件路径
  link.download = '批量改机器状态模板.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success('模板下载已开始');
};
</script>
<style scoped lang="scss">
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