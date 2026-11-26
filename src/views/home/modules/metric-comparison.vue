<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: readonly { key: string; title: string; tone: string; count: number; value: string }[];
}>();

const maxCount = computed(() => Math.max(1, ...props.data.map(item => item.count)));
</script>

<template>
  <ul class="home-comparison">
    <li v-for="item in data" :key="item.key" class="home-comparison__row">
      <span class="home-comparison__label">{{ item.title }}</span>
      <span class="home-comparison__track" aria-hidden="true">
        <span :style="{ width: `${item.count / maxCount * 100}%`, backgroundColor: item.tone }" />
      </span>
      <strong>{{ item.value }}</strong>
    </li>
  </ul>
</template>

<style scoped>
.home-comparison {
  display: grid;
  align-content: center;
  gap: 10px;
  min-height: 290px;
  margin: 0;
  padding: 12px 14px;
  list-style: none;
}

.home-comparison__row {
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1.15fr) minmax(52px, 1fr) max-content;
  gap: 8px;
  min-height: 22px;
}

.home-comparison__label {
  color: var(--home-muted);
  font-size: 12px;
  line-height: 1.25;
}

.home-comparison__track {
  height: 6px;
  overflow: hidden;
  border-radius: 99px;
  background: color-mix(in srgb, var(--home-accent) 11%, var(--home-surface));
}

.home-comparison__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.home-comparison__row strong {
  min-width: 5ch;
  color: var(--home-ink);
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
}
</style>
