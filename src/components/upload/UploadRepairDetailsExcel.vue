<template>
  <div>
    <!-- 触发按钮 -->
    <n-button size="small" ghost type="primary" @click="showModal = true">
      <template #icon>
        <NIcon>
          <SvgIcon icon="material-symbols:upload" />
        </NIcon>
      </template>
      {{ buttonText }}
    </n-button>

    <!-- 导入弹窗 -->
    <n-modal v-model:show="showModal" preset="dialog" title="导入维修明细 Excel">
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- 文件选择 -->
        <n-upload
          size="small"
          :show-file-list="true"
          :default-upload="false"
          :on-change="handleFileChange"
          accept=".xls,.xlsx,.xlsm"
        >
          <n-button size="small">选择文件</n-button>
        </n-upload>

        <!-- 下载模板链接 -->
        <div style="text-align: left; margin-top: 8px;">
          <n-button text type="primary" @click="downloadTemplate">
            📥 下载模板
          </n-button>
        </div>
      </div>

      <template #action>
        <n-button size="small" style="font-size: 12px;" @click="showModal = false">取消</n-button>
        <n-button size="small" style="font-size: 12px;" type="primary" :loading="uploading" @click="handleSubmit">
          确定导入
        </n-button>
      </template>
    </n-modal>

    <!-- 导入结果弹窗 -->
    <n-modal v-model:show="showResult" preset="dialog" title="导入结果" style="width: 600px;">
      <div v-if="importResult" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- 导入统计 -->
        <div style="display: flex; gap: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 6px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #52c41a;">{{ importResult.success_count }}</div>
            <div style="color: #666;">成功导入</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ff4d4f;">{{ importResult.failure_count }}</div>
            <div style="color: #666;">导入失败</div>
          </div>
        </div>

        <!-- 错误详情 -->
        <div v-if="importResult.errors && importResult.errors.length > 0">
          <h4 style="margin: 0 0 12px 0; color: #ff4d4f;">错误详情：</h4>
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #d9d9d9; border-radius: 4px; padding: 12px; background-color: #fff;">
            <div v-for="(error, index) in importResult.errors" :key="index" style="margin-bottom: 8px; padding: 8px; background-color: #fff2f0; border-left: 3px solid #ff4d4f; font-family: monospace; font-size: 13px;">
              {{ error }}
            </div>
          </div>
        </div>

        <!-- 全部成功提示 -->
        <div v-if="importResult.failure_count === 0" style="padding: 12px; background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; color: #52c41a;">
          ✅ 所有数据导入成功！
        </div>
      </div>

      <template #action>
        <n-button size="small" style="font-size: 12px;" type="primary" @click="handleCloseResult">关闭</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NModal, NUpload, useMessage, NIcon } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import axios from 'axios'
import { getServiceBaseURL } from '@/utils/service'
import { localStg } from '@/utils/storage'

// ---------------- Props ----------------
interface Props {
  uploadUrl?: string            // 上传接口，默认维修明细导入
  params?: Record<string, any>  // 额外参数（默认空对象）
  buttonText?: string           // 按钮文字（默认 “导入”）
}

const props = withDefaults(defineProps<Props>(), {
  uploadUrl: '/api/repair_stations/import_repair_details',
  params: () => ({}),
  buttonText: '导入'
})

// ---------------- Emits ----------------
const emit = defineEmits<{ success: [] }>()

// ---------------- State ----------------
const message = useMessage()
const { baseURL } = getServiceBaseURL(
  import.meta.env,
  import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'
)

const showModal = ref(false)
const uploading = ref(false)
const showResult = ref(false)
const importResult = ref<{
  success_count: number
  failure_count: number
  errors: string[]
} | null>(null)

const selectedFile = ref<File | null>(null)

// ---------------- Methods ----------------
const handleFileChange = ({ file }: { file: UploadFileInfo }) => {
  selectedFile.value = file.file || null
}

const handleSubmit = async () => {
  if (!selectedFile.value) {
    message.warning('请先选择文件')
    return
  }

  try {
    uploading.value = true

    const formData = new FormData()
    formData.append('file', selectedFile.value)

    Object.entries(props.params).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    const token = localStg.get('token')
    const Authorization = token ? `Bearer ${token}` : ''

    const response = await axios.request({
      url: baseURL + props.uploadUrl,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': Authorization
      }
    })

    if (response.data && response.data.data) {
      importResult.value = response.data.data
      showResult.value = true
      // 不立即关闭上传弹框，等用户查看结果后手动关闭
      emit('success')
    } else {
      // message.error(`文件 ${selectedFile.value.name} 上传失败！`)
      message.error(`文件 ${selectedFile.value.name} 导入失败！`+response.data.msg)
      showModal.value = false
      // emit('fail')
    }

    selectedFile.value = null
  } catch (e) {
    console.error(e)
    message.error('文件上传失败')
  } finally {
    uploading.value = false
  }
}

const handleCloseResult = () => {
  showResult.value = false
  showModal.value = false
}

const downloadTemplate = () => {
  const link = document.createElement('a')
  link.href = '/template/repair-detail.xlsx'
  link.download = '维修明细_导入模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>