<script setup lang="ts">
import { computed } from 'vue';
import { NSkeleton } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import CountIcon from '~icons/ant-design/appstore-outlined';

defineProps<{
  total: number | undefined;
  totalLabel: string;
  statusLabel: string;
  statuses: { label: string; count: number; tone: string }[];
  loading: boolean;
}>();

const { locale } = useI18n();
const numberFormat = computed(() => new Intl.NumberFormat(locale.value));
</script>

<template>
  <div class="management-summary" :aria-busy="loading">
    <section class="management-summary__total">
      <h2><span aria-hidden="true"><CountIcon /></span>{{ totalLabel }}</h2>
      <NSkeleton v-if="loading" width="72px" height="28px" class="management-summary__placeholder" />
      <strong v-else>{{ total === undefined ? '—' : numberFormat.format(total) }}</strong>
    </section>

    <section class="management-summary__statuses">
      <h2>{{ statusLabel }}</h2>
      <dl class="management-summary__list">
        <div v-for="status in statuses" :key="status.label" :style="{ '--status-tone': status.tone }">
          <dt><span aria-hidden="true" />{{ status.label }}</dt>
          <dd>
            <NSkeleton v-if="loading" width="22px" height="19px" />
            <template v-else>{{ total === undefined ? '—' : numberFormat.format(status.count) }}</template>
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
