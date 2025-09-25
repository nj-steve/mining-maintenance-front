<script setup lang="ts">
import { onMounted, ref, watch, h, computed } from 'vue';
import dayjs from 'dayjs';
import { NDataTable, useMessage, NButton, useDialog, NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NCheckbox, NDatePicker } from 'naive-ui';
import type { DataTableColumns, PaginationProps, DataTableRowKey } from 'naive-ui';
import { fetchOrders, updateOrders, fetchOrdersDetail, dispatchOrders, fetchOrdersLogistics,fetchOrdersStatus } from '@/service/api/workflow';
import {fetchRepairStations} from '@/service/api/repair';
import {fetchSites} from '@/service/api/site';

interface Order {
  ID: number;                     // 工单ID
  OrderNo: string;                // 工单编号
  SiteID: number;                 // 场地ID
  StationID: number;              // 维修站ID
  Onsite: number;                 // 是否驻场（0/1）
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
}

const dialog = useDialog()
const message = useMessage();

const tableData = ref<Order[]>([]);
const loading = ref(false);
const searchSerial = ref<string>('');

// 批量选择相关
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const selectedOrders = computed(() => {
  return tableData.value.filter(order => checkedRowKeys.value.includes(order.ID));
});
const isBatchDispatchEnabled = computed(() => selectedOrders.value.length > 0);
const modelOptions = ref<{ label: string; value: number }[]>([])
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
  "payment_date": "string",
  "repair_cost": 0,
  "settlement_status": 1,
  "total_cost": 0
});

// 状态下拉选项
const statusOptions = ref<{ label: string; value: number }[]>([]);
const searchOrderStatus = ref<number>(0);

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
    payment_date:"",
    // payment_date: row.PaymentDate && row.PaymentDate!=="" ? dayjs(row.PaymentDate).format('YYYY-MM-DD') : "", 
    "repair_cost": row.RepairCost||0,
    "settlement_status": row.SettlementStatus||0,
    "total_cost": row.TotalCost
  };
  // editForm.value = JSON.parse(JSON.stringify(row)); // 深拷贝
  showEditModal.value = true;
};

// 派单表单数据
const dispatchForm = ref({
  faultCount: 1,
  onsite: null as null | number,
  repairStation: null as null | number,
  logisticsCompany: null as null | number,
  logisticsInfo: '',
  remark: ''
});

// 派单弹框显示状态
const showDispatchModal = ref(false);

// 选项数据
const siteStationOptions = ref([
  { label: '是', value: 1 },
  { label: '否', value: 0 }
]);

const repairStationOptions = ref([
  { label: '请选择就近维修站', value: 1 },
  { label: '维修站A', value: 2 },
  { label: '维修站B', value: 3 }
]);

const logisticsCompanyOptions = ref([
  { label: '请选择物流公司', value: 1 },
  { label: '顺丰速运', value: 2 },
  { label: '京东物流', value: 3 },
  { label: '德邦物流', value: 4 }
]);

// 当前操作的工单
const currentOrder = ref<Order | null>(null);

// 打开派单弹框
const handleOpenDispatch = (row: Order) => {
  currentOrder.value = row;
  // 重置表单
  dispatchForm.value = {
    faultCount: row.FaultCount,
    onsite: row.Onsite || null as null | number,
    repairStation: row.StationID || null as null | number,
    logisticsCompany: row.LogisticsCompanyId || null as null | number,
    logisticsInfo: '',
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
    faultCount: selectedOrders.value.reduce((sum, order) => sum + order.FaultCount, 0),
    onsite: null as null | number,
    repairStation: null as null | number,
    logisticsCompany: null as null | number,
    logisticsInfo: '',
    remark: `批量派单 - 共${selectedOrders.value.length}个工单`
  };
  
  showDispatchModal.value = true;
};

