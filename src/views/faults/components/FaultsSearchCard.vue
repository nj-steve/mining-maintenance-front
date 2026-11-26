<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref, useId, watch } from 'vue';
import { NButton, NCheckbox, NDatePicker, NEllipsis, NInput, NSelect, useThemeVars } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import CollapseChevron from '~icons/ant-design/down-outlined';
import SearchIcon from '~icons/ant-design/search-outlined';
import { fetchUser } from '@/service/api';

const { t } = useI18n();
const theme = useThemeVars();

const serial = defineModel<string>('serial', { default: '' });
const workOrderNo = defineModel<string>('workOrderNo', { default: '' });
const siteId = defineModel<number | null>('siteId', { default: null });
const startDate = defineModel<string | null>('startDate', { default: null });
const endDate = defineModel<string | null>('endDate', { default: null });
const status = defineModel<number | null>('status', { default: null });
const resultStatus = defineModel<number | null>('resultStatus', { default: null });
const salerId = defineModel<number | null>('salerId', { default: null });
const repairType = defineModel<string | null>('repairType', { default: null });
const hasAbnormalLogs = defineModel<boolean>('hasAbnormalLogs', { default: false });

const props = defineProps<{
  siteOptions: SelectOption[];
  statusOptions: SelectOption[];
  repairTypeOptions?: SelectOption[];
  hasRole: boolean;
}>();
const emit = defineEmits<{ search: [] }>();

const expanded = ref(true);
const advancedFiltersId = useId();
const salerOptions = ref<SelectOption[]>([]);
const onlyMySite = ref(localStorage.getItem('onlyMySite') === 'true');
let onlyMySitePoller: number;

const searchLabel = computed(() => t('page.faults.searchCard.search'));
const snLabel = computed(() => t('page.faults.snCode'));
const orderLabel = computed(() => t('page.faults.orderNo'));
const repairResultOptions = computed(() => [
  { label: t('business.repairResult.pending'), value: 1 },
  { label: t('business.repairResult.unrepaired'), value: 2 },
  { label: t('business.repairResult.repaired'), value: 3 },
  { label: t('business.repairResult.scrapped'), value: 4 }
]);
const panelStyle = computed(() => ({
  '--fault-filter-surface': theme.value.cardColor,
  '--fault-filter-divider': theme.value.dividerColor,
  '--fault-filter-border': theme.value.borderColor,
  '--fault-filter-accent': theme.value.primaryColor
}));

function renderFilterOption(option: SelectOption, selected: boolean) {
  const { label } = option;
  if (typeof label === 'function') return label(option, selected);
  return h(
    NEllipsis,
    {
      tooltip: {
        contentStyle: { maxWidth: 'min(420px, calc(100vw - 32px))', overflowWrap: 'anywhere', whiteSpace: 'normal' }
      }
    },
    { default: () => String(label ?? '') }
  );
}

async function fetchSalerOptions() {
  const { data, error } = await fetchUser({ page: 1, page_size: -1, status: 1, role: 2 });
  if (!error && data) {
    salerOptions.value = data.list.map((user: { id: number; real_name: string }) => ({
      label: user.real_name,
      value: Number(user.id)
    }));
  }
}

function syncOnlyMySite() {
  onlyMySite.value = localStorage.getItem('onlyMySite') === 'true';
}

onMounted(() => {
  if (props.hasRole) void fetchSalerOptions();
  onlyMySitePoller = window.setInterval(syncOnlyMySite, 250);
  window.addEventListener('storage', syncOnlyMySite);
});

onUnmounted(() => {
  window.clearInterval(onlyMySitePoller);
  window.removeEventListener('storage', syncOnlyMySite);
});

watch(onlyMySite, value => {
  if (value) salerId.value = null;
});
</script>

