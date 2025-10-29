<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { NDataTable, useMessage, NButton, NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NDatePicker, NTooltip } from 'naive-ui';
import type { DataTableColumns, PaginationProps, DataTableRowKey } from 'naive-ui';
import { fetchOrders, updateOrders, fetchOrdersDetail, dispatchOrders,fetchOrdersStatus } from '@/service/api/workflow';
import {fetchSites,gobackOrders,fetchRepairStations} from '@/service/api';
// import SvgIcon from '@/components/custom/svg-icon.vue';
import { repairMethodRecord,repairMethodOptions } from '@/constants/business';
import SearchFilters from './components/SearchFilters.vue';
import ActionButtons from './components/ActionButtons.vue'
import AddLogModal from './components/AddLogModal.vue'
import { useAuthStore } from '@/store/modules/auth';

const router = useRouter();
interface Order {
  ID: number;                     // 工单ID
  OrderNo: string;                // 工单编号
  SiteID: number;                 // 场地ID
  StationID: number;              // 维修站ID
  Onsite: number;                 // 是否驻场（0/1）
  StationName: string | null;     // 维修站名称
  OrderStatus: number;            // 工单状态
  FaultCount: number;             // 故障机数量
  InWarrantyCount: number;        // 短保期内数量
  OutOfWarrantyCount: number;     // 短保期外数量
  RepairCost: number;             // 维修费用
  LogisticsCost: number;          // 物流费用
  TotalCost: number;              // 总费用
  SettlementStatus: number;       // 付款状态
  SettlementStatusText: string | null; // 付款状态文本
  PaymentDate: string | null;     // 付款日期
  LogisticsCompanyId: number | null; // 物流公司ID
  CreatedBy: string | null;       // 创建人
  CreatedAt: string;              // 创建时间
  UpdatedAt: string;              // 更新时间
  RepairMethod: number;           // 维修方式
}

const message = useMessage();
const authStore = useAuthStore();
const routeRoles=["1","2"]
const hasRole = authStore.userInfo.roles.some(role => routeRoles.includes(role));
console.log("hasRole---",hasRole);
// const isRepair = computed(() => authStore.userInfo.roles.some('1','2'));// 判断用户是不是维修用户
const tableData = ref<Order[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');

// 批量选择相关
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const selectedOrders = computed(() => {
  return tableData.value.filter(order => checkedRowKeys.value.includes(order.ID));
});
const isBatchDispatchEnabled = computed(() => selectedOrders.value.length > 0);
// 分页
const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
  },
  onChange: page => {
    pagination.value.page = page;
    fetchData();
  },
  onUpdatePageSize: pageSize => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    fetchData();
  }
});

// ---------------- 修改弹框 ----------------
const showEditModal = ref(false);
const editForm = ref({
  id:0,
  order_no:"",
  "logistics_cost": 0,
  "onsite": 0,
  "order_status": 1,
  "payment_date": null as string | null,
  "repair_cost": 0,
  "settlement_status": 1,
  "total_cost": 0,
  "repair_station_id": null as number | null,
});

// 状态下拉选项
const statusOptions = ref<{ label: string; value: number }[]>([]);
const searchOrderStatus = ref<number | undefined>(undefined);

// 新增筛选项
const searchSiteId = ref<number | null>(null);  // 场地筛选
const searchStationId = ref<number | null>(null);  // 维修站筛选
const searchStartDate = ref<number | null>(null);  // 开始时间
const searchEndDate = ref<number | null>(null);  // 结束时间

// 场地和维修站选项
const siteOptions = ref<{ label: string; value: number }[]>([]);
const stationOptions = ref<{ label: string; value: number }[]>([]);