// 提交派单
const handleSubmitDispatch = async () => {
  if (!currentOrder.value) return;

  // 表单验证
  if (dispatchForm.value.onsite === null) {
    message.error('请选择是否驻场');
    return;
  }

  if (dispatchForm.value.repairStation === null) {
    message.error('请选择维修站');
    return;
  }

  if (dispatchForm.value.onsite === 0 && dispatchForm.value.logisticsCompany === null) {
    message.error('请选择物流公司');
    return;
  }

  try {
    // 构建提交数据
    const submitData: any = {
      // order_status: 2,
      order_ids: selectedOrders.value.map(order => order.ID),
      fault_count: dispatchForm.value.faultCount,
      onsite: dispatchForm.value.onsite,
      repair_station_id: dispatchForm.value.repairStation,
      remark: dispatchForm.value.remark
    };

    if (dispatchForm.value.onsite === 0) {
      submitData.logistics_company_id = dispatchForm.value.logisticsCompany;
      submitData.logistics_info = dispatchForm.value.logisticsInfo;
    }

    // 判断是批量派单还是单个派单
    const ordersToDispatch = selectedOrders.value.length > 0 ? selectedOrders.value : [currentOrder.value];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const order of ordersToDispatch) {
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
    }
    
    if (failCount === 0) {
      message.success(`派单成功！共处理${successCount}个工单`);
    } else if (successCount === 0) {
      message.error(`派单失败！共${failCount}个工单处理失败`);
    } else {
      message.warning(`部分成功：${successCount}个成功，${failCount}个失败`);
    }
    
    showDispatchModal.value = false;
    checkedRowKeys.value = []; // 清空选择
    fetchData(); // 刷新表格
  } catch (err) {
    message.error('派单失败');
  }
};

// 保存修改
const handleSaveEdit = async () => {
  try {
    // TODO: 调用后端接口 updateOrders(editForm.value)
    // console.log('修改提交:', editForm.value);
    const res = await updateOrders(editForm.value.id, editForm.value);
    if(res.response?.data?.msg=="success"){
        message.success('修改成功！');
        fetchData(); // 刷新表格
      }else{
        message.error('修改失败:' +res.response?.data?.msg);
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
  { title: '工单编号', key: 'OrderNo', width: 200 },
  { title: '维修商', key: 'StationName' },
  { title: '故障机数量', key: 'FaultCount'},
  { title: '是否驻场', key: 'Onsite',
    render: (row: any ) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
        1: 'success',
        0: 'error',
      };
      const label = row.Onsite === 1 ? '是' : row.Onsite === 0 ? '否' : '未知';
      return h(NTag, {type: tagMap[row.Onsite] }, () => label)
    }
  },
  { title: '总费用', key: 'RepairCost',
    render: (row: any ) => {
      if (row.RepairCost === null || row.RepairCost === undefined) {
        return '未知';
      }
      return row.RepairCost || '未知';
    }
   },
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
  { title: '付款日期', key: 'PaymentDate' },
  { title: '工单状态', key: 'OrderStatusText',
    render: (row: any) => {
      const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
      '已完成': 'success',
      '维修': 'primary',
      '未解决': 'error',
      '待处理':'warning',
      };
      const label = row.OrderStatusText || '未知';
      return h(NTag, {type: tagMap[row.OrderStatusText] }, () => label)
    }
   },
  { title: '短保期开始', key: 'warranty_status_text' },
  { title: '剩余短保期', key: 'warranty_status_text' },
  {
    title: '操作',
    key: 'actions',
    align:'center',
    render: (row: Order) => {
      return [
        h(
          NButton,
          {
            type: 'info',
            ghost: true,
            size: 'small',
            style: "margin-right: 8px;",
            onClick: () => handleOpenEdit(row)
          },
          { default: () => '修改' }
        ), 
        h(
          NButton,
          {
            type: 'info',
            ghost: true,
            size: 'small',
            style: "margin-left: 8px;",
            onClick: () => handleOpenDetail(row)
          },
          { default: () => '查看' }
        ),
         ...(row.StationID === 0 ? [h(
          NButton,
          {
            type: 'info',
            ghost: true,
            size: 'small',
            style: "margin-left: 8px;",
            onClick: () => handleOpenDispatch(row)
          },
          { default: () => '派单' }
        )] : []),
        // h(
        //   NButton,
        //   {
        //     type: 'error',
        //     ghost: true,
        //     onClick: () => {
        //       dialog.warning({
        //         title: '确认报废',
        //         content: `你确定要报废矿机「${row.serial_number}」吗？`,
        //         positiveText: '确定',
        //         negativeText: '取消',
        //         onPositiveClick: () => message.error("报废操作,暂未启用")
        //       })
        //     }
        //   },
        //   { default: () => '报废' }
        // )
      ]
    }
  }
];

