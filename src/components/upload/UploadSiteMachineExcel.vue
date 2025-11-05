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
  
      <!-- 导入对话框 -->
      <n-modal v-model:show="showModal" preset="dialog" title="导入 Excel">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- 场地下拉选择 -->
          <n-select
           v-if="hasRole"
            v-model:value="selectedSite"
            :options="siteOptions"
            size="small"
            clearable
            filterable
            placeholder="请选择场地"
          />
          <!-- 文件选择 -->
          <n-upload
            size="small"
            :show-file-list="true"
            :default-upload="false"
            :on-change="handleFileChange"
            accept=".xls,.xlsx"
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
  import { ref,onMounted } from 'vue'
  import { NButton, NModal, NSelect, NUpload, useMessage, NIcon } from 'naive-ui'
  import type { SelectOption } from 'naive-ui';
  import type { UploadFileInfo } from 'naive-ui'
  import axios from 'axios'
  import { getServiceBaseURL } from '@/utils/service'
  import { localStg } from '@/utils/storage'
  // import {fetchSites} from "@/service/api/site"
  import { useAuthStore } from '@/store/modules/auth';
const authStore = useAuthStore();
const hasRole=!authStore.userInfo.roles.includes('3')
  
  // ---------------- Props ----------------
  // interface Props {
  //   params?: Record<string, any>,
  //   buttonText?: string,
  //   siteOptions: SelectOption[]
  // }
  const props = defineProps<{
    params?: Record<string, any>,
    buttonText?: string,
    siteOptions: SelectOption[]
  }>()

//   const props = defineProps<{
//    siteOptions: SelectOption[]; 
//   statusOptions: SelectOption[],
//   hasRole:boolean
//   // salerOptions: SelectOption[]

//  }>();
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
  
  // ---------------- Methods ----------------
  const handleFileChange = ({ file }: { file: UploadFileInfo }) => {
    selectedFile.value = file.file || null
  }
  
  const handleSubmit = async () => {
    if (!selectedSite.value && hasRole) {
      message.warning('请选择场地')
      return
    }
    if (!selectedFile.value) {
      message.warning('请先选择文件')
      return
    }
  
    try {
      uploading.value = true
  
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('site_id', String(selectedSite.value))
  
      Object.entries(props?.params || {}).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
  
      const token = localStg.get('token')
      const Authorization = token ? `Bearer ${token}` : ''
  
      const response = await axios.request({
        url: baseURL + '/api/faults/import',
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': Authorization
        }
      })
      // 处理导入结果
      if (response.data && response.data.data) {
        importResult.value = response.data.data
        showResult.value = true
        // 不立即关闭上传弹框，等用户查看结果后手动关闭
        // 触发成功事件，通知父组件刷新数据
        emit('success')
      } else {
        message.error(`文件 ${selectedFile.value.name} 导入失败！`+response.data.msg)
        showModal.value = false
        // 触发成功事件，通知父组件刷新数据
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
  
  // 关闭结果弹框
  const handleCloseResult = () => {
    showResult.value = false
    showModal.value = false
    importResult.value = null
  }

  // 下载Excel模板
  const downloadTemplate = () => {
    // 创建一个临时链接来下载模板文件
    const link = document.createElement('a')
    link.href = '/template/site_machine_template.xlsx' // 模板文件路径
    link.download = '场地故障机导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('模板下载已开始')
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