<template>
  <div>
    <!-- 导入对话框 -->
    <n-modal v-model:show="show" preset="dialog" title="导入绑定工单">

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- 工单编号 -->
        <n-form-item label="工单编号" prop="order_no">
          <n-input v-model:value="form.order_no" placeholder="请输入工单编号" />
        </n-form-item>
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
        <n-button size="small" style="font-size: 12px;" @click="show = false">取消</n-button>
        <n-button size="small" style="font-size: 12px;" type="primary" :loading="uploading" @click="handleSubmit">
          确定导入
        </n-button>
      </template>
    </n-modal>
    
    <!-- 导入结果弹框 -->
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
          <!-- 错误操作：复制与导出 -->
          <div style="display: flex; gap: 8px;margin-top: -40px;  margin-bottom: 8px;justify-content:right">
          <n-button size="small" secondary @click="copyErrors" title="复制错误信息" icon-placement="right">
            <template #icon>
              <NIcon>
                <SvgIcon icon="material-symbols:content-copy" />
              </NIcon>
            </template>
          </n-button>
          <n-button size="small" secondary @click="exportErrors" title="导出错误" icon-placement="right">
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
        
        <!-- 成功提示 -->
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
import { ref, computed, reactive } from 'vue'
import { NButton, NModal, NSelect, NUpload, useMessage, NIcon } from 'naive-ui'
import type { SelectOption } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui'
import axios from 'axios'
import { getServiceBaseURL } from '@/utils/service'
import { localStg } from '@/utils/storage'
import { useAuthStore } from '@/store/modules/auth';

// const handleSiteChange = (val: number | null, option: SelectOption) => {
//   form.site_id = val
// }

const authStore = useAuthStore();
const hasRole = !authStore.userInfo.roles.includes('3')
const form = reactive({
  order_no: '',
  file: null as File | null
})

const props = defineProps<{
  show: boolean,
  params?: Record<string, any>,
  siteOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'update:show': [value: boolean],
  success: []
}>()

const show = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const message = useMessage()
const { baseURL } = getServiceBaseURL(
  import.meta.env,
  import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'
)

const uploading = ref(false)
const showResult = ref(false)
const importResult = ref<{
  success_count: number
  failure_count: number
  errors: string[]
} | null>(null)

const selectedSite = ref<number | null>(null)
const selectedFile = ref<File | null>(null)

const handleFileChange = ({ file }: { file: UploadFileInfo }) => {
  form.file = file.file || null
}

const handleSubmit = async () => {
  if (!form.order_no) {
    message.warning('请输入工单编号')
    return
  }
  if (!form.file) {
    message.warning('请先选择文件')
    return
  }

  try {
    uploading.value = true

    const token = localStg.get('token')
    const Authorization = token ? `Bearer ${token}` : ''

    const response = await axios.request({
      url: baseURL + '/api/orders/bind', // API Endpoint for Order Import
      method: 'post',
      data: form,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': Authorization
      }
    })

    console.log(response.data);
    if (response.data.code == 0 && response.data.data) {
      importResult.value = response.data.data
      showResult.value = true
      emit('success')
    } else {
      message.error(`文件 ${form.file.name} 导入失败！` + response.data.msg)
      show.value = false
      emit('success')
    }
    
    selectedFile.value = null
    selectedSite.value = null
  } catch (e) {
    console.error(e)
    message.error('文件上传失败')
  } finally {
    uploading.value = false
  }
}

const copyErrors = async () => {
  const errors = importResult.value?.errors || []
  if (!errors.length) {
    message.warning('暂无错误信息可复制')
    return
  }
  const text = errors.join('\n')
  try {
    await navigator.clipboard.writeText(text)
    message.success('错误信息已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      message.success('错误信息已复制到剪贴板')
    } catch (e) {
      message.error('复制失败，请手动复制')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

const exportErrors = () => {
  const errors = importResult.value?.errors || []
  if (!errors.length) {
    message.warning('暂无错误信息可导出')
    return
  }

  const headers = ['序号', '错误信息']
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
  const filename = `导入错误_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('错误信息已导出')
  }

const handleCloseResult = () => {
  showResult.value = false
  show.value = false
  importResult.value = null
}

  // 下载Excel模板
  const downloadTemplate = () => {
      // 创建一个临时链接来下载模板文件
      const link = document.createElement('a');
      link.href = '/template/import_faults_to_order_template.xlsx'; // 模板文件路径
      link.download = '上传故障机绑定工单模板.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('模板下载已开始');
  }

  // ---------------- 数据获取 ----------------
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