// ---------------- 数据获取 ----------------
const fetchData = async () => {
  loading.value = true;
  const params: any = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    sn: searchSerial.value || undefined,
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
  searchOrderStatus.value = 0;
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
        label: site.Name,
        value: site.ID,
      }));
    }
    
    // 临时模拟数据
    // siteOptions.value = [];
    // siteOptions.value = [
    //   { label: '场地A', value: 1 },
    //   { label: '场地B', value: 2 },
    //   { label: '场地C', value: 3 }
    // ];
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
    // console.log("stationOptions",stationOptions.value)
    
    // 临时模拟数据
    // stationOptions.value = [
    //   { label: '维修站A', value: 1 },
    //   { label: '维修站B', value: 2 },
    //   { label: '维修站C', value: 3 }
    // ];
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


// ---------------- 查看详情弹框 ----------------
const showDetailModal = ref(false);
const detailData = ref({order_no:""}); // 工单操作日志
const operation_history = ref<any[]>([]); // 工单操作日志
const selectedRow = ref<Order | null>(null);

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
// async function loadFaultsTypes() {
//   loading.value = true
//   try {
//     const res = await fetchOrdersTypes({})
//     if (res && res.data.length>0) {
//       // 明确 item 类型
//       const arr = res.data as { id:number, name: string,hash_rate:string }[]

//       // names.value = [arr.map(item => item.name+" _ "+item.hash_rate+" T")]

//       modelOptions.value = arr.map(item => ({
//         label:  item.name+" _ "+item.hash_rate+" T",
//         value: item.id,
//       }))
      
