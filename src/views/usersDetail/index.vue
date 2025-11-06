<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useMessage, NButton, NForm, NFormItem, NInput, NCollapse, NCollapseItem, NDescriptions, NDescriptionsItem } from 'naive-ui';
import { REG_EMAIL } from '@/constants/reg';
import { useAuthStore } from '@/store/modules/auth';
import { fetchUserDetail, updateUser } from '@/service/api/auth';

const authStore = useAuthStore();
const message = useMessage();

// 折叠面板状态
const profileOpen = ref<string | null>('profile');
const editingProfile = ref(false);

// 个人信息与表单
const personalInfo = ref<{ id?: number; username: string; real_name: string; contact_phone: string; email: string; company_info: { name: string }[]; start_date: string }>({
  id: undefined,
  username: '',
  real_name: '',
  contact_phone: '',
  email: '',
  company_info: [],
  start_date: ''
});

const profileForm = ref<{ phone: string; email: string; password: string }>({
  phone: '',
  email: '',
  password: ''
});

// 加载当前登录用户的个人信息
async function loadPersonalInfo() {
  try {
    const id = authStore.userInfo?.user_id || 0;
    const { data, error } = await fetchUserDetail(Number(id));
    console.log("data, error>>",data, error);
    if (!error && data) {
      const u = data;
      console.log("u>>",u,u.username,u.contact_phone);
      personalInfo.value = {
        id: u.id,
        username: u.username || '',
        real_name: u.real_name || '',
        contact_phone: u.contact_phone || '',
        email: u.email || '',
        company_info: u.company_info || [],
        start_date: u.start_date || ''
      };
    } else if (!error && data?.company_info?.[0]?.name) {
      const infoStr = localStorage.getItem('userInfo');
      if (infoStr) {
        const u = JSON.parse(infoStr);
        personalInfo.value = {
          id: (u?.id ?? (authStore.userInfo?.user_id ? Number(authStore.userInfo.user_id) : undefined)),
          username: u?.username || authStore.userInfo?.user_name || '',
          real_name: u?.real_name || '',
          contact_phone: u?.contact_phone || '',
          email: u?.email || '',
          company_info: u?.company_info || [],
          start_date: u?.start_date || ''
        };
      }
    }
    // 初始化编辑表单
    profileForm.value.phone = personalInfo.value.contact_phone || '';
    profileForm.value.email = personalInfo.value.email || '';
    profileForm.value.password = '';
  } catch (err) {
    message.error(`加载个人信息失败: ${err}`);
  }
}

function handleProfileEdit() {
  editingProfile.value = true;
}

function handleProfileCancel() {
  // 还原为当前个人信息
  profileForm.value.phone = personalInfo.value.contact_phone || '';
  profileForm.value.email = personalInfo.value.email || '';
  profileForm.value.password = '';
  editingProfile.value = false;
}

async function handleProfileSubmit() {
  try {
    if (!profileForm.value.email) {
      message.error('请输入邮箱');
      return;
    }
    if (!REG_EMAIL.test(profileForm.value.email.trim())) {
      message.error('邮箱格式不正确');
      return;
    }
    const id = personalInfo.value.id;
    if (!id) {
      message.error('未找到用户ID，无法提交修改');
      return;
    }
    const payload: any = {
      contact_phone: profileForm.value.phone,
      email: profileForm.value.email
    };
    if (profileForm.value.password) {
      payload.password = profileForm.value.password;
    }
    const res = await updateUser(id, payload);
    if (res.response?.data?.msg === 'Operation successful') {
      message.success('修改成功！');
      // 同步更新个人信息
      personalInfo.value.contact_phone = profileForm.value.phone;
      personalInfo.value.email = profileForm.value.email;
      // 清空密码并退出编辑态
      profileForm.value.password = '';
      editingProfile.value = false;
    } else {
      message.error('修改失败: ' + (res.response?.data?.msg || '未知错误'));
    }
  } catch (err) {
    message.error('修改失败: ' + err);
  }
}

onMounted(() => {
  loadPersonalInfo();
});
</script>

<template>
  <div>
    <NCollapse v-model:value="profileOpen" accordion style="margin-bottom: 12px;">
      <NCollapseItem name="profile">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span>个人信息</span>
            <NButton text type="primary" size="small" @click.stop="handleProfileEdit" v-if="!editingProfile">编辑</NButton>
          </div>
        </template>
        <div v-if="!editingProfile">
          <NDescriptions :column="2">
            <NDescriptionsItem label="昵称">{{ personalInfo.username }}</NDescriptionsItem>
            <NDescriptionsItem label="真实姓名">{{ personalInfo.real_name }}</NDescriptionsItem>
            <NDescriptionsItem label="联系电话">{{ personalInfo.contact_phone || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="邮箱">{{ personalInfo.email || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="所属公司">{{ personalInfo.company_info?.[0]?.name || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="入职时间">{{ personalInfo.start_date || '-' }}</NDescriptionsItem>
          </NDescriptions>
        </div>
        <div v-else>
          <NForm :model="profileForm" label-width="100">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
              <NFormItem label="联系电话">
                <NInput v-model:value="profileForm.phone" placeholder="请输入联系电话" />
              </NFormItem>
              <NFormItem label="邮箱">
                <NInput v-model:value="profileForm.email" placeholder="请输入邮箱" />
              </NFormItem>
              <NFormItem label="密码">
                <NInput v-model:value="profileForm.password" type="password" placeholder="不修改可留空" />
              </NFormItem>
            </div>
          </NForm>
          <div style="margin-top: 8px; display: flex; gap: 8px;">
            <NButton size="small" type="primary" @click="handleProfileSubmit">提交修改</NButton>
            <NButton size="small" @click="handleProfileCancel">取消</NButton>
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>