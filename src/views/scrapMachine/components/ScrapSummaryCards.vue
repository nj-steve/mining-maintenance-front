<template>
  <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div class="flex items-center">
        <div class="rounded-lg bg-red-100 p-3 mr-4">
          <div class="text-red-600 text-xl">
            <i class="fas fa-trash-alt"></i>
          </div>
        </div>
        <div>
          <p class="text-gray-500 text-sm">总报废数</p>
          <p class="text-2xl font-bold text-gray-900">{{ summary.total_scrap_count }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div class="flex items-center">
        <div class="rounded-lg bg-yellow-100 p-3 mr-4">
          <div class="text-yellow-600 text-xl">
            <i class="fas fa-clock"></i>
          </div>
        </div>
        <div>
          <p class="text-gray-500 text-sm">待处理</p>
          <p class="text-2xl font-bold text-gray-900">{{ summary.pending_scrap_count }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div class="flex items-center">
        <div class="rounded-lg bg-blue-100 p-3 mr-4">
          <div class="text-blue-600 text-xl">
            <i class="fas fa-check-circle"></i>
          </div>
        </div>
        <div>
          <p class="text-gray-500 text-sm">已审批</p>
          <p class="text-2xl font-bold text-gray-900">{{ summary.approved_scrap_count }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div class="flex items-center">
        <div class="rounded-lg bg-green-100 p-3 mr-4">
          <div class="text-green-600 text-xl">
            <i class="fas fa-flag-checkered"></i>
          </div>
        </div>
        <div>
          <p class="text-gray-500 text-sm">待审核</p>
          <p class="text-2xl font-bold text-gray-900">{{ summary.pending_approval_count }}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div class="flex items-center">
        <div class="rounded-lg bg-purple-100 p-3 mr-4">
          <div class="text-purple-600 text-xl">
            <i class="fas fa-tools"></i>
          </div>
        </div>
        <div>
          <p class="text-gray-500 text-sm">已修复</p>
          <p class="text-2xl font-bold text-gray-900">{{ summary.repaired_count }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { fetchScrapSummary } from '@/service/api/repair'

interface ScrapSummaryResponse {
  approved_scrap_count: number
  pending_approval_count: number
  pending_scrap_count: number
  repaired_count: number
  total_scrap_count: number
}

const summary = ref<ScrapSummaryResponse>({
  approved_scrap_count: 0,
  pending_approval_count: 0,
  pending_scrap_count: 0,
  repaired_count: 0,
  total_scrap_count: 0
})

async function loadSummary() {
  const { data, error } = await fetchScrapSummary()
  console.log("scrap summary:", data)
  if (!error && data) {
    // 后端直接返回对象结构
    summary.value = data as ScrapSummaryResponse
  }
}

onMounted(() => {
  loadSummary()
})

// 暴露刷新方法，供父组件在列表数据更新后主动调用
defineExpose({ reload: loadSummary })
</script>

<style scoped></style>
