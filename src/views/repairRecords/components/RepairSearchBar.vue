<script setup lang="ts">
import { NInput, NSelect } from 'naive-ui';
import { repairResultOptions, repairTypeOptions } from '@/constants/business'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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
      :placeholder="t('page.repairRecords.pleaseEnterWorkOrderNo')"
      clearable
      size="small"
      class="text-sm"
      style="width: 280px"
      @update:value="emit('update:work-order-no', $event)"
    />
    <NInput
      :value="sn"
      :placeholder="t('page.repairRecords.pleaseEnterMachineSn')"
      clearable
      size="small"
      class="text-sm"
      style="width: 280px"
      @update:value="emit('update:sn', $event)"
    />
     <NSelect
      v-if="siteOptions"
      :value="siteId"
      :options="siteOptions"
      :placeholder="t('page.repairRecords.pleaseSelectSite')"
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
      :placeholder="t('page.repairRecords.repairType')"
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
      :placeholder="t('page.repairRecords.repairResult')"
      size="small"
      class="text-sm"
      style="width: 120px;"
      @update:value="emit('update:repair-result', $event)"
    />
  </div>
</template>
