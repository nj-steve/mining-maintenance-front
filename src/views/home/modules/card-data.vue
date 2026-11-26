<script setup lang="ts">
import type { Component } from 'vue';
import { NSkeleton } from 'naive-ui';
import { useI18n } from 'vue-i18n';

defineProps<{
  data: {
    key: string;
    title: string;
    value: string;
    rate: string;
    icon: Component;
    tone: string;
    featured?: boolean;
  }[];
  loading: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <section class="home-metrics" :aria-busy="loading">
    <article
      v-for="metric in data"
      :key="metric.key"
      class="home-metric"
      :class="{ 'home-metric--featured': metric.featured }"
      :style="{ '--metric-tone': metric.tone }"
    >
      <h2 class="home-metric__label">
        <span class="home-metric__icon" aria-hidden="true"><component :is="metric.icon" /></span>
        {{ metric.title }}
      </h2>
      <NSkeleton v-if="loading" class="home-metric__placeholder" width="76px" height="26px" />
      <div v-else class="home-metric__reading">
        <strong>{{ metric.value }}</strong>
        <span
          v-if="metric.rate"
          class="home-metric__rate"
          :title="t('page.home.shareOfAssets', { rate: metric.rate })"
          :aria-label="t('page.home.shareOfAssets', { rate: metric.rate })"
        >
          {{ metric.rate }}
        </span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.home-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 12px;
  min-width: 0;
}

.home-metric {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--home-line);
  border-radius: 10px;
  background: var(--home-surface);
}

.home-metric--featured {
  border-color: color-mix(in srgb, var(--metric-tone) 22%, var(--home-line));
  background: color-mix(in srgb, var(--metric-tone) 4%, var(--home-surface));
}

.home-metric__label {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--home-muted);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.25;
}

.home-metric__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--metric-tone) 13%, var(--home-surface));
  color: color-mix(in srgb, var(--metric-tone) 78%, var(--home-ink));
  font-size: 15px;
}

.home-metric__reading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 9px;
  margin-top: 6px;
}

.home-metric__reading strong {
  color: var(--home-ink);
  font-size: clamp(21px, 2.25vw, 32px);
  font-variant-numeric: tabular-nums;
  font-weight: 720;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.home-metric__rate {
  padding: 2px 6px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--metric-tone) 9%, var(--home-surface));
  color: var(--home-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.home-metric__placeholder {
  margin-block: 7px 4px;
}

@media (max-width: 900px) {
  .home-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}
</style>
