<template>
    <div>
      <!-- 触发按钮 -->
      <n-button type="primary" @click="showModal = true">
        {{ buttonText }}
      </n-button>
  
      <!-- 导入对话框 -->
      <n-modal v-model:show="showModal" preset="dialog" title="导入 Excel">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- 场地下拉选择 -->
          <n-select
            v-model:value="selectedSite"
            :options="siteOptions"
            placeholder="请选择场地"
          />
  
          <!-- 文件选择 -->
          <n-upload
            :show-file-list="true"
            :default-upload="false"
            :on-change="handleFileChange"
            accept=".xls,.xlsx"
          >
            <n-button>选择文件</n-button>
          </n-upload>
        </div>
  
        <template #action>
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="uploading" @click="handleSubmit">
            确定导入
          </n-button>
        </template>
      </n-modal>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref,onMounted } from 'vue'
  import { NButton, NModal, NSelect, NUpload, useMessage } from 'naive-ui'
  import type { UploadFileInfo } from 'naive-ui'
  import axios from 'axios'
  import { getServiceBaseURL } from '@/utils/service'
  import { localStg } from '@/utils/storage'
  import {fetchSites} from "@/service/api/site"
  
  // ---------------- Props ----------------
  interface Props {
    params?: Record<string, any>
    buttonText?: string
  }
  const props = withDefaults(defineProps<Props>(), {
    params: () => ({}),
    buttonText: '导入'
  })

  const tableData = ref([]);
  
  // ---------------- State ----------------
  const message = useMessage()
  const { baseURL } = getServiceBaseURL(
    import.meta.env,
    import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'
  )
  onMounted(() => {
    fetchData() 
  });

  const showModal = ref(false)
  const uploading = ref(false)
  
  const siteOptions = ref([
    { label: '场地 A', value: 1 },
    { label: '场地 B', value: 2 },
    // { label: '场地 C', value: 3 }
  ])
  const selectedSite = ref<number | null>(null)
  const selectedFile = ref<File | null>(null)
  
  // ---------------- Methods ----------------
  const handleFileChange = ({ file }: { file: UploadFileInfo }) => {
    selectedFile.value = file.file || null
  }
  
  const handleSubmit = async () => {
    if (!selectedSite.value) {
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
  
      Object.entries(props.params).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
  
      const token = localStg.get('token')
      const Authorization = token ? `Bearer ${token}` : ''
  
      await axios.request({
        url: baseURL + '/api/faults/import',
        method: 'post',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': Authorization
        }
      })
  
      message.success(`文件 ${selectedFile.value.name} 上传成功！`)
      showModal.value = false
      selectedFile.value = null
      selectedSite.value = null
    } catch (e) {
      console.error(e)
      message.error('文件上传失败')
    } finally {
      uploading.value = false
    }
  }

  // ---------------- 数据获取 ----------------
const fetchData = async () => {
  const params: any = {
    page: 1,
    page_size: 1000,
    sn: ''
  };

  try {
    const {data,error} = await fetchSites(params);
    if(error==null){
        // tableData.value = data.list;
         // 假设返回 res.data 是上面的数组
      siteOptions.value = data.list.map((item: any) => ({
        label: item.Name,
        value: item.ID
      }))

    }else{
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  }
};
  </script>