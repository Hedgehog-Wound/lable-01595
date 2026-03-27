<template>
  <div class="alarm-history page-container">
    <!-- 筛选 -->
    <div class="card filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 150px" @change="handleFilter">
            <el-option
              v-for="item in alarmStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="filterForm.level" placeholder="全部" clearable style="width: 150px" @change="handleFilter">
            <el-option
              v-for="item in alarmLevelOptions"
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
    
    <!-- 列表 -->
    <div class="card">
      <div class="card-header">
        <span class="title">报警历史</span>
      </div>
      
      <el-table
        v-loading="loading"
        :data="records"
        stripe
      >
        <el-table-column prop="monitorName" label="监测点" min-width="150" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ getLevelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="触发值" width="100" />
        <el-table-column prop="threshold" label="阈值" width="100" />
        <el-table-column prop="message" label="报警信息" min-width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="triggerTime" label="触发时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.triggerTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="100">
          <template #default="{ row }">
            {{ row.handler || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                v-if="row.status === 'active'"
                type="warning"
                link
                size="small"
                @click="handleAcknowledge(row)"
              >
                确认
              </el-button>
              <el-button
                v-if="row.status !== 'resolved'"
                type="success"
                link
                size="small"
                @click="handleResolve(row)"
              >
                解决
              </el-button>
              <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchRecords"
          @current-change="fetchRecords"
        />
      </div>
    </div>
    
    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="报警详情"
      width="600px"
    >
      <el-descriptions v-if="currentRecord" :column="2" border>
        <el-descriptions-item label="监测点">{{ currentRecord.monitorName }}</el-descriptions-item>
        <el-descriptions-item label="报警级别">
          <el-tag :type="getLevelType(currentRecord.level)">
            {{ getLevelLabel(currentRecord.level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="触发值">{{ currentRecord.value }}</el-descriptions-item>
        <el-descriptions-item label="阈值">{{ currentRecord.threshold }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <StatusBadge :status="currentRecord.status" />
        </el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentRecord.handler || '-' }}</el-descriptions-item>
        <el-descriptions-item label="触发时间" :span="2">
          {{ formatTime(currentRecord.triggerTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRecord.acknowledgeTime" label="确认时间" :span="2">
          {{ formatTime(currentRecord.acknowledgeTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRecord.resolveTime" label="解决时间" :span="2">
          {{ formatTime(currentRecord.resolveTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="报警信息" :span="2">
          {{ currentRecord.message }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { getAlarmRecords, acknowledgeAlarm, resolveAlarm } from '@/api/alarm'
import { alarmLevelOptions, alarmStatusOptions, type AlarmRecord, type AlarmLevel } from '@/types/alarm'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const records = ref<AlarmRecord[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filterForm = reactive({
  status: '',
  level: ''
})

const detailVisible = ref(false)
const currentRecord = ref<AlarmRecord | null>(null)

async function fetchRecords() {
  loading.value = true
  try {
    const result = await getAlarmRecords({
      page: page.value,
      pageSize: pageSize.value,
      status: filterForm.status,
      level: filterForm.level
    })
    records.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  page.value = 1
  fetchRecords()
}

function handleReset() {
  filterForm.status = ''
  filterForm.level = ''
  page.value = 1
  fetchRecords()
}

function getLevelType(level: AlarmLevel) {
  const map: Record<AlarmLevel, string> = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
  }
  return map[level]
}

function getLevelLabel(level: AlarmLevel) {
  return alarmLevelOptions.find(o => o.value === level)?.label || level
}

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}

async function handleAcknowledge(row: AlarmRecord) {
  try {
    await ElMessageBox.confirm(
      `确认已知晓 ${row.monitorName} 的报警信息吗？`,
      '确认报警',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await acknowledgeAlarm(row.id)
    row.status = 'acknowledged'
    row.acknowledgeTime = new Date().toISOString()
    row.handler = userStore.userInfo?.nickname || userStore.userInfo?.username || '当前用户'
    ElMessage.success('已确认报警')
  } catch (error) {
    // 用户取消操作
  }
}

async function handleResolve(row: AlarmRecord) {
  try {
    await ElMessageBox.confirm(
      `确认 ${row.monitorName} 的报警问题已解决吗？`,
      '解决报警',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await resolveAlarm(row.id)
    row.status = 'resolved'
    row.resolveTime = new Date().toISOString()
    row.handler = userStore.userInfo?.nickname || userStore.userInfo?.username || '当前用户'
    ElMessage.success('已解决报警')
  } catch (error) {
    // 用户取消操作
  }
}

function handleDetail(row: AlarmRecord) {
  currentRecord.value = row
  detailVisible.value = true
}

onMounted(fetchRecords)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.alarm-history {
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
      min-width: 150px;
    }
    
    @media (max-width: 768px) {
      flex: 1 1 100%;
      min-width: 100%;
      
      .el-select {
        width: 100% !important;
      }
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color;
}


.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  align-items: center;
  white-space: nowrap;
}
</style>
