<script setup lang="ts">
import { onMounted, ref, watch, h } from 'vue';
import dayjs from "dayjs";
import { NDataTable, useMessage, NButton, useDialog, NTag, NModal, NForm, NFormItem, NInput, NSelect, NInputNumber } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchOrders, updateOrders, fetchOrdersDetail, dispatchOrders } from '@/service/api/workflow';


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
const statusOptions = [
  { label: '在架', value: 1 },
  { label: '维修', value: 2 },
  { label: '报废', value: 3 },
  { label: '下架', value: 4 }
];

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
      fault_count: dispatchForm.value.faultCount,
      onsite: dispatchForm.value.onsite,
      repair_station_id: dispatchForm.value.repairStation,
      remark: dispatchForm.value.remark
    };

    if (dispatchForm.value.onsite === 0) {
      submitData.logistics_company_id = dispatchForm.value.logisticsCompany;
      submitData.logistics_info = dispatchForm.value.logisticsInfo;
    }

    const res = await dispatchOrders(currentOrder.value.ID, submitData);
    if (res.response?.data?.code == String(0)) {
      message.success('派单成功！');
      showDispatchModal.value = false;
      fetchData(); // 刷新表格
    } else {
      message.error('派单失败:' + res.response?.data?.msg);
    }
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
  { title: '工单编号', key: 'OrderNo', width: 200 },
  { title: '维修商', key: 'StationID' },
  { title: '故障机数量', key: 'FaultCount'},
  { title: '是否驻场', key: 'Onsite'},
  { title: '总费用', key: 'RepairCost' },
  { title: '付款状态', key: 'SettlementStatus', 
  // render: (row: Miner) => row.Status?.name ,
  render: (row: any ) => {
    if (row.Status?.name === null || row.Status?.name === undefined) {
      return null;
    }
    const tagMap: Record<string, "primary" | "info" | "success" | "warning" | "error" | "default"> = {
      '在架': 'success',
      '维修': 'warning',
      '报废': 'error',
      '下架':'info',
    };

    const label = row.Status?.name || '未知';
    // return <NTag type={tagMap[row.Status]}>{label}</NTag>;
    return h(NTag, {type: tagMap[row.Status?.name] }, () => label)
  }
  },
  { title: '付款日期', key: 'PaymentDate' },
  { title: '工单状态', key: 'OrderStatus' },
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
            style: "margin-left: 8px;",
            onClick: () => handleOpenDetail(row)
          },
          { default: () => '查看' }
        ),
         h(
          NButton,
          {
            type: 'info',
            ghost: true,
            style: "margin-left: 8px;",
            onClick: () => handleOpenDispatch(row)
          },
          { default: () => '派单' }
        ),
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
    sn: searchSerial.value || undefined
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
//   loadFaultsTypes();
});
watch([searchSerial], () => {
  tableData.value = [];
  pagination.value.page = 1;
  fetchData();
  
});
</script>

<template>
  <div>
    <!-- 查询框 -->
    <div class="mb-4 flex items-center gap-2" style="display: flex; justify-content: flex-end; margin-bottom: 16px">
      <NInput v-model:value="searchSerial" @change="fetchData" placeholder="请输入机器编号" clearable style="width: 240px" />
    </div>

    <!-- 表格 -->
    <NDataTable :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" remote />

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
       <NInputNumber v-model:value="dispatchForm.faultCount" :min="1" />
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
</style>