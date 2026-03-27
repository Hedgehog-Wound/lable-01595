<template>
  <div class="monitor-list page-container">
    <!-- 搜索筛选 -->
    <div class="card filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="监测点名称">
          <el-input v-model="filterForm.name" placeholder="请输入名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="item in monitorTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 操作栏 -->
    <div class="card table-card">
      <div class="card-header">
        <span class="title">监测点列表</span>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增监测点</el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="filteredMonitors"
        stripe
        :height="600"
        @row-click="handleRowClick"
      >
        <el-table-column prop="code" label="编号" width="100" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            {{ getTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column prop="currentValue" label="当前值" width="120">
          <template #default="{ row }">
            <span :class="getValueClass(row)">
              {{ row.currentValue }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="handleView(row)">详情</el-button>
            <el-button type="primary" link size="small" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑监测点' : '新增监测点'"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="70px"
        class="monitor-form"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入监测点名称" />
        </el-form-item>
        <el-form-item label="编号" prop="code">
          <el-input v-model="form.code" placeholder="请输入编号" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="item in monitorTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入位置" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="单位" disabled />
        </el-form-item>
        <el-form-item label="最小阈值" prop="minThreshold">
          <el-input-number v-model="form.minThreshold" :precision="2" :controls="true" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大阈值" prop="maxThreshold">
          <el-input-number v-model="form.maxThreshold" :precision="2" :controls="true" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Refresh, Plus } from '@element-plus/icons-vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useMonitorStore } from '@/stores/monitor'
import { monitorTypeOptions, statusOptions, type MonitorPoint, type MonitorForm, type MonitorType } from '@/types/monitor'

const router = useRouter()
const monitorStore = useMonitorStore()

const loading = computed(() => monitorStore.loading)
const monitors = computed(() => monitorStore.monitors)

const filterForm = reactive({
  name: '',
  type: '',
  status: ''
})

const filteredMonitors = computed(() => {
  return monitors.value.filter(m => {
    if (filterForm.name && !m.name.includes(filterForm.name)) return false
    if (filterForm.type && m.type !== filterForm.type) return false
    if (filterForm.status && m.status !== filterForm.status) return false
    return true
  })
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref('')

const form = reactive<MonitorForm>({
  name: '',
  code: '',
  type: 'temperature',
  location: '',
  description: '',
  unit: '°C',
  minThreshold: 0,
  maxThreshold: 100
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编号', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }]
}

// 监听类型变化，自动更新单位
watch(() => form.type, (newType) => {
  const typeOption = monitorTypeOptions.find(opt => opt.value === newType)
  if (typeOption) {
    form.unit = typeOption.unit
  }
})

function getTypeLabel(type: MonitorType) {
  return monitorTypeOptions.find(o => o.value === type)?.label || type
}

function getValueClass(row: MonitorPoint) {
  if (row.currentValue < row.minThreshold || row.currentValue > row.maxThreshold) {
    return 'text-danger'
  }
  return ''
}

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}

function handleReset() {
  filterForm.name = ''
  filterForm.type = ''
  filterForm.status = ''
}

function handleAdd() {
  isEdit.value = false
  editingId.value = ''
  Object.assign(form, {
    name: '',
    code: '',
    type: 'temperature',
    location: '',
    description: '',
    unit: '°C',
    minThreshold: 0,
    maxThreshold: 100
  })
  dialogVisible.value = true
}

function handleEdit(row: MonitorPoint) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    code: row.code,
    type: row.type,
    location: row.location,
    description: row.description,
    unit: row.unit,
    minThreshold: row.minThreshold,
    maxThreshold: row.maxThreshold
  })
  dialogVisible.value = true
}

function handleView(row: MonitorPoint) {
  router.push(`/monitor/${row.id}`)
}

function handleRowClick(row: MonitorPoint) {
  router.push(`/monitor/${row.id}`)
}

async function handleDelete(row: MonitorPoint) {
  try {
    await ElMessageBox.confirm(
      `确定删除监测点 ${row.name} 吗？此操作不可恢复，请谨慎操作！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const success = await monitorStore.deleteMonitor(row.id)
    if (success) {
      ElMessage.success('删除成功')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 重置表单
function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
    formRef.value.clearValidate()
  }
}

// 取消按钮
function handleCancel() {
  dialogVisible.value = false
  resetForm()
}

// 对话框关闭时
function handleDialogClose() {
  resetForm()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (isEdit.value) {
        await monitorStore.updateMonitor(editingId.value, {
          ...form,
          updateTime: new Date().toISOString()
        })
      } else {
        // 新增监测点
        await monitorStore.addMonitor({
          ...form,
          currentValue: 0,
          status: 'normal',
          updateTime: new Date().toISOString()
        } as MonitorPoint)
      }
      // 先关闭弹窗再提示成功
      dialogVisible.value = false
      resetForm()
      ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  // 只在数据为空时才获取，避免从详情页返回时重新加载
  if (monitorStore.monitors.length === 0) {
    monitorStore.fetchMonitors()
  }
})

// 页面激活时，数据已经通过 store 自动同步，无需额外操作
onActivated(() => {
  // 监测点数据通过 store 共享，已自动更新
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.monitor-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.filter-card {
  padding: $spacing-md $spacing-lg;
  
  :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    align-items: flex-end;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
    
    // 响应式布局
    @media (max-width: 1200px) {
      flex: 0 0 auto;
      min-width: 200px;
    }
    
    @media (max-width: 768px) {
      flex: 1 1 100%;
      min-width: 100%;
      
      .el-input,
      .el-select {
        width: 100% !important;
      }
    }
  }
}

.text-danger {
  color: $danger-color;
  font-weight: 600;
}

.table-card {
  // 固定表格容器高度，避免滚动条出现/消失导致的闪动
  :deep(.el-table) {
    .el-table__body-wrapper {
      overflow-y: auto !important;
    }
  }
}

.monitor-form {
  max-width: 500px;
  margin: 0 auto;
}
</style>
