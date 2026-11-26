<script setup lang="ts">
import { computed } from 'vue';
import { NCheckbox, NInput, NSelect } from 'naive-ui';
import SearchIcon from '~icons/ant-design/search-outlined';
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
  repairType?: string;
  siteOptions?: { label: string; value: number }[];
}>();

const emit = defineEmits<{
  (e: 'update:work-order-no', val: string): void;
  (e: 'update:sn', val: string): void;
  (e: 'update:mac-address', val: string): void;
  (e: 'update:verified-only', val: boolean): void;
  (e: 'update:repair-result', val?: number): void;
  (e: 'update:site-id', val?: number): void;
  (e: 'update:repair-type', val?: string): void;
}>();
</script>

<template>
  <div class="repair-filters">
    <div class="repair-filters__mac">
      <NInput
        :value="macAddress"
        :placeholder="t('page.repairRecords.searchMacAddress')"
        :input-props="{ 'aria-label': t('page.repairRecords.macAddress') }"
        clearable
        size="small"
        class="repair-filters__mac-input"
        @update:value="emit('update:mac-address', $event)"
      >
        <template #prefix><SearchIcon /></template>
      </NInput>
      <NCheckbox
        :checked="verifiedOnly"
        :class="{ 'repair-filters__verified--active': verifiedOnly }"
        class="repair-filters__verified"
        size="small"
        @update:checked="emit('update:verified-only', $event)"
      >
        {{ t('page.repairRecords.verifiedMacOnly') }}
      </NCheckbox>
    </div>

    <div class="repair-filters__details">
      <NSelect
        v-if="siteOptions"
        :value="siteId"
        :options="siteOptions"
        class="repair-filters__site"
        :placeholder="t('page.repairRecords.site')"
        clearable
        filterable
        size="small"
        @update:value="emit('update:site-id', $event ?? undefined)"
      />
      <NInput
        :value="sn"
        :placeholder="t('page.repairRecords.snCode')"
        :input-props="{ 'aria-label': t('page.repairRecords.snCode') }"
        clearable
        size="small"
        @update:value="emit('update:sn', $event)"
      />
      <NInput
        :value="workOrderNo"
        :placeholder="t('page.repairRecords.orderNo')"
        :input-props="{ 'aria-label': t('page.repairRecords.orderNo') }"
        clearable
        size="small"
        @update:value="emit('update:work-order-no', $event)"
      />
      <NSelect
        :value="repairType"
        :options="translatedRepairTypeOptions"
        :placeholder="t('page.repairRecords.repairType')"
        clearable
        size="small"
        @update:value="emit('update:repair-type', $event ?? undefined)"
      />
      <NSelect
        :value="repairResult"
        :options="translatedRepairResultOptions"
        :placeholder="t('page.repairRecords.repairResult')"
        clearable
        size="small"
        @update:value="emit('update:repair-result', $event ?? undefined)"
      />
    </div>
  </div>
</template>

<style scoped>
.repair-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  padding: 10px 12px;
  border: 1px solid var(--repair-line);
  border-radius: 10px;
  background: var(--repair-surface);
}

.repair-filters__mac {
  display: flex;
  flex: 0 1 356px;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px;
  border: 1px solid var(--repair-verified-line);
  border-radius: 8px;
  background: var(--repair-verified-tint);
}

.repair-filters__mac-input {
  flex: 1;
  min-width: 0;
}

.repair-filters__verified {
  flex: none;
  align-items: center;
  min-height: 28px;
  padding-inline: 8px 4px;
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--repair-ink);
  font-weight: 600;
  white-space: nowrap;
}

.repair-filters__verified:hover,
.repair-filters__verified--active {
  border-color: var(--repair-verified-line);
  background: var(--repair-verified-fill);
}

.repair-filters__details {
  display: grid;
  flex: 1 1 570px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

@media (max-width: 700px) {
  .repair-filters__mac {
    flex-basis: 100%;
  }

  .repair-filters__details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .repair-filters__site {
    grid-column: 1 / -1;
  }
}
</style>
