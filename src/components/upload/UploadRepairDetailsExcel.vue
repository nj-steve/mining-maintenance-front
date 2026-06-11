<template>
  <div>
    <!-- 触发按钮 -->
    <n-button v-if="showTrigger" size="small" ghost type="primary" @click="showModal = true">
      <template #icon>
        <NIcon>
          <SvgIcon icon="material-symbols:upload" />
        </NIcon>
      </template>
      {{ buttonText || $t('page.faults.uploadBindWorkOrder.import') }}
    </n-button>

    <!-- 导入弹窗 -->
    <n-modal v-model:show="showModal" preset="dialog" :title="currentConfig.title">
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- 文件选择 -->
        <n-upload
          size="small"
          :show-file-list="true"
          :default-upload="false"
          :on-change="handleFileChange"
          accept=".xls,.xlsx,.xlsm"
        >
          <n-button size="small">{{ $t('page.faults.uploadBindWorkOrder.selectFile') }}</n-button>
        </n-upload>

        <!-- 下载模板链接 -->
        <div style="text-align: left; margin-top: 8px;">
          <n-button text type="primary" @click="downloadTemplate">
            {{ $t('page.faults.uploadBindWorkOrder.downloadTemplate') }}
          </n-button>
        </div>
      </div>

      <template #action>
        <n-button size="small" style="font-size: 12px;" @click="showModal = false">{{ $t('page.faults.uploadBindWorkOrder.cancel') }}</n-button>
        <n-button size="small" style="font-size: 12px;" type="primary" :loading="uploading" @click="handleSubmit">
          {{ $t('page.faults.uploadBindWorkOrder.confirmImport') }}
        </n-button>
      </template>
    </n-modal>

    <!-- 导入结果弹窗 -->
    <n-modal v-model:show="showResult" preset="dialog" :title="$t('page.faults.uploadBindWorkOrder.importResult')" style="width: 600px;">
      <div v-if="importResult" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- 导入统计 -->
        <div style="display: flex; gap: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 6px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #52c41a;">{{ importResult.success_count }}</div>
            <div style="color: #666;">{{ $t('page.faults.uploadBindWorkOrder.successImport') }}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ff4d4f;">{{ importResult.failure_count }}</div>
            <div style="color: #666;">{{ $t('page.faults.uploadBindWorkOrder.failImport') }}</div>
          </div>
        </div>

        <!-- 错误详情 -->
        <div v-if="importResult.errors && importResult.errors.length > 0">
          <h4 style="margin: 0 0 12px 0; color: #ff4d4f;">{{ $t('page.faults.uploadBindWorkOrder.errorDetail') }}</h4>
          <!-- 错误操作：复制与导出 -->
          <div style="display: flex; gap: 8px;margin-top: -40px;  margin-bottom: 8px;justify-content:right">
            <n-button size="small" secondary @click="copyErrors" :title="$t('page.faults.uploadBindWorkOrder.copyError')" icon-placement="right">
              <template #icon>
                <NIcon>
                  <SvgIcon icon="material-symbols:content-copy" />
                </NIcon>
              </template>
            </n-button>
            <n-button size="small" secondary @click="exportErrors" :title="$t('page.faults.uploadBindWorkOrder.exportError')" icon-placement="right">
              <template #icon>
                <NIcon>
                  <SvgIcon icon="material-symbols:download" />
                </NIcon>
              </template>
            </n-button>
          </div>
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #d9d9d9; border-radius: 4px; padding: 12px; background-color: #fff;">
            <div v-for="(error, index) in importResult.errors" :key="index" style="margin-bottom: 8px; padding: 8px; background-color: #fff2f0; border-left: 3px solid #ff4d4f; font-family: monospace; font-size: 13px;">
              {{ error }}
            </div>
          </div>
        </div>

        <!-- 全部成功提示 -->
        <div v-if="importResult.failure_count === 0" style="padding: 12px; background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; color: #52c41a;">
          {{ $t('page.faults.uploadBindWorkOrder.allSuccess') }}
        </div>
      </div>

      <template #action>
        <n-button size="small" style="font-size: 12px;" type="primary" @click="handleCloseResult">{{ $t('page.faults.uploadBindWorkOrder.close') }}</n-button>
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ---------------- Props ----------------
interface Props {
  uploadUrl?: string            // 上传接口，默认维修明细导入
  params?: Record<string, any>  // 额外参数（默认空对象）
  buttonText?: string           // 按钮文字（默认 “导入”）
  templateUrl?: string          // 模板下载链接
  templateName?: string         // 模板下载文件名
  title?: string                // 弹窗标题
  showTrigger?: boolean         // 是否显示触发按钮
}

