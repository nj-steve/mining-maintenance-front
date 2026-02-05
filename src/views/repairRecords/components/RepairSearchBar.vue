<script setup lang="ts">
import { NInput, NSelect } from 'naive-ui';
import { repairResultOptions, repairTypeOptions } from '@/constants/business'

const props = defineProps<{
  workOrderNo: string;
  sn: string;
  repairResult?: number;
  siteId?: number;
  repairType?: number;
  siteOptions?: { label: string; value: number }[];
}>();

const emit = defineEmits<{
  (e: 'update:work-order-no', val: string): void;
  (e: 'update:sn', val: string): void;
  (e: 'update:repair-result', val?: number): void;
  (e: 'update:site-id', val?: number): void;
  (e: 'update:repair-type', val?: number): void;
}>();
</script>

<template>
  <div style="display: flex; gap: 8px; align-items: center;">

    <NInput
      :value="workOrderNo"
      placeholder="请输入工单号"
      clearable
      size="small"
      class="text-sm"
      style="width: 280px"
      @update:value="emit('update:work-order-no', $event)"
    />
    <NInput
      :value="sn"
      placeholder="请输入机器SN"
      clearablegaigai
      size="small"
      class="text-sm"
      style="width: 280px"
      @update:value="emit('update:sn', $event)"
    />
     <NSelect
      v-if="siteOptions"
      :value="siteId"
      :options="siteOptions"
      placeholder="请选择场地"
      clearable
      filterable
      size="small"
      class="text-sm"
      style="width: 180px;"
      @update:value="emit('update:site-id', $event)"
    />
    <NSelect
      :value="repairType"
      :options="repairTypeOptions"
      placeholder="维修类型"
      clearable
      size="small"
      class="text-sm"
      style="width: 120px;"
      @update:value="emit('update:repair-type', $event)"
    />
    <NSelect
      :value="repairResult"
      :options="repairResultOptions"
      clearable
       placeholder="维修结果"
      size="small"
      class="text-sm"
      style="width: 120px;"
      @update:value="emit('update:repair-result', $event)"
    />
  </div>
</template>