// 打开修改弹框
const handleOpenEdit = (row: Order) => {
  editForm.value = {
    id:row.ID,
    order_no:row.OrderNo,
    "logistics_cost": row.LogisticsCost||0,
    "onsite": row.Onsite||0,
    "order_status": row.OrderStatus||0,
    "payment_date": row.PaymentDate && row.PaymentDate!==""? dayjs(row.PaymentDate).format("YYYY-MM-DD"):null,
    // payment_date: row.PaymentDate && row.PaymentDate!=="" ? dayjs(row.PaymentDate).valueOf().toString() : null, 
    "repair_cost": row.RepairCost||0,
    "settlement_status": row.SettlementStatus||0,
    "total_cost": row.TotalCost||0,
    "repair_station_id": row.StationID || null as number | null,
  };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 派单表单数据
const dispatchForm = ref({
  fault_count: 1,
  repair_method: null as null | number,
  repair_station_id: null as null | number,
  // logisticsCompany: null as null | number,
  // logisticsInfo: '',
  order_ids: [] as number[],
  remark: ''
});

// 派单弹框显示状态
const showDispatchModal = ref(false);

// 当前操作的工单
const currentOrder = ref<Order | null>(null);

// 打开派单弹框
const handleOpenDispatch = (row: Order) => {
  currentOrder.value = row;
  // 重置表单
  dispatchForm.value = {
    fault_count: row.FaultCount,
    repair_method: row.RepairMethod || null as null | number,
    repair_station_id: row.StationID || null as null | number,
    order_ids: [row.ID],
    // logisticsCompany: row.LogisticsCompanyId || null as null | number,
    // logisticsInfo: '',
    remark: ''
  };
  showDispatchModal.value = true;
};

// 批量派单处理
const handleBatchDispatch = () => {
  if (selectedOrders.value.length === 0) {
    message.warning('请先选择要派单的工单');
    return;
  }
  
  // 检查是否存在已派单的工单（StationID != 0）
  const alreadyDispatchedOrders = selectedOrders.value.filter(order => order.StationID !== 0);
  if (alreadyDispatchedOrders.length > 0) {
    message.warning('请选择未派单的工单');
    return;
  }
  
  // 使用第一个选中的工单作为模板
  currentOrder.value = selectedOrders.value[0];
  
  // 重置表单
  dispatchForm.value = {
    fault_count: selectedOrders.value.reduce((sum, order) => sum + order.FaultCount, 0),
    repair_method: null as null | number,
    repair_station_id: null as null | number,
    order_ids: selectedOrders.value.map(order => order.ID),
    remark: `批量派单 - 共${selectedOrders.value.length}个工单`
  };
  
  showDispatchModal.value = true;
};

// 提交派单
const handleSubmitDispatch = async () => {
  if (!currentOrder.value) return;

  if (dispatchForm.value.repair_method === null) {
    message.error('请选择维修方式');
    return;
  }

  if (dispatchForm.value.repair_station_id === null) {
    message.error('请选择维修站');
    return;
  }
  try {
    // 构建提交数据
    const submitData: any = {
      // order_status: 2,
      order_ids: selectedOrders.value.length > 0 ? selectedOrders.value.map(order => order.ID) : [currentOrder.value.ID],
      fault_count: dispatchForm.value.fault_count,
      repair_method: dispatchForm.value.repair_method,
      repair_station_id: dispatchForm.value.repair_station_id,
      remark: dispatchForm.value.remark
    };

    // 判断是批量派单还是单个派单
    const ordersToDispatch = selectedOrders.value.length > 0 ? selectedOrders.value : [currentOrder.value];
    
    let successCount = 0;
    let failCount = 0;
    
    // for (const order of ordersToDispatch) {
      try {
        const res = await dispatchOrders(submitData);
        
        if (res.response?.data?.code == String(0)) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    // }
    if (failCount === 0) {
      message.success(`派单成功！共处理${successCount}个工单`);
    } else if (successCount === 0) {
      message.error(`派单失败！共${failCount}个工单处理失败`);
    } else {
      message.warning(`部分成功：${successCount}个成功，${failCount}个失败`);
    }
    fetchData(); // 刷新表格
    showDispatchModal.value = false;
    checkedRowKeys.value = []; // 清空选择
    
    
  } catch (err) {
    message.error('派单失败');
  }
};

const handleGoback=async(row: Order)=>{
  // 确认退回（Naive UI 对话框）
  const confirm = await new Promise<boolean>((resolve) => {
    (window as any).$dialog?.warning({
      title: '确认退回工单？',
      content: `是否确认退回工单 ${row.OrderNo}？`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false)
    });
  });
  if (!confirm) return;
  
  try {
    const res = await gobackOrders(row.ID, {
      order_status: 1,
      remark: '用户退回工单'
    });
    
    if (res.response?.data?.code == String(0)) {
      message.success('退回成功！');
      await fetchData(); // 刷新表格
    } else {
      message.error('退回失败:' + (res.response?.data?.msg || ''));
    }
  } catch (err) {
    message.error('退回失败');
  }
};

// 保存修改
const handleSaveEdit = async () => {
  try {
    // TODO: 调用后端接口 updateOrders(editForm.value)
    // console.log('修改提交:', editForm.value);
    const { error } = await updateOrders(editForm.value.id, editForm.value);
    if(error==null){
        message.success('修改成功！');
        fetchData(); // 刷新表格
      }else{
        message.error('修改失败:' +error);
      }
  } catch (err) {
    message.error('修改失败');
  }finally{
    showEditModal.value = false;
  }
};

// ---------------- 表格列 ----------------
const columns: DataTableColumns<Order> = [
  {
    type: 'selection',
    width: 50
  },
  { 
    title: '工单编号', 
    key: 'OrderNo', 
    width: 220,
    render: (row: Order) => {
      const text = row.OrderNo || '';
      return h(
        NTooltip,
        null,
        {
          trigger: () => h(
            'div', 
            { 
              style: 'max-width:220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer;',
              onClick: () => router.push({ name: 'workflowdetail', params: { id: row.ID } })
            }, 
            text
          ),
          default: () => text
        }
      );
    }
  },
  { 
    title: '维修商', 
    key: 'StationName', 
    width: 150,
    render: (row: any) => {
      const text = row.StationName || '';
      return h(
        NTooltip,
        null,
        {
          trigger: () => h('div', { style: 'max-width:150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' }, text),
          default: () => text
        }
      );
    }
  },
  { title: '场地', key: 'SiteName' },
  { title: '故障机数量', key: 'FaultCount'},
  { title: '维修方式', key: 'RepairMethod',
    render: (row: any ) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        1: 'success',
        2: 'primary',
        3: 'primary',
      };
      // const label = row.Onsite === 1 ? '是' : row.Onsite === 0 ? '否' : '未知';
      return h(NTag, {type: tagMap[row.RepairMethod] }, () => repairMethodRecord[row.RepairMethod] || '未知')
    }
  },
  // { title: '总费用', key: 'RepairCost',
  //   render: (row: any ) => {
  //     if (row.RepairCost === null || row.RepairCost === undefined) {
  //       return '未知';
  //     }
  //     return row.RepairCost || '未知';
  //   }
  //  },
  ...(hasRole ? [
    { title: '付款状态', key: 'SettlementStatus', 
      render: (row: any ) => {
        if (row.SettlementStatusText === null || row.SettlementStatusText === undefined) {
          return null;
        }
        //待处理，处理中，已完成，未解决
        const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
          '已付款': 'success',
          '未付款': 'warning',
          '未申请': 'default',
        };

        const label = row.SettlementStatusText || '未知';
        // return <NTag type={tagMap[row.Status]}>{label}</NTag>;
        return h(NTag, {type: tagMap[row.SettlementStatusText] }, () => label)
      }
    },
    { title: '付款日期', key: 'PaymentDate',
      render: (row: Order) => {
        if (!row.PaymentDate) {
          return '-';
        }
        return dayjs(row.PaymentDate).format('YYYY-MM-DD');
      }
    },
  ] : []),
  { title: '工单状态', key: 'OrderStatusText',
      render: (row: any) => {
        const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        '已完成': 'success',
        '维修': 'primary',
        '未解决': 'error',
        '待处理':'warning',
        '处理中':'primary',
        };
        const label = row.OrderStatusText || '未知';
        return h(NTag, {type: tagMap[row.OrderStatusText] }, () => label)
      }
     },
  // { title: '短保期开始', key: 'warranty_status_text' },
  // { title: '剩余短保期', key: 'warranty_status_text' },
  { title: '操作',
    key: 'actions',
    render: (row: Order) => {
      return h(ActionButtons, {
        row,
        hasRole,
        onEdit: () => handleOpenEdit(row),
        onAddLog: () => handleOpenAddLog(row),
        onDetail: () => handleOpenDetail(row),
        onDispatch: () => handleOpenDispatch(row),
        onReturn: () => handleGoback(row)
      })
    }
  }
];

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  // console.log("authStore.userInfo.roles---",authStore.userInfo.roles,authStore.userInfo.roles[0]);
  loading.value = true;
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    order_no: searchSerial.value || undefined,
    order_status: searchOrderStatus.value || undefined,
    site_id: searchSiteId.value || undefined,
    station_id: searchStationId.value || undefined,
    start_date: searchStartDate.value ? dayjs(searchStartDate.value).format('YYYY-MM-DD') : undefined,
    end_date: searchEndDate.value ? dayjs(searchEndDate.value).format('YYYY-MM-DD') : undefined
  };

  try {
    const {data,error} = await fetchOrders(params);
    if(error==null){
        tableData.value = data.list;
        pagination.value.itemCount = data.pagination.total;
        pagination.value.page =  data.pagination.page;
        pagination.value.pageSize =  data.pagination.page_size;
    }else{
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  } finally {
    loading.value = false;
  }
};

