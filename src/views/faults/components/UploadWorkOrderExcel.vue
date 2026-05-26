<template>
  <div>
    <!-- 导入对话框 -->
    <n-modal v-model:show="show" preset="dialog" :title="t('page.faults.uploadWorkOrder.importCreateOrder')">

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- 工单编号 -->
        <n-form-item :label="t('page.faults.uploadWorkOrder.orderNo')" prop="order_no">
          <n-input v-model:value="form.order_no" :placeholder="t('page.faults.uploadWorkOrder.inputOrderNo')" />
        </n-form-item>
        <!-- 工单创建时间 -->
        <n-form-item :label="t('page.faults.uploadWorkOrder.orderCreateTime')" prop="created_at">
          <n-input
            v-model:value="form.date"
            size="small"
            :placeholder="t('page.faults.uploadWorkOrder.selectOrderCreateTime')"
          />
        </n-form-item>
        <!-- 场地下拉选择 -->
        <n-select
          v-if="hasRole"
          v-model:value="form.site_id"
          :options="siteOptions"
          size="small"
          @update:value="handleSiteChange"
          clearable
          filterable
          :placeholder="t('page.faults.uploadWorkOrder.selectSite')"
        />
        <!-- 文件选择 -->
        <n-upload
          v-model:file-list="fileList"
          size="small"
          :show-file-list="true"
          :default-upload="false"
          :on-change="handleFileChange"
          accept=".xls,.xlsx,.xlsm"
        >
          <n-button size="small">{{ t('page.faults.uploadWorkOrder.selectFile') }}</n-button>
        </n-upload>
        <!-- 下载模板链接 -->
        <div style="text-align: left; margin-top: 8px;">
          <n-button text type="primary" @click="downloadTemplate">
            {{ t('page.faults.uploadWorkOrder.downloadTemplate') }}
          </n-button>
        </div>
      </div>
      <template #action>
        <n-button size="small" style="font-size: 12px;" @click="show = false">{{ t('page.faults.uploadWorkOrder.cancel') }}</n-button>
        <n-button size="small" style="font-size: 12px;" type="primary" :loading="uploading" @click="handleSubmit">
          {{ t('page.faults.uploadWorkOrder.confirmImport') }}
        </n-button>
      </template>
    </n-modal>

    <!-- 导入结果弹框 -->
    <n-modal v-model:show="showResult" preset="dialog" :title="t('page.faults.uploadWorkOrder.importResult')" style="width: 600px;">
      <div v-if="importResult" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- 导入统计 -->
        <div style="display: flex; gap: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 6px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #52c41a;">{{ importResult.success_count }}</div>
            <div style="color: #666;">{{ t('page.faults.uploadWorkOrder.successImport') }}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ff4d4f;">{{ importResult.failure_count }}</div>
            <div style="color: #666;">{{ t('page.faults.uploadWorkOrder.failImport') }}</div>
          </div>
        </div>

        <!-- 错误详情 -->
        <div v-if="importResult.errors && importResult.errors.length > 0">
          <h4 style="margin: 0 0 12px 0; color: #ff4d4f;">{{ t('page.faults.uploadWorkOrder.errorDetail') }}</h4>
          <!-- 错误操作：复制与导出 -->
          <div style="display: flex; gap: 8px;margin-top: -40px;  margin-bottom: 8px;justify-content:right">
          <n-button size="small" secondary @click="copyErrors" :title="t('page.faults.uploadWorkOrder.copyError')" icon-placement="right">
            <template #icon>
              <NIcon>
                <SvgIcon icon="material-symbols:content-copy" />
              </NIcon>
            </template>
          </n-button>
          <n-button size="small" secondary @click="exportErrors" :title="t('page.faults.uploadWorkOrder.exportError')" icon-placement="right">
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
          {{ t('page.faults.uploadWorkOrder.allSuccess') }}
        </div>
      </div>

      <template #action>
        <n-button size="small" style="font-size: 12px;" type="primary" @click="handleCloseResult">{{ t('page.faults.uploadWorkOrder.close') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { NButton, NModal, NSelect, NUpload, useMessage, NIcon } from 'naive-ui'
import type { SelectOption } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui'
import axios from 'axios'
import { getServiceBaseURL } from '@/utils/service';
import { localStg } from '@/utils/storage';
import { useAuthStore } from '@/store/modules/auth';
import { useI18n } from 'vue-i18n';
import SvgIcon from '@/components/custom/svg-icon.vue';

const { t } = useI18n();

const handleSiteChange = (val: number | null, option: SelectOption) => {
  form.site_id = val
  form.site_name = option.label as string
  // 工单编号格式：site_name + YYYYMMDD + 3位随机数
  if(form.site_name){
    form.order_no = `${form.site_name}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  }else{
     form.order_no = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  }

}

const authStore = useAuthStore();
const hasRole = !authStore.userInfo.roles.includes('3')
const form = reactive({
  order_no: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
  // selectedSite: null as number | null,
  site_id: null as number | null,
  site_name: '',
  file: null as File | null,
  date: new Date().toISOString().split('T')[0] as string | null
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
const fileList = ref<UploadFileInfo[]>([])

watch(() => props.show, (val) => {
  if (val) {
    form.order_no = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    form.site_id = null
    form.site_name = ''
    form.file = null
    form.date = new Date().toISOString().split('T')[0]
    fileList.value = []
    importResult.value = null
    showResult.value = false
  }
})

const handleFileChange = ({ file }: { file: UploadFileInfo }) => {
  form.file = file.file || null
}

const handleSubmit = async () => {
  if (!form.site_id && hasRole) {
    message.warning(t('page.faults.uploadWorkOrder.pleaseSelectSite'))
    return
  }
  if (!form.file) {
    message.warning(t('page.faults.uploadWorkOrder.pleaseSelectFile'))
    return
  }

  try {
    uploading.value = true

    // const formData = new FormData()
    // formData.append('file', form.file)
    // formData.append('site_id', String(form.site_id))

    // Object.entries(props?.params || {}).forEach(([key, value]) => {
    //   form.append(key, String(value))
    // })

    const token = localStg.get('token')
    const Authorization = token ? `Bearer ${token}` : ''

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as any);
      }
    });

    if (authStore.activeGroupId) {
      formData.append('group_id', String(authStore.activeGroupId));
    }

    const response = await axios.request({
      url: baseURL + '/api/orders/import', // API Endpoint for Order Import
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': Authorization,
        'Group-Id': authStore.activeGroupId || ''
      }
    })

    console.log(response.data);
    if (response.data.code == 0 && response.data.data) {
      importResult.value = response.data.data
      showResult.value = true
      emit('success')
    } else {
      message.error(t('page.faults.uploadBindWorkOrder.importFailedFile', { name: form.file.name }) + response.data.msg)
      show.value = false
      emit('success')
    }

    selectedFile.value = null
    selectedSite.value = null
  } catch (e) {
    console.error(e)
    message.error(t('page.faults.uploadWorkOrder.fileUploadFailed'))
  } finally {
    uploading.value = false
  }
}

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
  const filename = `importError_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success(t('page.faults.uploadBindWorkOrder.exportSuccess'))
  }

const handleCloseResult = () => {
  showResult.value = false
  show.value = false
  importResult.value = null
}

  // 下载Excel模板
  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/template/import_faults_to_order_template.xlsx'
    link.download = '工单导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
