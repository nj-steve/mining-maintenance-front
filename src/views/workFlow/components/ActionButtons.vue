<template>
  <div class="action-buttons">
    <NButton v-if="!shouldShowDispatch && hasRole" type="info" ghost size="small" @click="emit('edit')" >{{ t('page.workflow.edit') }}</NButton>
    <NButton type="success" ghost size="small" @click="emit('add-log')" v-if="hasRole">{{ t('page.workflow.log') }}</NButton>
    <NButton type="info" ghost size="small" @click="emit('detail')">{{ t('page.workflow.historyLog') }}</NButton>
    <!-- <NButton v-if="shouldShowDispatch" type="info" ghost size="small" @click="emit('dispatch')">{{ t('page.workflow.dispatch') }}</NButton> -->
    <NButton v-if="shouldShowDispatch && hasRole" type="error" ghost size="small" @click="emit('return')">{{ t('page.workflow.revoke') }}</NButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NButton } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{ row: any,hasRole:boolean }>();
const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'add-log'): void;
  (e: 'detail'): void;
  (e: 'dispatch'): void;
  (e: 'return'): void;
}>();

const shouldShowDispatch = computed(() => {
  const r = props.row as Record<string, any> | null | undefined;
  return !!r && Number(r.StationID) === 0;
});
</script>

<style scoped>
.action-buttons{
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.action-buttons :deep(.n-button){
  font-size: 12px;
}
</style>
