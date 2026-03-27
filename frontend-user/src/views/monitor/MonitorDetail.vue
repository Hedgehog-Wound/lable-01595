<template>
  <div class="monitor-detail page-container">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <h2>{{ monitor?.name || '监测点详情' }}</h2>
    </div>
    
    <div v-if="monitor" v-loading="loading" class="detail-content">
      <!-- 基本信息 -->
      <div class="card info-card">
        <div class="card-header">
          <span class="title">基本信息</span>
          <StatusBadge :status="monitor.status" />
        </div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="编号">{{ monitor.code }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ monitor.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getTypeLabel(monitor.type) }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ monitor.location }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ monitor.unit }}</el-descriptions-item>
          <el-descriptions-item label="当前值">
            <span :class="getValueClass(monitor)">
              {{ monitor.currentValue }} {{ monitor.unit }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="最小阈值">{{ monitor.minThreshold }}</el-descriptions-item>
          <el-descriptions-item label="最大阈值">{{ monitor.maxThreshold }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatTime(monitor.updateTime) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="3">{{ monitor.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 实时数据 -->
      <div class="card realtime-card">
        <div class="realtime-value">
          <div class="value-display" :class="monitor.status">
            <span class="number">{{ monitor.currentValue }}</span>
            <span class="unit">{{ monitor.unit }}</span>
          </div>
          <div class="value-range">
            <span>阈值范围: {{ monitor.minThreshold }} - {{ monitor.maxThreshold }} {{ monitor.unit }}</span>
          </div>
        </div>
        <div class="threshold-bar">
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{ width: getBarWidth(monitor) + '%' }"
              :class="monitor.status"
            ></div>
            <div
              class="bar-pointer"
              :style="{ left: getBarWidth(monitor) + '%' }"
            ></div>
          </div>
          <div class="bar-labels">
            <span>{{ monitor.minThreshold }}</span>
            <span>{{ monitor.maxThreshold }}</span>
          </div>
        </div>
      </div>
      
      <!-- 历史趋势 -->
      <div class="card chart-card">
        <div class="card-header">
          <span class="title">历史趋势</span>
          <el-radio-group v-model="chartDays" size="small" @change="loadHistory">
            <el-radio-button :value="1">24小时</el-radio-button>
            <el-radio-button :value="7">7天</el-radio-button>
            <el-radio-button :value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <LineChart
          :data="historyData"
          :unit="monitor.unit"
          :threshold-low="monitor.minThreshold"
          :threshold-high="monitor.maxThreshold"
        />
      </div>
    </div>
    
    <el-empty v-else description="监测点不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { useMonitorStore } from '@/stores/monitor'
import { generateMockHistoryData } from '@/utils/mockData'
import { monitorTypeOptions, type MonitorPoint, type MonitorType } from '@/types/monitor'

const route = useRoute()
const monitorStore = useMonitorStore()

const monitor = ref<MonitorPoint | null>(null)
const loading = ref(false)
const chartDays = ref(7)
const historyData = ref<{ timestamp: string; value: number }[]>([])

function getTypeLabel(type: MonitorType) {
  return monitorTypeOptions.find(o => o.value === type)?.label || type
}

function getValueClass(m: MonitorPoint) {
  if (m.currentValue < m.minThreshold || m.currentValue > m.maxThreshold) {
    return 'text-danger'
  }
  return ''
}

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}

function getBarWidth(m: MonitorPoint) {
  const range = m.maxThreshold - m.minThreshold
  if (range === 0) return 50 // 防止除以零
  const value = Math.max(m.minThreshold, Math.min(m.maxThreshold, m.currentValue))
  return ((value - m.minThreshold) / range) * 100
}

async function loadHistory() {
  if (!monitor.value) return
  const data = generateMockHistoryData(monitor.value.id, chartDays.value)
  historyData.value = data.map(d => ({ timestamp: d.timestamp, value: d.value }))
}

onMounted(async () => {
  const id = route.params.id as string
  loading.value = true
  
  try {
    if (monitorStore.monitors.length === 0) {
      await monitorStore.fetchMonitors()
    }
    
    monitor.value = monitorStore.monitors.find(m => m.id === id) || null
    
    if (monitor.value) {
      loadHistory()
    }
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.monitor-detail {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  
  h2 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-primary;
  }
}

.detail-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $spacing-md;
}

.info-card {
  grid-column: 1;
}

.realtime-card {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  
  .realtime-value {
    text-align: center;
    margin-bottom: $spacing-lg;
    
    .value-display {
      .number {
        font-size: 48px;
        font-weight: 700;
      }
      
      .unit {
        font-size: $font-size-lg;
        color: $text-secondary;
        margin-left: $spacing-xs;
      }
      
      &.normal { color: $success-color; }
      &.warning { color: $warning-color; }
      &.alarm { color: $danger-color; }
      &.offline { color: $info-color; }
    }
    
    .value-range {
      margin-top: $spacing-sm;
      font-size: $font-size-sm;
      color: $text-secondary;
    }
  }
  
  .threshold-bar {
    width: 100%;
    
    .bar-track {
      position: relative;
      height: 8px;
      background: $bg-primary;
      border-radius: 4px;
      overflow: visible;
      
      .bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
        
        &.normal { background: $success-color; }
        &.warning { background: $warning-color; }
        &.alarm { background: $danger-color; }
        &.offline { background: $info-color; }
      }
      
      .bar-pointer {
        position: absolute;
        top: -4px;
        width: 16px;
        height: 16px;
        background: $primary-color;
        border: 2px solid #fff;
        border-radius: 50%;
        transform: translateX(-50%);
        box-shadow: $shadow-sm;
      }
    }
    
    .bar-labels {
      display: flex;
      justify-content: space-between;
      margin-top: $spacing-sm;
      font-size: $font-size-xs;
      color: $text-secondary;
    }
  }
}

.chart-card {
  grid-column: 1 / -1;
}

.text-danger {
  color: $danger-color;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
  
  .info-card,
  .realtime-card,
  .chart-card {
    grid-column: 1;
  }
}
</style>
