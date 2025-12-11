<script setup lang="ts">
import { NInput, NSelect } from 'naive-ui';
import { repairResultOptions } from '@/constants/business'

const props = defineProps<{
  workOrderNo: string;
  sn: string;
  repairResult?: number;
}>();

const emit = defineEmits<{
  (e: 'update:work-order-no', val: string): void;
  (e: 'update:sn', val: string): void;
  (e: 'update:repair-result', val?: number): void;
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
      clearable
      size="small"
      class="text-sm"
      style="width: 280px"
      @update:value="emit('update:sn', $event)"
    />
    <NSelect
      :value="repairResult"
      :options="repairResultOptions"
      clearable
      size="small"
      class="text-sm"
      style="width: 120px;"
      @update:value="emit('update:repair-result', $event)"
    />
  </div>
</template>