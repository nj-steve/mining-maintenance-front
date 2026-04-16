<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({
  name: 'GlobalLogo'
});

const authStore = useAuthStore();
const redirectPath = computed(() => {
  if (authStore.userInfo.roles.includes("1") || authStore.userInfo.roles.includes("2")) {
    return '/';
  }
  return authStore.userInfo.roles.includes('3') ? '/faults' : '/workflow';
});

interface Props {
  /** Whether to show the title */
  showTitle?: boolean;
}

withDefaults(defineProps<Props>(), {
  showTitle: true
});
</script>

<template>


  <RouterLink :to="redirectPath" class="w-full flex-center nowrap-hidden">
    <SystemLogo class="text-32px text-primary" />
    <h2 v-show="showTitle" class="pl-8px text-16px text-primary font-bold transition duration-300 ease-in-out">
      {{ $t('system.title') }}
    </h2>
  </RouterLink>
</template>

<style scoped></style>