//     } else {
//       // names.value = []
//       modelOptions.value = []
//     }
//   } catch (err) {
//     // console.error('获取场地数据失败:', err)
//     message.error('加载场地数据失败')
//   } finally {
//     loading.value = false
//   }
// }

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
  <div>
    <!-- 查询框和批量操作 -->
    <div class="mb-4" style="margin-bottom: 16px">
      <!-- 第一行：批量操作按钮 -->
      <div class="flex items-center gap-2" style="margin-bottom: 12px">
        <NButton 
          type="primary" 
          ghost
          size="small"
          :disabled="!isBatchDispatchEnabled"
          :class="{ 'batch-dispatch-disabled': !isBatchDispatchEnabled, 'batch-dispatch-enabled': isBatchDispatchEnabled }"
          @click="handleBatchDispatch"
        >
          批量派单 ({{ selectedOrders.length }})
        </NButton>
      </div>
      
      <!-- 第二行：筛选条件 -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- 场地筛选 -->
        <NSelect 
          v-model:value="searchSiteId" 
          :options="siteOptions" 
          placeholder="请选择场地" 
          clearable 
          style="width: 160px"
        />
        
        <!-- 维修站筛选 -->
        <NSelect 
          v-model:value="searchStationId" 
          :options="stationOptions" 
          placeholder="请选择维修站" 
          clearable 
          style="width: 160px"
        />
        
       <!-- 开始时间 -->
         <NDatePicker 
           v-model:value="searchStartDate" 
           type="date" 
           placeholder="开始时间" 
           clearable 
           style="width: 160px"
         />
         
         <!-- 结束时间 -->
         <NDatePicker 
           v-model:value="searchEndDate" 
           type="date" 
           placeholder="结束时间" 
           clearable 
           style="width: 160px"
         />
        
        <!-- 工单状态 -->
        <NSelect 
          v-model:value="searchOrderStatus" 
          :options="statusOptions" 
          placeholder="请选择工单状态" 
          clearable 
          style="width: 160px"
        />
        
        <!-- 机器编号 -->
        <NInput 
          v-model:value="searchSerial" 
          placeholder="请输入机器编号" 
          clearable 
          style="width: 200px"
        />
        
        <!-- 查询按钮 -->
        <NButton type="primary" @click="fetchData">查询</NButton>
        <NButton @click="handleReset">重置</NButton>
      </div>
    </div>

    <!-- 表格 -->
    <NDataTable 
      :columns="columns" 
      :data="tableData" 
      :pagination="pagination" 
      :loading="loading" 
      :row-key="(row: Order) => row.ID"
      v-model:checked-row-keys="checkedRowKeys"
      remote 
    />

    <!-- 修改弹框 -->
    <NModal v-model:show="showEditModal" style="width: 600px" preset="card" title="修改矿机信息">
      <NForm :model="editForm" label-width="100">
        <!-- 工单编号 -->
    <NFormItem label="工单编号">
      <NInput v-model:value="editForm.order_no" disabled />
    </NFormItem>

    <!-- 是否驻场 -->
    <NFormItem label="是否驻场">
      <NSelect
        v-model:value="editForm.onsite"
        :options="[
          { label: '否', value: 0 },
          { label: '是', value: 1 }
        ]"
      />
    </NFormItem>

    <!-- 维修费 + 物流费 -->
    <div style="display: flex; gap: 16px;">
      <NFormItem label="维修费">
        <NInputNumber v-model:value="editForm.repair_cost" type="number" />
      </NFormItem>
      <NFormItem label="物流费">
        <NInputNumber v-model:value="editForm.logistics_cost" type="number" />
      </NFormItem>
    </div>

    <!-- 总费用（自动计算） -->
    <NFormItem label="总费用">
      <NInputNumber :value="editForm.repair_cost + editForm.logistics_cost" disabled />
    </NFormItem>

    <NFormItem label="付款状态">
        <NSelect
          v-model:value="editForm.settlement_status"
          :options="[{ label: '未付款', value: 0 }, { label: '已付款', value: 1 }]"
        />
      </NFormItem>
      <NFormItem label="付款日期">
        <!-- 使用 value-format 输出字符串（这里用 YYYY-MM-DD，与表单初始化格式一致） -->
        <!-- <NDatePicker
          v-model:formatted-value="editForm.payment_date"
          type="date"
          value-format="yyyy-MM-dd"
          clearable
        />-->
      </NFormItem>

      <NFormItem label="工单状态">
        <NSelect
          v-model:value="editForm.order_status"
          :options="[{ label: '待处理', value: 0 }, { label: '已完成', value: 1 }]"
        />
      </NFormItem>
      </NForm> 
      <template #footer>
        <NButton type="primary" @click="handleSaveEdit">保存</NButton>
        <NButton @click="showEditModal = false">取消</NButton>
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
          <NInputNumber disabled v-model:value="dispatchForm.faultCount" :min="1" />
        </NFormItem>

        <!-- 是否驻场 -->
        <NFormItem label="是否驻场" required>
          <NSelect 
            v-model:value="dispatchForm.onsite"
            :options="siteStationOptions"
            placeholder="请选择"
          />
        </NFormItem>

        <!-- 选择维修站 -->
        <NFormItem label="选择维修站" required>
          <NSelect 
            v-model:value="dispatchForm.repairStation"
            :options="repairStationOptions"
            placeholder="请选择就近维修站"
          />
        </NFormItem>
        <template v-if="dispatchForm.onsite === 0">
          <!-- 物流公司 -->
          <NFormItem label="物流公司" :required="dispatchForm.onsite === 0">
            <NSelect 
              v-model:value="dispatchForm.logisticsCompany"
              :options="logisticsCompanyOptions"
              placeholder="请选择物流公司"
            />
          </NFormItem>
      
          <!-- 物流信息 -->
          <NFormItem label="物流信息">
            <NInput 
              v-model:value="dispatchForm.logisticsInfo"
              type="textarea"
              placeholder="请填写物流单号、预计送达时间等信息"
            />
          </NFormItem>
        </template>
      
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
        <NButton type="primary" @click="handleSubmitDispatch">确认派单</NButton>
        <NButton @click="showDispatchModal = false">取消</NButton>
      </template>
    </NModal>
    </div>
</template>

<style scoped>
.detail-container {
  padding: 10px;
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