const props = withDefaults(defineProps<Props>(), {
  uploadUrl: '/api/repair_stations/import_repair_details',
  params: () => ({}),
  buttonText: '',
  templateUrl: '/template/repair-detail.xlsm',
  templateName: '',
  title: '',
  showTrigger: true
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

// 动态配置
const currentConfig = ref({
  uploadUrl: props.uploadUrl,
  templateUrl: props.templateUrl,
  templateName: props.templateName || t('page.faults.uploadBindWorkOrder.repairDetailTemplateName'),
  title: props.title || t('page.faults.uploadBindWorkOrder.importRepairDetailExcel')
})

// 暴露 open 方法供父组件调用
const open = (config?: { uploadUrl?: string, templateUrl?: string, templateName?: string, title?: string }) => {
  if (config) {
    currentConfig.value = {
      uploadUrl: config.uploadUrl || props.uploadUrl,
      templateUrl: config.templateUrl || props.templateUrl,
      templateName: config.templateName || props.templateName || t('page.faults.uploadBindWorkOrder.repairDetailTemplateName'),
      title: config.title || props.title || t('page.faults.uploadBindWorkOrder.importRepairDetailExcel')
    }
  } else {
    // 重置为 props 默认值
    currentConfig.value = {
      uploadUrl: props.uploadUrl,
      templateUrl: props.templateUrl,
      templateName: props.templateName || t('page.faults.uploadBindWorkOrder.repairDetailTemplateName'),
      title: props.title || t('page.faults.uploadBindWorkOrder.importRepairDetailExcel')
    }
  }
  showModal.value = true
}

defineExpose({ open })

// ---------------- Methods ----------------
const handleFileChange = ({ file }: { file: UploadFileInfo }) => {
  selectedFile.value = file.file || null
}

const handleSubmit = async () => {
  if (!selectedFile.value) {
    message.warning(t('page.faults.uploadBindWorkOrder.pleaseSelectFile'))
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
      url: baseURL + currentConfig.value.uploadUrl,
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
      message.error(t('page.faults.uploadBindWorkOrder.importFailedFile', { name: selectedFile.value.name }) + response.data.msg)
      showModal.value = false
      // emit('fail')
    }

    selectedFile.value = null
  } catch (e) {
    console.error(e)
    message.error(t('page.faults.uploadBindWorkOrder.fileUploadFailed'))
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
  link.href = currentConfig.value.templateUrl || '/template/repair-detail.xlsm'
  link.download = currentConfig.value.templateName || t('page.faults.uploadBindWorkOrder.repairDetailTemplateName')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  message.success(t('page.faults.uploadBindWorkOrder.templateDownloaded'))
}

// 复制错误信息到剪贴板
const copyErrors = async () => {
  const errors = importResult.value?.errors || []
  if (!errors.length) {
    message.warning(t('page.faults.uploadBindWorkOrder.noErrorToCopy'))
    return
  }
  const text = errors.join('\n')
  try {
    await navigator.clipboard.writeText(text)
    message.success(t('page.faults.uploadBindWorkOrder.copySuccess'))
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      message.success(t('page.faults.uploadBindWorkOrder.copySuccess'))
    } catch (e) {
      message.error(t('page.faults.uploadBindWorkOrder.copyFailed'))
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

// 导出错误信息为 CSV（带 BOM，Excel 可直接打开）
const exportErrors = () => {
  const errors = importResult.value?.errors || []
  if (!errors.length) {
    message.warning(t('page.faults.uploadBindWorkOrder.noErrorToExport'))
    return
  }

  const headers = [t('page.faults.uploadBindWorkOrder.index'), t('page.faults.uploadBindWorkOrder.errorMessage')]
  const escapeCsv = (s: string) => {
    if (s == null) return ''
    const str = String(s)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const rows = errors.map((err, i) => `${i + 1},${escapeCsv(err)}`)
  const csv = [headers.join(','), ...rows].join('\n')
  const bom = '\ufeff'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const filename = `${t('page.faults.uploadBindWorkOrder.repairDetailImportErrorPrefix')}${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success(t('page.faults.uploadBindWorkOrder.exportSuccess'))
}
</script>
