<template>
  <div class="action-buttons">
    <NButton v-if="!shouldShowDispatch" type="info" ghost size="small" @click="emit('edit')">编辑</NButton>
    <NButton type="success" ghost size="small" @click="emit('add-log')">日志</NButton>
    <NButton type="info" ghost size="small" @click="emit('detail')">历史日志</NButton>
    <!-- <NButton v-if="shouldShowDispatch" type="info" ghost size="small" @click="emit('dispatch')">派单</NButton> -->
    <NButton v-if="shouldShowDispatch" type="error" ghost size="small" @click="emit('return')">撤销</NButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NButton } from 'naive-ui';

const props = defineProps<{ row: any }>();
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