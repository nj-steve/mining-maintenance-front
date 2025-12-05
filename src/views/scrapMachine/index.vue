<!-- 代码已包含 CSS：使用 TailwindCSS , 安装 TailwindCSS 后方可看到布局样式效果 -->

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-[1440px] mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">报废机管理</h1>
        <p class="text-gray-600">查看和管理所有报废设备信息</p>
      </div>
      
      <!-- Stats Cards -->
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
              <p class="text-2xl font-bold text-gray-900">142</p>
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
              <p class="text-2xl font-bold text-gray-900">24</p>
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
              <p class="text-2xl font-bold text-gray-900">87</p>
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
              <p class="text-2xl font-bold text-gray-900">31</p>
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
              <p class="text-2xl font-bold text-gray-900">18</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Filters and Actions -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="relative">
              <div class="relative w-64">
                <input
                  placeholder="搜索 SN 编号..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  v-model="searchText"
                />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-search text-gray-400"></i>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <div class="relative">
                <button 
                  class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md flex items-center"
                  @click="toggleSiteDropdown"
                >
                  <i class="fas fa-filter mr-2"></i>
                  {{ selectedSite }}
                </button>
                <div 
                  v-if="showSiteDropdown" 
                  class="absolute z-10 mt-1 w-48 bg-white shadow-lg rounded-md py-1"
                >
                  <div 
                    class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    @click="selectSite('全部场地')"
                  >
                    全部场地
                  </div>
                  <div 
                    v-for="site in uniqueSites" 
                    :key="site"
                    class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    @click="selectSite(site)"
                  >
                    {{ site }}
                  </div>
                </div>
              </div>
              <div class="relative">
                <button 
                  class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md flex items-center"
                  @click="toggleStatusDropdown"
                >
                  <i class="fas fa-filter mr-2"></i>
                  {{ selectedStatus }}
                </button>
                <div 
                  v-if="showStatusDropdown" 
                  class="absolute z-10 mt-1 w-48 bg-white shadow-lg rounded-md py-1"
                >
                  <div 
                    class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    @click="selectStatus('全部状态')"
                  >
                    全部状态
                  </div>
                  <div 
                    v-for="status in uniqueStatuses" 
                    :key="status"
                    class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    @click="selectStatus(status)"
                  >
                    {{ status }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="!rounded-button whitespace-nowrap px-4 py-2 text-sm border border-gray-300 rounded-md flex items-center">
              <i class="fas fa-download mr-2"></i>
              导出数据
            </button>
            <button class="!rounded-button whitespace-nowrap px-4 py-2 text-sm bg-blue-600 text-white rounded-md flex items-center">
              <i class="fas fa-plus mr-2"></i>
              新增报废
            </button>
          </div>
        </div>
      </div>
      
      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  报废编号
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  场地
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  机型
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  整机 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  控制板 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  板 1 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  板 2 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  板 3 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  电源 SN
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  报废日期
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  报废次数
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-white">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in paginatedData" :key="item.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                  {{ item.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.site }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.model }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.serialNumber }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.controlBoardSN }}</span>
                    <i 
                      :class="[
                        item.controlBoardAvailable ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board1SN }}</span>
                    <i 
                      :class="[
                        item.board1Available ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board2SN }}</span>
                    <i 
                      :class="[
                        item.board2Available ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.board3SN }}</span>
                    <i 
                      :class="[
                        item.board3Available ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <span class="mr-2">{{ item.powerSupplySN }}</span>
                    <i 
                      :class="[
                        item.powerSupplyAvailable ? 'fas fa-check-circle text-green-500' : 'fas fa-times-circle text-red-500'
                      ]"
                    ></i>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span 
                    :class="[
                      'px-2 py-1 rounded-full text-xs',
                      item.status === '待处理' ? 'text-yellow-600 bg-yellow-100' : 
                      item.status === '已审批' ? 'text-blue-600 bg-blue-100' : 
                      'text-green-600 bg-green-100'
                    ]"
                  >
                    {{ item.status === '已完成' ? '待审核' : item.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ item.scrapDate }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span class="font-medium text-gray-900">{{ item.scrapCount }} 次</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm sticky right-0 bg-white">
                  <div class="flex space-x-2">
                    <button
                      :class="[
                        'px-3 py-1 text-sm rounded whitespace-nowrap',
                        item.status === '待审核' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'
                      ]"
                      :disabled="item.status === '待审核'"
                    >
                      {{ item.status === '待审核' ? (item.scrapCount > 1 ? '已修复' : '已确认') : '确认报废' }}
                    </button>
                    <button class="text-blue-600 hover:text-blue-900 text-sm px-2 py-1">
                      查看详情
                    </button>
                    <button class="text-red-600 hover:text-red-900 text-sm px-2 py-1">
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button 
              @click="prevPage"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              上一页
            </button>
            <button 
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                显示第 <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> 至 <span class="font-medium">{{ Math.min(currentPage * pageSize, filteredData.length) }}</span> 条记录，共 <span class="font-medium">{{ filteredData.length }}</span> 条记录
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">上一页</span>
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                    page === currentPage 
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">下一页</span>
                  <i class="fas fa-chevron-right"></i>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';

