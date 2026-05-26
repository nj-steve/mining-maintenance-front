<template>
    <div>
      <!-- 触发按钮 -->
      <n-button v-if="showTrigger" size="small" ghost type="primary" @click="showModal = true">
        <template #icon>
          <NIcon>
            <SvgIcon icon="material-symbols:upload" />
          </NIcon>
        </template>
        {{ buttonText }}
      </n-button>

      <!-- 导入对话框 -->
      <n-modal v-model:show="showModal" preset="dialog" :title="currentTitle">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- 场地下拉选择 -->
          <n-select
           v-if="hasRole || siteOptions.length > 1"
            v-model:value="selectedSite"
            :options="siteOptions"
            size="small"
            clearable
            filterable
            :placeholder="$t('page.faults.bindWorkOrder.selectSite')"
          />
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

      <!-- 导入结果弹框 -->
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
            <!-- <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <n-button size="small" secondary @click="copyErrors">复制错误信息</n-button>
              <n-button size="small" secondary @click="exportErrors">导出错误</n-button>
            </div> -->
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #d9d9d9; border-radius: 4px; padding: 12px; background-color: #fff;">
              <div v-for="(error, index) in importResult.errors" :key="index" style="margin-bottom: 8px; padding: 8px; background-color: #fff2f0; border-left: 3px solid #ff4d4f; font-family: monospace; font-size: 13px;">
                {{ error }}
              </div>
            </div>
          </div>

          <!-- 成功提示 -->
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
  import { ref,onMounted } from 'vue'
  import { NButton, NModal, NSelect, NUpload, useMessage, NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui';
  import type { UploadFileInfo } from 'naive-ui'
  import axios from 'axios'
  import { getServiceBaseURL } from '@/utils/service'
  import { localStg } from '@/utils/storage'
  import { useI18n } from 'vue-i18n'
  // import {fetchSites} from "@/service/api/site"
  import { useAuthStore } from '@/store/modules/auth';

const { t } = useI18n();
const authStore = useAuthStore();
const hasRole=!authStore.userInfo.roles.includes('3')

  // ---------------- Props ----------------
  // interface Props {
  //   params?: Record<string, any>,
  //   buttonText?: string,
  //   siteOptions: SelectOption[]
  // }
  const props = withDefaults(defineProps<{
    params?: Record<string, any>,
    buttonText?: string,
    siteOptions: SelectOption[],
    showTrigger?: boolean
  }>(), {
    showTrigger: true
  })

  // ---------------- Emits ----------------
  const emit = defineEmits<{
    success: []
  }>()

  // const tableData = ref([]);

  // ---------------- State ----------------
  const message = useMessage()
  const { baseURL } = getServiceBaseURL(
    import.meta.env,
    import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'
  )

  // Dynamic Configuration State
  const currentTitle = ref(t('page.faults.uploadBindWorkOrder.importExcel'))
  const currentUploadUrl = ref('/api/faults/import')
  const currentTemplateUrl = ref('/template/site_machine_template.xlsx')
  const currentTemplateName = ref(t('page.faults.uploadBindWorkOrder.siteMachineTemplate'))

  onMounted(() => {
    if(!hasRole){
      return
    }
    // fetchData()
  });

  const showModal = ref(false)
  const uploading = ref(false)
  const showResult = ref(false)
  const importResult = ref<{
    success_count: number
    failure_count: number
    errors: string[]
  } | null>(null)

  // const siteOptions = ref([])
  const selectedSite = ref<number | null>(null)
  const selectedFile = ref<File | null>(null)

  // ---------------- Expose ----------------
  interface OpenOptions {
    uploadUrl?: string
    templateUrl?: string
    templateName?: string
    title?: string
  }

  const open = (options?: OpenOptions) => {
    // Reset to defaults or apply options
    currentUploadUrl.value = options?.uploadUrl || '/api/faults/import'
    currentTemplateUrl.value = options?.templateUrl || '/template/site_machine_template.xlsx'
    currentTemplateName.value = options?.templateName || t('page.faults.uploadBindWorkOrder.siteMachineTemplate')
    currentTitle.value = options?.title || t('page.faults.uploadBindWorkOrder.importExcel')

    selectedFile.value = null
    selectedSite.value = null
    showModal.value = true
  }

  defineExpose({ open })

  // ---------------- Methods ----------------
  const handleFileChange = ({ file }: { file: UploadFileInfo }) => {
    selectedFile.value = file.file || null
  }

  const handleSubmit = async () => {
    if (!selectedSite.value && hasRole) {
      message.warning(t('page.faults.bindWorkOrder.selectSite'))
      return
    }
    if (!selectedFile.value) {
      message.warning(t('page.faults.uploadBindWorkOrder.pleaseSelectFile'))
      return
    }

    try {
      uploading.value = true

      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('site_id', String(selectedSite.value))

      if (authStore.activeGroupId) {
        formData.append('group_id', String(authStore.activeGroupId))
      }

      Object.entries(props?.params || {}).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      const token = localStg.get('token')
      const Authorization = token ? `Bearer ${token}` : ''

      const response = await axios.request({
        url: baseURL + currentUploadUrl.value,
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': Authorization
        }
      })

      console.log(response.data);
      // 处理导入结果
      if (response.data.code==0 && response.data.data) {
        importResult.value = response.data.data
        showResult.value = true
        // 不立即关闭上传弹框，等用户查看结果后手动关闭
        // 触发成功事件，通知父组件刷新数据
        emit('success')
      } else {
        message.error(t('page.faults.uploadBindWorkOrder.importFailedFile', { name: selectedFile.value.name }) + response.data.msg)
        showModal.value = false
        // 触发成功事件，通知父组件刷新数据
        emit('success')
      }

      selectedFile.value = null
      selectedSite.value = null
    } catch (e) {
      console.error(e)
      message.error(t('page.faults.uploadBindWorkOrder.fileUploadFailed'))
    } finally {
      uploading.value = false
    }
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
      // 兼容性降级方案
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
    const filename = `${t('page.faults.uploadBindWorkOrder.importErrorPrefix')}${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.csv`
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success(t('page.faults.uploadBindWorkOrder.exportSuccess'))
  }

  // 关闭结果弹框
  const handleCloseResult = () => {
    showResult.value = false
    showModal.value = false
    importResult.value = null
  }

  const downloadTemplate = () => {
    // 获取当前语言环境，默认取缓存或者 i18n 配置
    const currentLang = localStorage.getItem('SOY_lang') || 'zh-cn';
    // 创建一个临时链接来下载模板文件
    const link = document.createElement('a')
    // 动态根据语言选择模板
    let finalTemplateUrl = currentTemplateUrl.value;
    if (currentLang.includes("en") && finalTemplateUrl.includes('site_machine_template.xlsx')) {
       finalTemplateUrl = '/template/site_machine_template_en.xlsx';
    }
    if (currentLang.includes("en") && finalTemplateUrl.includes('site_board_template.xlsx')) {
       finalTemplateUrl = '/template/site_board_template_en.xlsx';
    }
    console.log("finalTemplateUrl》〉:", finalTemplateUrl);

    link.href = finalTemplateUrl // 模板文件路径
    link.download = currentTemplateName.value
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success(t('page.faults.uploadBindWorkOrder.templateDownloaded'))
  }

  // ---------------- 数据获取 ----------------
// const fetchData = async () => {
//   if(!hasRole){
//     return
//   }
//   const params: any = {
//     page: 1,
//     page_size: 1000,
//     sn: ''
//   };

//   try {
//     const {data,error} = await fetchSites(params);
//     if(error==null){
//         // tableData.value = data.list;
//          // 假设返回 res.data 是上面的数组
//       siteOptions.value = data.list.map((item: any) => ({
//         label: item.name,
//         value: item.id
//       }))

//     }else{
//         message.error(`加载失败: ${error}`);
//     }
//   } catch (err) {
//     message.error(`加载失败${err}`);
//   }
// };
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