// 重置筛选条件
const handleReset = () => {
  searchSerial.value = '';
  searchOrderStatus.value = undefined;
  searchSiteId.value = null;
  searchStationId.value = null;
  searchStartDate.value = null;
  searchEndDate.value = null;
  pagination.value.page = 1;
  fetchData();
};

// 获取场地数据
const fetchSiteData = async () => {
  try {
    // 这里需要根据实际的API接口来获取场地数据
    const { data, error } = await fetchSites({page:1,page_size:1000});
    if (!error && data) {
      siteOptions.value = data.list.map((site: any) => ({
        label: site.name,
        value: site.id,
      }));
    }
  } catch (err) {
    message.error('获取场地数据失败');
  }
};

// 获取维修站数据
const fetchStationData = async () => {
  try {
    // 这里需要根据实际的API接口来获取维修站数据
    const { data, error } = await fetchRepairStations({page:1,page_size:1000});
    if (!error && data) {
      // console.log("data",data.list)
      stationOptions.value = data.list.map((station: any) => ({
        label: station.Name,
        value: station.ID
      }));
    }
  } catch (err) {
    message.error('获取维修站数据失败');
  }
};

// ---------------- 数据获取 ----------------
const fetchOrderStatusData = async () => {
  loading.value = true;
  const params: any = {
   type:2,//订单状态
  };

  try {
    const {data,error} = await fetchOrdersStatus(params);
    
    if(error==null){
       statusOptions.value = data.map((item: any) => ({
        label: item.name,
        value: item.id,
      }));
    }else{
        message.error(`加载失败: ${error}`);
    }
  } catch (err) {
    message.error(`加载失败${err}`);
  } finally {
    loading.value = false;
  }
};

