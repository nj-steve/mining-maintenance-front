<script setup lang="ts">
import { computed } from 'vue';
import { NCheckbox, NInput, NSelect } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const translatedRepairTypeOptions = computed(() => [
  { label: t('business.repairType.wholeMachine'), value: "整机" },
  { label: t('business.repairType.hashBoard'), value: "算力板" },
]);

const translatedRepairResultOptions = computed(() => [
  { label: t('business.repairResult.pending'), value: 1 },
  { label: t('business.repairResult.unrepaired'), value: 2 },
  { label: t('business.repairResult.repaired'), value: 3 },
  { label: t('business.repairResult.scrapped'), value: 4 },
]);

const props = defineProps<{
  workOrderNo: string;
  sn: string;
  macAddress: string;
  verifiedOnly: boolean;
  repairResult?: number;
  siteId?: number;
  repairType?: number;
  siteOptions?: { label: string; value: number }[];
}>();

const emit = defineEmits<{
  (e: 'update:work-order-no', val: string): void;
  (e: 'update:sn', val: string): void;
  (e: 'update:mac-address', val: string): void;
  (e: 'update:verified-only', val: boolean): void;
  (e: 'update:repair-result', val?: number): void;
  (e: 'update:site-id', val?: number): void;
  (e: 'update:repair-type', val?: number): void;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">

    <NInput
      :value="workOrderNo"
      :placeholder="t('page.repairRecords.pleaseEnterWorkOrderNo')"
      clearable
      size="small"
      class="text-sm"
      style="width: 220px"
      @update:value="emit('update:work-order-no', $event)"
    />
    <NInput
      :value="sn"
      :placeholder="t('page.repairRecords.pleaseEnterMachineSn')"
      clearable
      size="small"
      class="text-sm"
      style="width: 220px"
      @update:value="emit('update:sn', $event)"
    />
    <NInput
      :value="macAddress"
      :placeholder="t('page.repairRecords.searchMacAddress')"
      clearable
      size="small"
      style="width: 200px"
      @update:value="emit('update:mac-address', $event)"
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
      :options="translatedRepairTypeOptions"
      :placeholder="t('page.repairRecords.repairType')"
      clearable
      size="small"
      class="text-sm"
      style="width: 120px;"
      @update:value="emit('update:repair-type', $event)"
    />
    <NSelect
      :value="repairResult"
      :options="translatedRepairResultOptions"
      clearable
      :placeholder="t('page.repairRecords.repairResult')"
      size="small"
      class="text-sm"
      style="width: 120px;"
      @update:value="emit('update:repair-result', $event)"
    />
    <NCheckbox :checked="verifiedOnly" size="small" @update:checked="emit('update:verified-only', $event)">
      {{ t('page.repairRecords.verifiedMacOnly') }}
    </NCheckbox>
  </div>
</template>