<template>
  <section class="fault-filters" :style="panelStyle" :aria-label="searchLabel">
    <form class="fault-filters__form" @submit.prevent="emit('search')">
      <div class="fault-filters__main">
        <div class="fault-filters__fields">
          <NSelect
            v-if="props.siteOptions.length > 1"
            v-model:value="siteId"
            size="small"
            :options="props.siteOptions"
            :render-label="renderFilterOption"
            :placeholder="t('page.faults.site')"
            :aria-label="t('page.faults.site')"
            filterable
            clearable
          />
          <NInput
            v-model:value="serial"
            size="small"
            :placeholder="t('page.faults.searchCard.inputSn')"
            :input-props="{ 'aria-label': snLabel }"
            clearable
          >
            <template #prefix><SearchIcon aria-hidden="true" /></template>
          </NInput>
          <NInput
            v-model:value="workOrderNo"
            size="small"
            :placeholder="t('page.faults.searchCard.inputOrderNo')"
            :input-props="{ 'aria-label': orderLabel }"
            clearable
          />
          <NSelect
            v-model:value="status"
            size="small"
            :options="props.statusOptions"
            :render-label="renderFilterOption"
            :placeholder="t('page.faults.searchCard.flowStatus')"
            :aria-label="t('page.faults.searchCard.flowStatus')"
            clearable
          />
        </div>

        <div class="fault-filters__toolbar">
          <NCheckbox
            v-model:checked="hasAbnormalLogs"
            size="small"
            class="fault-filters__match"
            :class="{ 'is-active': hasAbnormalLogs }"
          >
            {{ t('page.faults.searchCard.hasAbnormalLogs') }}
          </NCheckbox>
          <div class="fault-filters__actions">
            <NButton
              size="small"
              quaternary
              :aria-expanded="expanded"
              :aria-controls="advancedFiltersId"
              @click="expanded = !expanded"
            >
              {{ expanded ? t('page.faults.searchCard.collapse') : t('page.faults.searchCard.expand') }}
              <template #icon>
                <CollapseChevron
                  class="fault-filters__chevron"
                  :class="{ 'is-open': expanded }"
                  aria-hidden="true"
                />
              </template>
            </NButton>
            <NButton type="primary" size="small" attr-type="submit">
              {{ searchLabel }}
              <template #icon>
                <SearchIcon aria-hidden="true" />
              </template>
            </NButton>
          </div>
        </div>
      </div>

      <div v-show="expanded" :id="advancedFiltersId" class="fault-filters__advanced">
        <NSelect
          v-model:value="resultStatus"
          size="small"
          :options="repairResultOptions"
          :render-label="renderFilterOption"
          :placeholder="t('page.faults.searchCard.repairStatus')"
          :aria-label="t('page.faults.searchCard.repairStatus')"
          clearable
        />
        <NSelect
          v-model:value="repairType"
          size="small"
          :options="props.repairTypeOptions"
          :render-label="renderFilterOption"
          :placeholder="t('page.faults.searchCard.type')"
          :aria-label="t('page.faults.searchCard.type')"
          clearable
        />
        <NDatePicker
          v-model:formatted-value="startDate"
          type="date"
          value-format="yyyy-MM-dd"
          size="small"
          :placeholder="t('page.faults.searchCard.startDate')"
          :aria-label="t('page.faults.searchCard.startDate')"
          clearable
        />
        <NDatePicker
          v-model:formatted-value="endDate"
          type="date"
          value-format="yyyy-MM-dd"
          size="small"
          :placeholder="t('page.faults.searchCard.endDate')"
          :aria-label="t('page.faults.searchCard.endDate')"
          clearable
        />
        <NSelect
          v-if="props.hasRole && !onlyMySite"
          v-model:value="salerId"
          size="small"
          class="fault-filters__saler"
          :options="salerOptions"
          :render-label="renderFilterOption"
          :placeholder="t('page.faults.searchCard.afterSalesSpecialist')"
          :aria-label="t('page.faults.searchCard.afterSalesSpecialist')"
          filterable
          clearable
        />
      </div>
    </form>
  </section>
</template>

<style scoped>
.fault-filters {
  container-type: inline-size;
  padding: 11px 14px;
  border: 1px solid var(--fault-filter-divider);
  border-radius: 10px;
  background: var(--fault-filter-surface);
}

.fault-filters__form,
.fault-filters__fields,
.fault-filters__advanced {
  display: grid;
  gap: 8px;
}

.fault-filters__main,
.fault-filters__toolbar,
.fault-filters__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fault-filters__main {
  flex-wrap: wrap;
}

.fault-filters__fields {
  flex: 1 1 490px;
  min-width: 0;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 116px), 1fr));
}

.fault-filters__advanced {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 136px), 1fr));
  padding-top: 9px;
  border-top: 1px solid var(--fault-filter-divider);
}

.fault-filters__fields > *,
.fault-filters__advanced > * {
  width: 100%;
  min-width: 0;
}

.fault-filters__toolbar {
  flex-wrap: wrap;
  justify-content: space-between;
}

.fault-filters__match {
  box-sizing: border-box;
  min-height: 28px;
  align-items: center;
  padding-inline: 9px;
  border: 1px solid var(--fault-filter-divider);
  border-radius: 6px;
  background: color-mix(in srgb, var(--fault-filter-accent) 4%, var(--fault-filter-surface));
  white-space: nowrap;
}

.fault-filters__match:hover {
  border-color: var(--fault-filter-border);
}

.fault-filters__match.is-active {
  border-color: color-mix(in srgb, var(--fault-filter-accent) 55%, var(--fault-filter-divider));
  background: color-mix(in srgb, var(--fault-filter-accent) 12%, var(--fault-filter-surface));
}

.fault-filters__match:focus-within {
  outline: 2px solid var(--fault-filter-accent);
  outline-offset: 2px;
}

.fault-filters__chevron {
  font-size: 12px;
}

.fault-filters__chevron.is-open {
  transform: rotate(180deg);
}

@container (width < 840px) {
  .fault-filters__toolbar {
    flex: 1 1 100%;
  }
}

@container (width < 520px) {
  .fault-filters__fields,
  .fault-filters__advanced {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fault-filters__saler {
    grid-column: 1 / -1;
  }
}

@container (width < 340px) {
  .fault-filters__actions {
    margin-inline-start: auto;
  }
}
</style>
