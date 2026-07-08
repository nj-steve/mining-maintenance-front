<script setup lang="ts">
import { useFullscreen } from '@vueuse/core';
import { GLOBAL_HEADER_MENU_ID } from '@/constants/app';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import GlobalLogo from '../global-logo/index.vue';
import GlobalBreadcrumb from '../global-breadcrumb/index.vue';
import GlobalSearch from '../global-search/index.vue';
import ThemeButton from './components/theme-button.vue';
import UserAvatar from './components/user-avatar.vue';
import { useAuthStore } from '@/store/modules/auth';
import { computed } from 'vue';
import { NSelect } from 'naive-ui';
import { localStg } from '@/utils/storage';

defineOptions({
  name: 'GlobalHeader'
});

interface Props {
  /** Whether to show the logo */
  showLogo?: App.Global.HeaderProps['showLogo'];
  /** Whether to show the menu toggler */
  showMenuToggler?: App.Global.HeaderProps['showMenuToggler'];
  /** Whether to show the menu */
  showMenu?: App.Global.HeaderProps['showMenu'];
}

defineProps<Props>();

const appStore = useAppStore();
const themeStore = useThemeStore();
const authStore = useAuthStore();
const { isFullscreen, toggle } = useFullscreen();

const groupOptions = computed(() => {
  return (authStore.userInfo.groups || []).map((g: any) => ({
    label: g.name,
    value: g.id
  }));
});

function handleGroupChange(val: string | number) {
  authStore.activeGroupId = val;
  localStg.set('activeGroupId', val);

  // 延迟 300ms 刷新，等待 NSelect 的下拉收起动画执行完毕，避免 parentNode 为 null 的报错
  setTimeout(() => {
    window.location.reload();
  }, 300);
}

function handleHelpDoc() {
  const roles = authStore.userInfo.roles || [];
  const origin = window.location.origin;
  if (roles.includes('3')) {
    window.open(`${origin}/docs/yunwei/index.html`, '_blank');
  } else if (roles.includes('4')) {
    window.open(`${origin}/docs/repair/index.html`, '_blank');
  } else {
    window.open(`${origin}/docs/index.html`, '_blank');
  }
}
</script>

<template>
  <DarkModeContainer class="h-full flex-y-center px-12px shadow-header">
    <GlobalLogo v-if="showLogo" class="h-full" :style="{ width: themeStore.sider.width + 'px' }" />
    <MenuToggler v-if="showMenuToggler" :collapsed="appStore.siderCollapse" @click="appStore.toggleSiderCollapse" />
    <div v-if="showMenu" :id="GLOBAL_HEADER_MENU_ID" class="h-full flex-y-center flex-1-hidden"></div>
    <div v-else class="h-full flex-y-center flex-1-hidden">
      <GlobalBreadcrumb v-if="!appStore.isMobile" class="ml-12px" />
    </div>
    <div class="h-full flex-y-center justify-end">
      <GlobalSearch v-if="themeStore.header.globalSearch.visible" />
      <FullScreen v-if="!appStore.isMobile" :full="isFullscreen" @click="toggle" />
      <LangSwitch
        v-if="themeStore.header.multilingual.visible"
        :lang="appStore.locale"
        :lang-options="appStore.localeOptions"
        @change-lang="appStore.changeLocale"
      />
      <ThemeSchemaSwitch
        :theme-schema="themeStore.themeScheme"
        :is-dark="themeStore.darkMode"
        @switch="themeStore.toggleThemeScheme"
      />
      <ThemeButton />
      <ButtonIcon
        icon="carbon:help"
        :tooltip-content="$t('common.helpDoc')"
        @click="handleHelpDoc"
      />
      <NSelect
        v-if="groupOptions.length > 1"
        :value="authStore.activeGroupId"
        :options="groupOptions"
        @update:value="handleGroupChange"
        size="small"
        class="w-120px mx-12px"
      />
      <UserAvatar />
    </div>
  </DarkModeContainer>
</template>

<style scoped></style>
