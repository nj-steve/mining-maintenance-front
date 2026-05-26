<template>
    <n-upload
      size="small"
      :show-file-list="false"
      :default-upload="false"
      :on-before-upload="handleUpload"
    >
      <n-button type="primary">{{ buttonText }}</n-button>
    </n-upload>
  </template>

  <script setup lang="ts">
  import { NUpload, NButton, useMessage } from 'naive-ui'
  import type { UploadFileInfo } from 'naive-ui'
  import { getServiceBaseURL } from '@/utils/service';
  import { localStg } from '@/utils/storage';
  import { useAuthStore } from '@/store/modules/auth';

  const { baseURL } = getServiceBaseURL(import.meta.env, import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y');
  // import{importProcurement} from '@/service/api/asset'
  import axios from 'axios'

  // ---------------- Props ----------------upup
  interface Props {
    uploadUrl: string             // 上传接口
    params?: Record<string, any>   // 额外参数（默认空对象）
    buttonText?: string           // 按钮文字（默认 “导入 Excel”）
    // method?: 'post' | 'put'        // 请求方法（默认 post）
  }

  const props = withDefaults(defineProps<Props>(), {
    params: () => ({}),
    buttonText: '导入',
    method: 'post'
  })

  // ---------------- State & Methods ----------------
  const message = useMessage()
  const authStore = useAuthStore()

  const handleUpload = async ({ file }: { file: UploadFileInfo }) => {
    if (!file.file) return false

    try {
      const formData = new FormData()
      formData.append('file', file.file)

      if (authStore.activeGroupId) {
        formData.append('group_id', String(authStore.activeGroupId))
      }

      // 追加额外参数
      Object.entries(props.params).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      // 调用接口
      // const res = await importProcurement(formData)
      // console.log(res)
            // set token
      const token = localStg.get('token');
      const Authorization = token ? `Bearer ${token}` : null;
    //   Object.assign(headers, { Authorization });
      await axios.request({
        url: baseURL +props.uploadUrl,
        method: "post",
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': Authorization,   // ✅ 把 token 带上
            'Group-Id': authStore.activeGroupId || ''
         }
      })

      message.success(`文件 ${file.name} 上传成功！`)
    } catch (e) {
      console.error(e)
      message.error('文件上传失败')
    }

    return false // 阻止 naive-ui 默认上传
  }
  </script>
