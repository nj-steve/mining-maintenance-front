<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
// import { loginModuleRecord } from '@/constants/app';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'PwdLogin'
});

const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  userName: string;
  password: string;
}

const model: FormModel = reactive({
  userName: '',
  password: ''
});

// 记住密码开关
const rememberMe = ref(false);
// 已记住的账号列表（仅保存用户名）
const rememberedList = ref<string[]>([]);
// 自动完成选项
const accountOptions = computed(() => rememberedList.value.map(u => ({ label: u, value: u })));

// 初始化读取已记住的账号列表（兼容老的单条记录和对象列表），规范化为字符串数组
try {
  const listStr = localStorage.getItem('rememberLoginList');
  const singleStr = localStorage.getItem('rememberLogin');
  let normalized: string[] = [];
  if (listStr) {
    const arr = JSON.parse(listStr);
    if (Array.isArray(arr)) {
      if (arr.length && typeof arr[0] === 'string') {
        normalized = arr as string[];
      } else {
        normalized = arr.map((i: any) => i?.userName).filter((u: any) => typeof u === 'string');
      }
    }
  } else if (singleStr) {
    const obj = JSON.parse(singleStr);
    if (obj?.userName && typeof obj.userName === 'string') normalized = [obj.userName];
  }
  if (normalized.length) {
    rememberedList.value = Array.from(new Set(normalized));
    localStorage.setItem('rememberLoginList', JSON.stringify(rememberedList.value));
  }
  // 清理旧的带密码存储键
  if (singleStr) localStorage.removeItem('rememberLogin');
} catch {}

function upsertRemembered(userName: string) {
  if (!userName) return;
  if (!rememberedList.value.includes(userName)) {
    rememberedList.value.unshift(userName);
  }
  localStorage.setItem('rememberLoginList', JSON.stringify(rememberedList.value));
}

function clearRemembered() {
  rememberedList.value = [];
  localStorage.removeItem('rememberLoginList');
  localStorage.removeItem('rememberLogin');
}

// 勾选“记住我”时，仅在登录成功后保存；取消勾选不做清除历史
watch(rememberMe, () => {
  // no-op: 持久化在登录成功后执行
});

// 当账号或密码变化时不再自动写入本地存储，避免未成功登录也被保存
watch(model, () => {
  // no-op
}, { deep: true });

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // inside computed to make locale reactive, if not apply i18n, you can define it without computed
  const { formRules } = useFormRules();

  return {
    userName: formRules.userName,
    password: formRules.pwd
  };
});

async function handleSubmit() {
  await validate();
  await authStore.login(model.userName, model.password);
  // 若勾选“记住我”，只保存用户名到列表
  if (rememberMe.value) {
    upsertRemembered(model.userName);
  }
}

function onSelectAccount(value: string) {
  model.userName = value || '';
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" autocomplete="on" method="post" action="/api/login" @keyup.enter="handleSubmit" @submit.prevent="handleSubmit">
    <NFormItem path="userName">
      <!-- 使用原生 input + datalist 提供历史用户名选择，更利于密码管理器识别 -->
      <input
        v-model="model.userName"
        id="username"
        name="username"
        type="text"
        autocomplete="username"
        list="remembered-users"
        :placeholder="$t('page.login.common.userNamePlaceholder')"
        style="width: 100%; height: 40px; padding: 0 12px; border: 1px solid var(--n-border-color, #dcdfe6); border-radius: 6px;"
      />
      <datalist id="remembered-users">
        <option v-for="u in rememberedList" :key="u" :value="u" />
      </datalist>
    </NFormItem>
    <NFormItem path="password">
      <input
        v-model="model.password"
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
        style="width: 100%; height: 40px; padding: 0 12px; border: 1px solid var(--n-border-color, #dcdfe6); border-radius: 6px;"
      />
    </NFormItem>
    <NSpace vertical :size="24">
      <div class="flex-y-center justify-between">
        <NCheckbox v-model:checked="rememberMe">{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        <!-- <NButton text @click="clearRemembered">清除历史账号</NButton> -->
        <!--<NButton quaternary @click="toggleLoginModule('reset-pwd')">
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </NButton>-->
      </div>
      <NButton type="primary" size="large" round block :loading="authStore.loginLoading" attr-type="submit">
        {{ $t('common.confirm') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