interface ScrapMachine {
  id: string;
  site: string;
  model: string;
  serialNumber: string;
  controlBoardSN: string;
  board1SN: string;
  board2SN: string;
  board3SN: string;
  powerSupplySN: string;
  status: string;
  scrapDate: string;
  scrapCount: number;
  controlBoardAvailable: boolean;
  board1Available: boolean;
  board2Available: boolean;
  board3Available: boolean;
  powerSupplyAvailable: boolean;
}

// Data refs
const data = ref<ScrapMachine[]>([]);
const searchText = ref('');
const selectedSite = ref('全部场地');
const selectedModel = ref('全部机型');
const selectedStatus = ref('全部状态');
const showSiteDropdown = ref(false);
const showStatusDropdown = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

// Toggle dropdowns
const toggleSiteDropdown = () => {
  showSiteDropdown.value = !showSiteDropdown.value;
  showStatusDropdown.value = false;
};

const toggleStatusDropdown = () => {
  showStatusDropdown.value = !showStatusDropdown.value;
  showSiteDropdown.value = false;
};

// Select filters
const selectSite = (site: string) => {
  selectedSite.value = site;
  showSiteDropdown.value = false;
  currentPage.value = 1;
};

const selectStatus = (status: string) => {
  selectedStatus.value = status;
  showStatusDropdown.value = false;
  currentPage.value = 1;
};

// Close dropdowns when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.relative')) {
    showSiteDropdown.value = false;
    showStatusDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  
  // Generate mock data
  const sites = ['上海工厂', '深圳生产基地', '北京研发中心', '广州装配线', '成都维修中心'];
  const models = ['XJ-2000', 'YK-3500', 'ZL-5000', 'WM-1500', 'NP-800'];
  const statuses = ['待处理', '已审批', '待审核'];
  
  const generateMockData = (): ScrapMachine[] => {
    return Array.from({ length: 50 }, (_, index) => ({
      id: `SCRAP-${String(index + 1).padStart(4, '0')}`,
      site: sites[Math.floor(Math.random() * sites.length)],
      model: models[Math.floor(Math.random() * models.length)],
      serialNumber: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      controlBoardSN: `CB-${Math.floor(100000 + Math.random() * 900000)}`,
      board1SN: `B1-${Math.floor(100000 + Math.random() * 900000)}`,
      board2SN: `B2-${Math.floor(100000 + Math.random() * 900000)}`,
      board3SN: `B3-${Math.floor(100000 + Math.random() * 900000)}`,
      powerSupplySN: `PS-${Math.floor(100000 + Math.random() * 900000)}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      scrapDate: `${2023}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      scrapCount: Math.floor(Math.random() * 5) + 1,
      controlBoardAvailable: Math.random() > 0.3,
      board1Available: Math.random() > 0.3,
      board2Available: Math.random() > 0.3,
      board3Available: Math.random() > 0.3,
      powerSupplyAvailable: Math.random() > 0.3,
    }));
  };
  
  data.value = generateMockData();
});

// Computed properties
const filteredData = computed(() => {
  let result = [...data.value];
  
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    result = result.filter(item =>
      item.serialNumber.toLowerCase().includes(searchLower) ||
      item.controlBoardSN.toLowerCase().includes(searchLower) ||
      item.board1SN.toLowerCase().includes(searchLower) ||
      item.board2SN.toLowerCase().includes(searchLower) ||
      item.board3SN.toLowerCase().includes(searchLower) ||
      item.powerSupplySN.toLowerCase().includes(searchLower)
    );
  }
  
  if (selectedSite.value !== '全部场地') {
    result = result.filter(item => item.site === selectedSite.value);
  }
  
  if (selectedModel.value !== '全部机型') {
    result = result.filter(item => item.model === selectedModel.value);
  }
  
  if (selectedStatus.value !== '全部状态') {
    result = result.filter(item => item.status === selectedStatus.value);
  }
  
  return result;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize.value);
});

const uniqueSites = computed(() => {
  return Array.from(new Set(data.value.map(item => item.site)));
});

const uniqueModels = computed(() => {
  return Array.from(new Set(data.value.map(item => item.model)));
});

const uniqueStatuses = computed(() => {
  return Array.from(new Set(data.value.map(item => item.status)));
});

// Pagination controls
const visiblePages = computed(() => {
  const pages: number[] = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      pages.push(total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(current - 2, current - 1, current, current + 1, current + 2);
    }
  }
  
  return pages;
});

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page: number) => {
  currentPage.value = page;
};

// Watch for filter changes to reset to first page
watch([searchText, selectedSite, selectedModel, selectedStatus], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
/* Custom styles if needed */
</style>

