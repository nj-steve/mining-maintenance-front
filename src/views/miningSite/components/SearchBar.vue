<template>
  <div class="report-filters">
    <div class="report-filter report-filter--date">
      <span class="report-filter-label">{{ t('page.miningSite.reportDate') }}</span>
      <NDatePicker
        v-model:formatted-value="dateModel"
        value-format="yyyy-MM-dd"
        type="date"
        :placeholder="t('page.miningSite.latestReport')"
        :aria-label="t('page.miningSite.reportDate')"
        clearable
        size="small"
      />
    </div>

    <div class="report-filter report-filter--site">
      <span class="report-filter-label">{{ t('page.miningSite.siteName') }}</span>
      <NInput
        v-model:value="serialModel"
        :placeholder="t('page.miningSite.searchBar.placeholder.siteName')"
        :input-props="{ 'aria-label': t('page.miningSite.siteName') }"
        clearable
        size="small"
      >
        <template #prefix><SearchIcon aria-hidden="true" /></template>
      </NInput>
    </div>

    <div class="report-filter">
      <span class="report-filter-label">{{ t('page.miningSite.afterSalesSpecialist') }}</span>
      <NSelect
        v-model:value="salerIdModel"
        :options="salerOptions"
        :placeholder="t('page.miningSite.allFilterValues')"
        :aria-label="t('page.miningSite.afterSalesSpecialist')"
        clearable
        filterable
        size="small"
      />
    </div>

    <div class="report-filter">
      <span class="report-filter-label">{{ t('page.miningSite.repairStatus') }}</span>
      <NSelect
        v-model:value="siteStatusModel"
        :options="siteStatusOptions"
        :placeholder="t('page.miningSite.allFilterValues')"
        :aria-label="t('page.miningSite.repairStatus')"
        clearable
        filterable
        size="small"
      />
    </div>

    <div class="report-filter">
      <span class="report-filter-label">{{ t('page.miningSite.orderBinding') }}</span>
      <NSelect
        v-model:value="bindTypeModel"
        :options="bindTypeOptions"
        :placeholder="t('page.miningSite.allFilterValues')"
        :aria-label="t('page.miningSite.orderBinding')"
        clearable
        filterable
        size="small"
      />
    </div>

    <div class="report-filter-scope">
      <NCheckbox v-model:checked="statusModel" size="small">
        {{ t('page.miningSite.searchBar.allSites') }}
      </NCheckbox>
      <slot name="scope" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NInput, NSelect, NDatePicker, NCheckbox } from 'naive-ui';
import SearchIcon from '~icons/ant-design/search-outlined';
import type { SelectOption } from 'naive-ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = withDefaults(defineProps<{
  date: string | null;
  serial: string;
  salerId: number | null;
  siteStatus: number | null;
  bindType: string | null;
  status: string;
  salerOptions: SelectOption[];
  siteStatusOptions: SelectOption[];
  bindTypeOptions: SelectOption[];
}>(), {
  status: 'active'
});

const emit = defineEmits<{
  (e: 'update:date', v: string | null): void;
  (e: 'update:serial', v: string): void;
  (e: 'update:salerId', v: number | null): void;
  (e: 'update:siteStatus', v: number | null): void;
  (e: 'update:bindType', v: string | null): void;
  (e: 'update:status', v: string): void;
}>();

const dateModel = computed({
  get: () => props.date,
  set: v => emit('update:date', v)
});

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

const bindTypeModel = computed({
  get: () => props.bindType,
  set: v => emit('update:bindType', v as string | null)
});

const statusModel = computed({
  get: () => props.status === 'all',
  set: v => emit('update:status', v ? 'all' : 'active')
});
</script>

<style scoped>
.report-filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px 12px; }
.report-filter { flex: 1 1 112px; min-width: 112px; }
.report-filter--date { flex: 1 1 142px; min-width: 142px; }
.report-filter--site { flex: 2 1 172px; min-width: 160px; }
.report-filter-label { display: block; margin: 0 0 4px; color: var(--report-secondary); font-size: 12px; font-weight: 600; }
.report-filter-scope { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; min-height: 28px; color: var(--report-secondary); font-size: 12px; white-space: nowrap; }
</style>
