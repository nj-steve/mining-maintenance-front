<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, useMessage } from 'naive-ui';
import { updateRepairStation } from '@/service/api/repair';

interface CompanyInfo {
  ID: number;
  Name: string;
  Address: string;
  LegalRepresentative: string;
  KYCStatus: number;
  ContactName: string;
  ContactPhone: string;
  Score: number;
  CreatedAt: string;
  UpdatedAt: string;
}

interface Props {
  show: boolean;
  editData: CompanyInfo | null;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const message = useMessage();

// 表单数据
const editForm = ref({
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

// 监听编辑数据变化，填充表单
watch(() => props.editData, (newData) => {
  if (newData) {
    editForm.value = {
      address: newData.Address || '',
      contact_name: newData.ContactName || '',
      contact_phone: newData.ContactPhone || '',
      kyc_status: newData.KYCStatus || 0,
      legal_representative: newData.LegalRepresentative || '',
      name: newData.Name || '',
      score: String(newData.Score || 0)
    };
  }
}, { immediate: true });

// 重置表单
const resetForm = () => {
  editForm.value = {
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

// 保存修改
const handleSaveEdit = async () => {
  if (!props.editData) {
    message.error('编辑数据不存在');
    return;
  }
  // 验证表单
  if (!editForm.value.name || !editForm.value.address || !editForm.value.legal_representative || !editForm.value.contact_name || !editForm.value.contact_phone) {
    message.warning('请填写完整信息');
    return;
  }
  try {
    // 转换score为数字类型
    const formData = {
      ...editForm.value,
      score: Number(editForm.value.score) || 0
    };
    const {error} = await updateRepairStation(props.editData.ID, formData);
    if(error===null){
        message.success('修改成功！');
        handleClose();
        emit('success'); // 通知父组件刷新数据
      }else{
        message.error('修改失败:');
      }
  } catch (err) {
    message.error('修改失败');
  }finally{
    
  }
};
</script>

<template>
  <NModal :show="show" @update:show="handleClose" style="width: 600px" preset="card" title="修改维修站">
    <NForm :model="editForm" label-width="120px">
      <NFormItem label="维修站名称" required>
        <NInput v-model:value="editForm.name" placeholder="请输入维修站名称" />
      </NFormItem>
      <NFormItem label="详细地址" required>
        <NInput v-model:value="editForm.address" placeholder="请输入详细地址" />
      </NFormItem>
      <NFormItem label="法人代表" required>
        <NInput v-model:value="editForm.legal_representative" placeholder="请输入法人代表" />
      </NFormItem>
      <NFormItem label="联系人" required>
        <NInput v-model:value="editForm.contact_name" placeholder="请输入联系人" />
      </NFormItem>
      <NFormItem label="联系电话" required>
        <NInput v-model:value="editForm.contact_phone" placeholder="请输入联系电话" />
      </NFormItem>
      <NFormItem label="白名单认证">
        <NSelect v-model:value="editForm.kyc_status" :options="kycStatusOptions" />
      </NFormItem>
      <NFormItem label="评分">
        <NInput v-model:value="editForm.score" placeholder="请输入评分" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NButton type="primary" @click="handleSaveEdit" style="margin-right: 10px;" >保存</NButton>
      <NButton @click="handleClose">取消</NButton>
    </template>
  </NModal>
</template>