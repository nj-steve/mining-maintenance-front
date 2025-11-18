<template>
  <div>
    <n-upload
      v-model:file-list="fileList"
      list-type="image-card"
      :default-upload="false"
      :on-before-upload="handleBeforeUpload"
      :on-remove="handleRemove"
      :max="max"
      accept="image/*"
    >
      <n-button size="small" type="primary">
        <template #icon>
          <NIcon><SvgIcon icon="material-symbols:upload" /></NIcon>
        </template>
        {{ buttonText }}
      </n-button>
    </n-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { NUpload, NButton, useMessage, NIcon } from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import axios from 'axios'
import { getServiceBaseURL } from '@/utils/service'
import { localStg } from '@/utils/storage'
import { getUploadToken } from '@/service/api/repair'

interface Props {
  extraParams?: Record<string, any>
  images?: string[]
  max?: number
  buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  extraParams: () => ({}),
  images: () => [],
  max: 9,
  buttonText: '上传图片'
})

const emit = defineEmits<{
  uploaded: [url: string]
  removed: [url: string]
  update: [urls: string[]]
}>()

const message = useMessage()
const { baseURL } = getServiceBaseURL(
  import.meta.env,
  import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'
)

const fileList = ref<UploadFileInfo[]>([])

// 初始化 fileList
const initFromImages = () => {
  fileList.value = (props.images || []).map((url, idx) => ({
    id: String(idx),
    name: url.split('/').pop() || `image_${idx}`,
    status: 'finished',
    url
  }))
}

onMounted(initFromImages)
watch(() => props.images, () => {
  initFromImages()
})

const handleBeforeUpload = async ({ file }: { file: UploadFileInfo }) => {
  if (!file.file) return false
  try {
    // 1. 获取上传凭证
    const token = localStg.get('token')
    const Authorization = token ? `Bearer ${token}` : ''
    const tokenResp = await axios.request({
      url: baseURL + '/api/getUploadToken',
      method: 'get',
      data: {
        filename: file.name,
        ...props.extraParams
      },
      headers: {
        Authorization
      }
    })
    console.log('tokenResp', tokenResp)
    const { uploadToken, uploadUrl } = tokenResp.data || {};   
    const tokenData = tokenResp.data?.data || tokenResp.data
    // const uploadToken = tokenData?.token || tokenData?.uptoken
    const domain = tokenData?.domain
    const keyFromServer = tokenData?.key

    if (!uploadToken) {
      message.error('获取上传凭证失败')
      return false
    }

    const key = keyFromServer || generateKey(file.name)

    // 2. 上传到七牛
    const formData = new FormData()
    formData.append('token', uploadToken)
    formData.append('file', file.file)
    formData.append('key', key)

    const resp = await axios.post('https://upload.qiniup.com', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    const returnedKey = resp.data?.key || key
    const url = domain ? `${domain}/${returnedKey}` : buildPublicUrl(returnedKey)

    // 更新 fileList
    fileList.value.push({
      id: String(Date.now()),
      name: file.name,
      status: 'finished',
      url
    })

    emit('uploaded', url)
    emit('update', fileList.value.map(f => f.url!))
    message.success(`图片 ${file.name} 上传成功`)
  } catch (e) {
    console.error(e)
    message.error('图片上传失败')
  }
  return false
}

const handleRemove = ({ file }: { file: UploadFileInfo }) => {
  const url = file.url || ''
  emit('removed', url)
  const newUrls = fileList.value.filter(f => f.id !== file.id).map(f => f.url!)
  emit('update', newUrls)
}

function generateKey(name: string) {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const ts = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const dateStr = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
  const rand = Math.random().toString(36).slice(2, 8)
  return `uploads/${dateStr}_${rand}${ext}`
}

function buildPublicUrl(key: string) {
  // 若服务端未返回域名，暂时返回 key 本身，或在此处拼接一个默认域名
  return key
}
</script>