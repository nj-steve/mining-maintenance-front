<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, useMessage } from 'naive-ui';
import { createRepairStation } from '@/service/api/repair';

interface Props {
  show: boolean;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();

// 表单数据
const addForm = ref({
  address: '',
  contact_name: '',
  contact_phone: '',
  kyc_status: 0,
  legal_representative: '',
  name: '',
  score: ''
});

// KYC状态选项
const kycStatusOptions = [
  { label: '未认证', value: 0 },
  { label: '已认证', value: 1 }
];

// 重置表单
const resetForm = () => {
  addForm.value = {
    address: '',
    contact_name: '',
    contact_phone: '',
    kyc_status: 0,
    legal_representative: '',
    name: '',
    score: ''
  };
};

// 关闭弹框
const handleClose = () => {
  emit('update:show', false);
  resetForm();
};

// 保存添加
const handleSaveAdd = async () => {
  try {
    // 转换score为数字类型
    const formData = {
      ...addForm.value,
      score: Number(addForm.value.score) || 0
    };
    const {error} = await createRepairStation(formData);
    if(error==null){
        message.success('添加成功！');
        emit('success'); // 通知父组件刷新数据
      }
      // else{
      //   message.error('添加失败:');
      // }
  } catch (err) {
    message.error('添加失败');
  }finally{
    handleClose();
  }
};
</script>

<template>
  <NModal :show="show" @update:show="handleClose" style="width: 600px" preset="card" title="添加维修站">
    <NForm :model="addForm" label-width="120px">
      <NFormItem label="维修站名称" required>
        <NInput v-model:value="addForm.name" placeholder="请输入维修站名称" />
      </NFormItem>
      <NFormItem label="详细地址" required>
        <NInput v-model:value="addForm.address" placeholder="请输入详细地址" />
      </NFormItem>
      <NFormItem label="法人代表" required>
        <NInput v-model:value="addForm.legal_representative" placeholder="请输入法人代表" />
      </NFormItem>
      <NFormItem label="联系人" required>
        <NInput v-model:value="addForm.contact_name" placeholder="请输入联系人" />
      </NFormItem>
      <NFormItem label="联系电话" required>
        <NInput v-model:value="addForm.contact_phone" placeholder="请输入联系电话" />
      </NFormItem>
      <NFormItem label="KYC状态">
        <NSelect v-model:value="addForm.kyc_status" :options="kycStatusOptions" />
      </NFormItem>
      <NFormItem label="评分">
        <NInput v-model:value="addForm.score" placeholder="请输入评分" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NButton type="primary" @click="handleSaveAdd">提交</NButton>
      <NButton @click="handleClose">取消</NButton>
    </template>
  </NModal>
</template>