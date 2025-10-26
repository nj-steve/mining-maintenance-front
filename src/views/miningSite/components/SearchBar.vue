<template>
  <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: flex-end; margin-bottom: 16px">
    <!-- 场地名称搜索 -->
    <NInput
      v-model:value="serialModel"
      @change="emit('search')"
      placeholder="请输入场地名称"
      clearable
      style="width: 240px"
      size="small"
    />

    <!-- 售后专员下拉搜索 -->
    <NSelect
      v-model:value="salerIdModel"
      :options="salerOptions"
      clearable
      filterable
      placeholder="选择售后专员"
      style="width: 200px"
      size="small"
      @update:value="emit('search')"
    />

    <!-- 站点状态下拉搜索 -->
    <NSelect
      v-model:value="siteStatusModel"
      :options="siteStatusOptions"
      clearable
      filterable
      placeholder="选择站点状态"
      style="width: 200px"
      size="small"
      @update:value="emit('search')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NInput, NSelect } from 'naive-ui';
import type { SelectOption } from 'naive-ui';

const props = defineProps<{
  serial: string;
  salerId: number | null;
  siteStatus: number | null;
  salerOptions: SelectOption[];
  siteStatusOptions: SelectOption[];
}>();

const emit = defineEmits<{
  (e: 'update:serial', v: string): void;
  (e: 'update:salerId', v: number | null): void;
  (e: 'update:siteStatus', v: number | null): void;
  (e: 'search'): void;
}>();

const serialModel = computed({
  get: () => props.serial,
  set: v => emit('update:serial', v)
});

const salerIdModel = computed({
  get: () => props.salerId,
  set: v => emit('update:salerId', v as number | null)
});

const siteStatusModel = computed({
  get: () => props.siteStatus,
  set: v => emit('update:siteStatus', v as number | null)
});
</script>

<style scoped>
</style>