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
    {{ t('page.faults.uploadFileBatchStatus.importUpdateStatus') }}
  </NButton>

  <!-- 导入机器修改状态弹框 -->
  <NModal v-model:show="visible" style="width: 500px" preset="card" :title="t('page.faults.uploadFileBatchStatus.batchModifyStatus')">
    <NForm :model="form" label-width="100">
      <!-- 工单输入框 -->
      <NFormItem :label="t('page.faults.uploadFileBatchStatus.workOrderNo')" required>
        <NInput
          size="small"
          v-model:value="form.orderNumbers"
          :placeholder="t('page.faults.uploadFileBatchStatus.inputWorkOrderNo')"
          style="font-size: 12px;"
        />
      </NFormItem>

      <!-- 状态下拉选择 -->
      <NFormItem :label="t('page.faults.uploadFileBatchStatus.status')" required>
        <NSelect
        size="small"
          v-model:value="form.status"
          :options="statusOptions"
          :placeholder="t('page.faults.uploadFileBatchStatus.selectStatus')"
          style="font-size: 12px;"
        />
      </NFormItem>

      <!-- 文件上传 -->
      <NFormItem :label="t('page.faults.uploadFileBatchStatus.fileUpload')" required>
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
          <div class="custom-file-upload">
            <NButton @click="() => fileInputRef?.click()" size="small">
              {{ t('page.faults.uploadFileBatchStatus.chooseFile') || '选择文件' }}
            </NButton>
            <span class="file-name" v-if="!form.file">{{ t('page.faults.uploadFileBatchStatus.noFileChosen') || '未选择任何文件' }}</span>
            <span class="file-name" v-else>{{ form.file.name }}</span>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls,.csv"
              @change="handleFileChange"
              style="display: none;"
            />
          </div>
          <div style="font-size: 12px; color: #666;">
            {{ t('page.faults.uploadFileBatchStatus.supportFormat') }}
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
            {{ t('page.faults.uploadFileBatchStatus.downloadTemplate') }}
          </NButton>

      <!-- 批量更新结果显示（移除原有内嵌结果提示，改用独立结果弹框） -->
      <!-- <NAlert v-if="resultInfo" type="success" title="批量更新结果" style="margin-top: 12px;">
        <div style="font-size: 12px;">成功：{{ resultInfo.success_count }}，失败：{{ resultInfo.failure_count }}</div>
      </NAlert> -->
    </NForm>

    <template #footer>
      <NSpace>
      <NButton type="primary" @click="handleSubmit">{{ t('page.faults.uploadFileBatchStatus.submit') }}</NButton>
      <NButton @click="handleCancel">{{ t('page.faults.uploadFileBatchStatus.cancel') }}</NButton>
      </NSpace>
    </template>
  </NModal>

  <!-- 结果弹框 -->
  <NModal v-model:show="resultVisible" style="width: 600px" preset="card" :title="t('page.faults.uploadFileBatchStatus.batchModifyResult')">
    <div style="font-size: 12px;">{{ t('page.faults.uploadFileBatchStatus.successCount') }}{{ resultData.success_count }}，{{ t('page.faults.uploadFileBatchStatus.failureCount') }}{{ resultData.failure_count }}</div>
    <div v-if="resultData.errors && resultData.errors.length" style="margin-top: 12px;">
      <NAlert type="warning" :title="t('page.faults.uploadFileBatchStatus.errorList')">
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
        <NButton type="primary" @click="handleResultClose">{{ t('page.faults.uploadFileBatchStatus.close') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NButton, NModal, NForm, NFormItem, NInput, NSelect, useMessage, NAlert, NSpace, NIcon } from 'naive-ui';
import { batchUpdateStatus } from '@/service/api/faults';
import { useI18n } from 'vue-i18n';
import SvgIcon from '@/components/custom/svg-icon.vue';

const { t } = useI18n();
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
    message.error(t('page.faults.uploadFileBatchStatus.inputWorkOrderNo'));
    return;
  }

  if (form.value.status === null) {
    message.error(t('page.faults.uploadFileBatchStatus.selectStatus'));
    return;
  }

  if (!form.value.file) {
    message.error(t('page.faults.uploadFileBatchStatus.pleaseUploadFile'));
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
        resultMsg.value = String(data?.msg || t('page.faults.uploadFileBatchStatus.successCount').replace('：', ''));
        message.success(t('page.faults.batchStatus.modifySuccess') || '批量修改状态成功！');
        // 关闭原始弹框，打开结果弹框
        visible.value = false;
        resultVisible.value = true;
        // 通知父组件刷新数据
        emit('refresh');
      } else {
        message.error(String(data?.msg || t('page.faults.batchStatus.modifyFailed')));
      }
    } else {
      message.error(t('page.faults.batchStatus.modifyFailed'));
    }
  } catch (error) {
    message.error(t('page.faults.batchStatus.modifyFailed'));
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
  link.download = t('page.faults.uploadFileBatchStatus.templateName');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  message.success(t('page.faults.uploadFileBatchStatus.templateDownloaded'));
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
.custom-file-upload {
  display: flex;
  align-items: center;
  gap: 8px;
}
.file-name {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
</style>
