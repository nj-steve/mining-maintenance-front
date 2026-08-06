<template>
  <div class="p-4">
    <NCard :title="t('page.synctask.title')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="flex items-center gap-4">
        <NButton type="primary" :loading="loading" @click="handleSync">
          <template #icon>
            <Icon icon="mdi:sync" />
          </template>
          {{ t('page.synctask.syncAssetSites') }}
        </NButton>
        <span class="text-gray-500 text-sm">{{ t('page.synctask.syncDesc') }}</span>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NButton, useMessage } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import { request } from '@/service/request';
import { Icon } from '@iconify/vue';

const { t } = useI18n();
const message = useMessage();
const loading = ref(false);

async function handleSync() {
  loading.value = true;
  try {
    const res = await request<any>({
      url: '/api/data/sync_asset_sites',
      method: 'POST'
    });
    
    // 假设只要不抛出异常就是成功
    message.success(t('page.synctask.syncSuccess'));
  } catch (err: any) {
    // 错误拦截器会自动处理报错信息
  } finally {
    loading.value = false;
  }
}
</script>
