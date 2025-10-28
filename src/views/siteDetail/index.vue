<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useMessage, NButton, NCard, NSpin, NIcon } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import { fetchSitesDetail } from '@/service/api/site';
// 使用项目内置的图标系统

interface SiteDetail {
  id: number;
  name: string;
  address?: string;
  asset_count: number;
  off_shelf_count: number;
  in_logistics_count: number;
  under_repair_count: number;
  to_be_put_on_shelf_count: number;
  site_status: number;
  saler_name: string;
  saler_id: number;
  director_name: string;
  wait_repair_count: number;
  phone: string;
  email: string;
  repairing: number;
  repairing_rate: number;
  wait_repair: number;
  wait_repair_rate: number;
  scrapped_count: number;
  fault_count: number;
  fault_rate: number;
  is_onsite_default?: number;
  wait_on_shelf_count: number;
}


const route = useRoute();
const router = useRouter();
const message = useMessage();

const siteId = computed(() => Number(route.params.id));
const siteData = ref<SiteDetail | null>(null);
const loading = ref(false);

// 返回上一页
const goBack = () => {
  router.back();
};

// 获取场地详情数据
const fetchData = async () => {
  if (!siteId.value) {
    message.error('场地ID无效');
    return;
  }
  
  loading.value = true;
  try {
    const { data, error } = await fetchSitesDetail(siteId.value);
    if (error == null) {
      siteData.value = data;
    } else {
      message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败: ${err}`);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="site-detail-container">
    <!-- 返回按钮 -->
    <div class="header-section">
      <NButton quaternary @click="goBack" class="back-button">
        <template #icon>
          <NIcon>
            <SvgIcon icon="material-symbols:arrow-back" />
          </NIcon>
        </template>
        返回
      </NButton>
    </div>

    <!-- 加载状态 -->
    <NSpin :show="loading" class="loading-container">
      <div v-if="siteData" class="content">
        <!-- 基础信息 -->
        <NCard title="基础信息" class="info-card">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">场地名称:</span>
              <span class="value">{{ siteData.name || '' }}</span>
            </div>
            <div class="info-item">
              <span class="label">场地地址:</span>
              <span class="value">{{ siteData.address || '' }}</span>
            </div>
            <div class="info-item">
              <span class="label">场地状态:</span>
              <span class="value" :class="siteData.site_status === 1 ? 'status-yes' : 'status-no'">
                {{ siteData.site_status === 1 ? '驻场' : siteData.site_status === 2 ? '寄修' : '驻场+寄修' }}
              </span>
            </div>
          </div>
        </NCard>

        <!-- 资产统计 -->
        <NCard title="资产统计" class="stats-card">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">总资产数:</span>
              <span class="stat-value">{{ siteData.asset_count || 0 }} 台</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">24H故障数:</span>
              <span class="stat-value">{{ siteData.fault_count || 0 }} 台</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">物流中:</span>
              <span class="stat-value">{{ siteData.in_logistics_count || 0 }} 台</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">在修数:</span>
              <span class="stat-value">{{ siteData.repairing || 0 }} 台</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">待修数:</span>
              <span class="stat-value">{{ siteData.wait_repair_count || 0 }} 台</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">待上架:</span>
              <span class="stat-value">{{ siteData.wait_on_shelf_count || 0 }} 台</span>
            </div>
            <div class="stat-item">
               <span class="stat-label">报废数:</span>
               <span class="stat-value">{{ siteData.scrapped_count || 0 }} 台</span>
             </div>
          </div>
        </NCard>

        <!-- 联系信息 -->
        <NCard title="售后专员" class="contact-card">
          <div class="contact-grid">
            <div class="contact-item">
              <span class="label">负责人:</span>
              <span class="value">{{ siteData.saler_name || '' }}</span>
            </div>
            <div class="contact-item">
              <span class="label">联系电话:</span>
              <span class="value">{{ siteData.phone || '' }}</span>
            </div>
            <div class="contact-item">
              <span class="label">邮箱:</span>
              <span class="value">{{ siteData.email || '' }}</span>
            </div>
          </div>
        </NCard>
      </div>
    </NSpin>
  </div>
</template>

<style scoped>
.site-detail-container {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header-section {
  margin-bottom: 24px;
}

.back-button {
  color: #666;
  font-size: 14px;
}

.loading-container {
  min-height: 400px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.stats-card,
.contact-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-grid,
.contact-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.info-item,
.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child,
.contact-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
  margin-right: 16px;
}

.value {
  color: #333;
  flex: 1;
}

.status-active {
  color: #52c41a;
  font-weight: 500;
}

.status-yes {
  color: #52c41a;
  font-weight: 500;
}

.status-no {
  color: #ff4d4f;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  padding: 8px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .site-detail-container {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }
  
  .stat-item {
    padding: 16px;
  }
  
  .stat-value {
    font-size: 18px;
  }
}
</style>