<template>
  <div class="dashboard-page page-container">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <DataCard
        :icon="Monitor"
        :value="stats.total"
        label="监测点总数"
        type="primary"
        :trend="5"
      />
      <DataCard
        :icon="CircleCheck"
        :value="stats.normal"
        label="正常运行"
        type="success"
        :trend="2"
      />
      <DataCard
        :icon="Warning"
        :value="stats.warning"
        label="预警状态"
        type="warning"
        :trend="-3"
      />
      <DataCard
        :icon="Bell"
        :value="stats.alarm"
        label="报警状态"
        type="danger"
        :trend="1"
      />
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="title">监测数据趋势</span>
          <el-radio-group v-model="chartDays" size="small" @change="loadChartData">
            <el-radio-button :value="1">24小时</el-radio-button>
            <el-radio-button :value="7">7天</el-radio-button>
            <el-radio-button :value="30">30天</el-radio-button>
          </el-radio-group>
        </div>
        <LineChart
          :data="chartData"
          title=""
          unit="°C"
          :threshold-low="20"
          :threshold-high="80"
        />
      </div>
      
      <div class="chart-card status-chart">
        <div class="card-header">
          <span class="title">状态分布</span>
        </div>
        <div ref="pieChartRef" class="pie-chart"></div>
      </div>
    </div>
    
    <!-- 最近报警 -->
    <div class="card recent-alarms">
      <div class="card-header">
        <span class="title">最近报警</span>
        <el-button type="primary" link @click="$router.push('/alarm/history')">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <el-table :data="recentAlarms" stripe>
        <el-table-column prop="monitorName" label="监测点" min-width="120" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ getLevelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="当前值" width="100" />
        <el-table-column prop="threshold" label="阈值" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="triggerTime" label="触发时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.triggerTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { Monitor, CircleCheck, Warning, Bell, ArrowRight } from '@element-plus/icons-vue'
import DataCard from '@/components/ui/DataCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { useMonitorStore } from '@/stores/monitor'
import { generateMockHistoryData, generateMockAlarmRecords } from '@/utils/mockData'
import type { AlarmLevel } from '@/types/alarm'

const monitorStore = useMonitorStore()
const stats = computed(() => monitorStore.stats)

const chartDays = ref(7)
const chartData = ref<{ timestamp: string; value: number }[]>([])
const recentAlarms = ref(generateMockAlarmRecords(5))

const pieChartRef = ref<HTMLElement>()
let pieChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function loadChartData() {
  const data = generateMockHistoryData('demo', chartDays.value)
  chartData.value = data.map(d => ({ timestamp: d.timestamp, value: d.value }))
}

function initPieChart() {
  if (!pieChartRef.value) return
  
  pieChart = echarts.init(pieChartRef.value)
  
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: [
        { value: stats.value.normal, name: '正常', itemStyle: { color: '#67c23a' } },
        { value: stats.value.warning, name: '预警', itemStyle: { color: '#e6a23c' } },
        { value: stats.value.alarm, name: '报警', itemStyle: { color: '#f56c6c' } },
        { value: stats.value.offline, name: '离线', itemStyle: { color: '#909399' } }
      ]
    }]
  }
  
  pieChart.setOption(option)
  
  // 使用 ResizeObserver 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  resizeObserver.observe(pieChartRef.value)
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
  const map: Record<AlarmLevel, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  }
  return map[level]
}

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}

function handleResize() {
  pieChart?.resize()
}

onMounted(async () => {
  await monitorStore.fetchMonitors()
  loadChartData()
  initPieChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (resizeObserver && pieChartRef.value) {
    resizeObserver.unobserve(pieChartRef.value)
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  pieChart = null
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $spacing-md;
}

.chart-card {
  background: $bg-card;
  border-radius: $border-radius-md;
  box-shadow: $shadow-sm;
  padding: $spacing-lg;
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
    
    .title {
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-primary;
    }
  }
}

.status-chart {
  .pie-chart {
    height: 300px;
  }
}

.recent-alarms {
  background: $bg-card;
  border-radius: $border-radius-md;
  box-shadow: $shadow-sm;
  padding: $spacing-lg;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