function goDetail(id: number | string) {
  // console.log("跳转到详情页，ID:", id);
  if (!id) {
    console.error("ID 为空，无法跳转");
    return;
  }
  try {
    router.push({ name: 'workflowdetail', params: { id: String(id) } });
  } catch (error) {
    console.error("路由跳转失败:", error);
  }
}

// ---------------- 查看详情弹框 ----------------// 详情弹框相关
const showDetailModal = ref(false);
const detailData = ref({order_no:""}); // 工单操作日志
const operation_history = ref<any[]>([]); // 工单操作日志
const selectedRow = ref<Order | null>(null);

// 添加操作日志弹框相关
const showAddLogModal = ref(false);
const handleOpenAddLog = (row: Order) => {
  selectedRow.value = row;
  showAddLogModal.value = true;
};
const handleLogSubmitted = async () => {
  showAddLogModal.value = false;
  if (selectedRow.value) {
    await fetchDetailData(selectedRow.value.ID);
  }
  await fetchData();
};
// 打开详情弹框
const handleOpenDetail = async (row: Order) => {
  selectedRow.value = row;
  showDetailModal.value = true;
  await fetchDetailData(row.ID);
};

// 获取工单详情（操作日志）
const fetchDetailData = async (orderId: number) => {
  try {
    const { data, error } = await fetchOrdersDetail(orderId);
    console.log("data",data)
    if (!error && data) {
      // 假设返回 data.logs 是数组 [{ time: string, action: string, operator: string }]
      detailData.value = data;
      operation_history.value = data.operation_history.sort((a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    } else {
      message.error("获取工单日志失败");
      detailData.value ={order_no:""}
      operation_history.value = [];
    }
  } catch (err) {
    message.error("获取工单日志异常");
    detailData.value ={order_no:""}
    operation_history.value = [];
  }
};

onMounted(() => {
  fetchData()
  fetchOrderStatusData()
  fetchSiteData()
  fetchStationData()

//   loadFaultsTypes();
});
watch([searchSerial, searchOrderStatus, searchSiteId, searchStationId, searchStartDate, searchEndDate], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
});
</script>

<template>
  <div class="flex gap-16px flex-col-stretch overflow-hidden lt-sm:overflow-auto">
 <!-- 第二行：筛选条件 -->
   
    <SearchFilters
        v-model:serial="searchSerial"
        v-model:siteId="searchSiteId"
        v-model:stationId="searchStationId"
        v-model:startDate="searchStartDate"
        v-model:endDate="searchEndDate"
        v-model:orderStatus="searchOrderStatus"
        :siteOptions="siteOptions"
        :stationOptions="stationOptions"
        :statusOptions="statusOptions"
        @search="fetchData"
        @reset="handleReset"
      />
    
    <div class="min-h-550px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto"> 
   <!-- <NCard size="medium"  :bordered="false"  class="card-wrapper sm:flex-1-hidden" style="margin-top: 12px;">  -->
    <!-- 查询框和批量操作 -->

    <div class="mb-4" style="margin-bottom: 16px; display: flex; justify-content: flex-end;">
      <!-- 第一行：批量操作按钮 -->
      <div class="flex items-center gap-2" v-if="hasRole">
        <NButton 
          type="primary" 
          ghost
          size="medium"
          :disabled="!isBatchDispatchEnabled"
          :class="{ 'batch-dispatch-disabled': !isBatchDispatchEnabled, 'batch-dispatch-enabled': isBatchDispatchEnabled }"
          @click="handleBatchDispatch"
        >
          批量派单 ({{ selectedOrders.length }})
        </NButton>
      </div>
    </div>
 
    <!-- 表格 -->
    <NDataTable 
      flex-height
      :columns="columns" 
      :data="tableData" 
      :pagination="pagination" 
      :loading="loading" 
      :fixed="['actions']"
      :row-key="(row: Order) => row.ID"
      v-model:checked-row-keys="checkedRowKeys"
      remote 
      :scroll-x="1800"
      striped
      class="sm:h-full"
    />
       <!-- </NCard>   -->
    </div>

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" title="修改矿机信息">
      <NForm :model="editForm" label-width="100">
        <!-- 工单编号 -->
    <NFormItem label="工单编号">
      <NInput size="medium" v-model:value="editForm.order_no" disabled />
    </NFormItem>

      <!-- 选择维修站 -->
        <NFormItem label="选择维修站" required>
          <NSelect 
            v-model:value="editForm.repair_station_id"
            :options="stationOptions"
            placeholder="请选择就近维修站"
          />
        </NFormItem>

    <NFormItem label="付款状态">
        <NSelect size="medium"
          v-model:value="editForm.settlement_status"
          :options="[{ label: '未付款', value: 1 }, { label: '已付款', value: 2 }]"
        />
      </NFormItem>

      <NFormItem label="工单状态">
        <NSelect size="medium"
          v-model:value="editForm.order_status"
          :options="statusOptions"
        />
      </NFormItem>
      </NForm> 
      <template #footer>
        <n-space item-style="display: flex;">
        <NButton size="medium" type="primary" @click="handleSaveEdit" style="margin-right: 8px;">保存</NButton>
        <NButton size="medium" @click="showEditModal = false">取消</NButton>
        </n-space>
      </template>
    </NModal>

    <!-- 查看详情弹框 -->
    <NModal v-model:show="showDetailModal" style="width: 600px" preset="card" title="工单操作日志">
      <div v-if="operation_history.length > 0" class="detail-container">
        <h2>工单编号：{{ detailData?.order_no }}</h2>
        <div class="timeline">
        <div v-for="(log, index) in operation_history" :key="log.occurred_at" class="timeline-item">
          <div class="timeline-line" :class="{ 'is-first': index === 0, 'is-last': index === operation_history.length - 1 }">
            <div class="timeline-dot"></div>
          </div>
          <div class="timeline-content-wrapper">
            <div class="timeline-header">
              <div class="timeline-title">{{ log.status_text }}</div>
              <div class="timeline-time">{{ log.occurred_at }}</div>
            </div>
            <div class="timeline-body">
              <div class="timeline-description">{{ log.info }}</div>
              <div class="timeline-operator">操作人：{{ log.operator_name }}</div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <NButton @click="showDetailModal = false">关闭</NButton>
      </template>
    </NModal>
    
    <!-- 派单弹框 -->
    <NModal v-model:show="showDispatchModal" style="width: 600px" preset="card" title="派单">
      <NForm :model="dispatchForm" label-width="120">
        <!-- 选择故障机数量 -->
        <NFormItem label="选择故障机数量">
          <NInputNumber disabled v-model:value="dispatchForm.fault_count" :min="1" />
        </NFormItem>

        <!-- 是否驻场 -->
        <!-- <NFormItem label="是否驻场" required>
          <NSelect 
            v-model:value="dispatchForm.onsite"
            :options="siteStationOptions"
            placeholder="请选择"
          />
        </NFormItem> -->
        <NFormItem label="维修方式" required>
          <NSelect 
            v-model:value="dispatchForm.repair_method"
            :options="repairMethodOptions"
            placeholder="请选择维修方式"
          />
        </NFormItem>
        
        <!-- 选择维修站 -->
        <NFormItem label="选择维修站" required>
          <NSelect 
            v-model:value="dispatchForm.repair_station_id"
            :options="stationOptions"
            placeholder="请选择就近维修站"
          />
        </NFormItem>
          <!-- 备注 -->
          <NFormItem label="备注">
            <NInput 
              v-model:value="dispatchForm.remark"
              type="textarea"
              placeholder="请填写其他需要说明的信息"
            />
          </NFormItem>
      </NForm>

      <template #footer>
        <NButton type="primary" style="margin-right: 8px;" @click="handleSubmitDispatch">确认派单</NButton>
        <NButton @click="showDispatchModal = false">取消</NButton>
      </template>
    </NModal>

    <!-- 添加操作日志弹框 -->
    <AddLogModal
      v-model:show="showAddLogModal"
      :order-id="selectedRow?.ID || 0"
      :default-order-status="selectedRow?.OrderStatus ?? null"
      :status-options="statusOptions"
      @submitted="handleLogSubmitted"
    />
    </div>
</template>

<style scoped>
.detail-container {
  padding: 10px;
}

:deep(.n-base-selection .n-base-selection-placeholder){
  font-size: 12px !important;
}
:deep(.n-base-selection-overlay){
  font-size: 12px !important;
}
:deep(.n-input-wrapper){
  font-size: 12px !important;
}
:deep(.n-button){
  font-size: 12px !important;
}

.detail-container h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline-item {
  position: relative;
  display: flex;
  padding-bottom: 20px;
}

.timeline-line {
  position: absolute;
  left: 4px;
  top: 0;
  width: 2px;
  background-color: #e5e5e5;
}

.timeline-line.is-first {
  top: 10px;
}

.timeline-line.is-last {
  height: 10px;
}

.timeline-line:not(.is-first):not(.is-last) {
  height: 100%;
}

.timeline-dot {
  position: absolute;
  left: -4px;
  top: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #1890ff;
  border: 2px solid #fff;
}

.timeline-item:first-child .timeline-dot {
  background-color: #52c41a;
}

.timeline-content-wrapper {
  flex: 1;
  padding-left: 20px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-title {
  font-size: 16px;
  font-weight: bold;
}

.timeline-time {
  font-size: 12px;
  color: #999;
}

.timeline-body {
  background-color: #f7f7f7;
  padding: 10px;
  border-radius: 4px;
}

.timeline-description {
  margin-bottom: 8px;
}

.timeline-operator {
  font-size: 12px;
  color: #666;
}

/* 批量派单按钮样式 */
.batch-dispatch-disabled {
  background-color: #d9d9d9 !important;
  border-color: #d9d9d9 !important;
  color: #999 !important;
  cursor: not-allowed !important;
}

.batch-dispatch-enabled {
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  color: #fff !important;
  cursor: pointer !important;
  transition: all 0.3s ease;
}

.batch-dispatch-enabled:hover {
  background-color: #40a9ff !important;
  border-color: #40a9ff !important;
}
</style>