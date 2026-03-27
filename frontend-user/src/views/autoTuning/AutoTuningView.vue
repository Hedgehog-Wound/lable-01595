<template>
  <div class="auto-tuning page-container">
    <!-- 参数配置 -->
    <div class="card config-card">
      <div class="card-header">
        <span class="title">自动调参配置</span>
      </div>
      
      <el-form :model="tuningParams" label-width="100px" class="config-form">
        <!-- 第一行：调参算法、历史数据天数 -->
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12">
            <el-form-item label="调参算法">
              <el-select v-model="tuningParams.algorithm" style="width: 100%" @change="handleAlgorithmChange">
                <el-option value="statistical" label="统计学方法 (3σ原则)" />
                <el-option value="adaptive" label="自适应方法 (IQR)" />
                <el-option value="ml" label="机器学习方法" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="历史天数">
              <el-select v-model="tuningParams.historyDays" style="width: 100%">
                <el-option
                  v-for="day in algorithmConfig.historyDays"
                  :key="day"
                  :value="day"
                  :label="`${day}天`"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第二行：灵敏度、置信度 -->
        <el-row :gutter="24">
          <el-col :xs="24" :sm="12">
            <el-form-item label="灵敏度">
              <div class="slider-wrapper">
                <el-slider
                  v-model="tuningParams.sensitivity"
                  :min="algorithmConfig.sensitivity.min"
                  :max="algorithmConfig.sensitivity.max"
                  :step="algorithmConfig.sensitivity.step"
                  :show-stops="false"
                />
                <el-input-number
                  v-model="tuningParams.sensitivity"
                  :min="algorithmConfig.sensitivity.min"
                  :max="algorithmConfig.sensitivity.max"
                  :step="algorithmConfig.sensitivity.step"
                  controls-position="right"
                  class="slider-input"
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item v-if="tuningParams.algorithm !== 'ml'" label="期望可信度">
              <div class="slider-wrapper">
                <el-slider
                  v-model="tuningParams.confidenceLevel"
                  :min="80"
                  :max="99"
                  :step="1"
                  :format-tooltip="(val: number) => val + '%'"
                />
                <el-input-number
                  v-model="tuningParams.confidenceLevel"
                  :min="80"
                  :max="99"
                  :step="1"
                  controls-position="right"
                  class="slider-input"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第三行：选择监测点、执行按钮 -->
        <el-row :gutter="24" align="middle">
          <el-col :xs="24" :sm="12">
            <el-form-item label="监测点">
              <el-select
                v-model="selectedMonitors"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="选择监测点"
                style="width: 100%"
              >
                <el-option
                  v-for="m in monitors"
                  :key="m.id"
                  :label="m.name"
                  :value="m.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label=" ">
              <el-button
                type="primary"
                :icon="MagicStick"
                :loading="tuning"
                @click="executeTuning"
              >
                执行调参
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    
    <!-- 调参结果 -->
    <div class="card results-card">
      <div class="card-header">
        <span class="title">调参结果</span>
        <div class="header-actions">
          <el-button 
            type="success" 
            :icon="Check" 
            :disabled="results.length === 0 || results.every(r => r.applied)"
            @click="applyAll"
          >
            应用全部
          </el-button>
          <el-button 
            :icon="Download" 
            :disabled="results.length === 0"
            @click="exportResults"
          >
            导出结果
          </el-button>
          <el-button 
            type="danger"
            plain
            :icon="Delete"
            :disabled="results.length === 0"
            @click="clearResults"
          >
            清空结果
          </el-button>
        </div>
      </div>
      
      <el-table :data="results" stripe>
        <el-table-column prop="monitorName" label="监测点" min-width="150" />
        <el-table-column label="原始阈值" width="150">
          <template #default="{ row }">
            {{ row.originalLow }} - {{ row.originalHigh }}
          </template>
        </el-table-column>
        <el-table-column label="建议阈值" width="150">
          <template #default="{ row }">
            <span class="suggested-value">
              {{ row.suggestedLow }} - {{ row.suggestedHigh }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变化" width="120">
          <template #default="{ row }">
            <span :class="getChangeClass(row)">
              {{ getChangeText(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round(row.confidence * 100)"
              :color="getConfidenceColor(row.confidence)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="调参依据" min-width="200" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.applied"
              type="primary"
              link
              size="small"
              @click="applyResult(row)"
            >
              应用
            </el-button>
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 调参详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="调参详情"
      width="600px"
    >
      <el-descriptions v-if="detailRow" :column="1" border>
        <el-descriptions-item label="监测点">
          {{ detailRow.monitorName }}
        </el-descriptions-item>
        <el-descriptions-item label="原始阈值">
          <span style="color: #909399;">{{ detailRow.originalLow }} - {{ detailRow.originalHigh }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="建议阈值">
          <span style="color: #409eff; font-weight: 600;">{{ detailRow.suggestedLow }} - {{ detailRow.suggestedHigh }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="阈值变化">
          <span :class="getChangeClass(detailRow)">{{ getChangeText(detailRow) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="置信度">
          <el-progress
            :percentage="Math.round(detailRow.confidence * 100)"
            :color="getConfidenceColor(detailRow.confidence)"
            :stroke-width="12"
          />
        </el-descriptions-item>
        <el-descriptions-item label="调参算法">
          {{ getAlgorithmLabel(tuningParams.algorithm) }}
        </el-descriptions-item>
        <el-descriptions-item label="历史数据">
          {{ tuningParams.historyDays }}天
        </el-descriptions-item>
        <el-descriptions-item label="灵敏度">
          {{ tuningParams.sensitivity }}
        </el-descriptions-item>
        <el-descriptions-item label="期望可信度">
          {{ tuningParams.confidenceLevel }}%
        </el-descriptions-item>
        <el-descriptions-item label="调参依据">
          {{ detailRow.reason }}
        </el-descriptions-item>
        <el-descriptions-item label="应用状态">
          <el-tag :type="detailRow.applied ? 'success' : 'info'">
            {{ detailRow.applied ? '已应用' : '未应用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 算法说明 -->
    <div class="card algorithm-card">
      <div class="card-header">
        <span class="title">算法说明</span>
      </div>
      <div class="algorithm-info">
        <div 
          class="algorithm-item" 
          :class="{ active: tuningParams.algorithm === 'statistical' }"
          @click="tuningParams.algorithm = 'statistical'; handleAlgorithmChange()"
        >
          <h4>统计学方法 (3σ原则)</h4>
          <p>基于正态分布假设，使用均值±N倍标准差作为阈值范围。适用于数据分布较为稳定的场景。</p>
          <ul class="feature-list">
            <li>灵敏度范围：20-100（控制标准差倍数）</li>
            <li>推荐历史数据：7-90天</li>
            <li>需要期望可信度参数</li>
          </ul>
          <el-tag size="small">推荐用于：温度、湿度监测</el-tag>
        </div>
        <div 
          class="algorithm-item" 
          :class="{ active: tuningParams.algorithm === 'adaptive' }"
          @click="tuningParams.algorithm = 'adaptive'; handleAlgorithmChange()"
        >
          <h4>自适应方法 (IQR)</h4>
          <p>使用四分位距方法，对异常值更加鲁棒。适用于数据存在偶发异常的场景。</p>
          <ul class="feature-list">
            <li>灵敏度范围：10-50（控制IQR倍数）</li>
            <li>推荐历史数据：7-30天</li>
            <li>需要期望可信度参数</li>
          </ul>
          <el-tag size="small">推荐用于：压力、流量监测</el-tag>
        </div>
        <div 
          class="algorithm-item" 
          :class="{ active: tuningParams.algorithm === 'ml' }"
          @click="tuningParams.algorithm = 'ml'; handleAlgorithmChange()"
        >
          <h4>机器学习方法</h4>
          <p>结合移动平均和趋势分析，能够适应数据的变化趋势。适用于数据有明显周期性或趋势的场景。</p>
          <ul class="feature-list">
            <li>灵敏度范围：30-90（控制趋势预测敏感度）</li>
            <li>推荐历史数据：14-90天</li>
            <li>无需期望可信度参数</li>
          </ul>
          <el-tag size="small">推荐用于：振动、复杂工况监测</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义组件名称，用于 keep-alive
defineOptions({
  name: 'AutoTuning'
})
import { MagicStick, Check, Download, Delete } from '@element-plus/icons-vue'
import { useMonitorStore } from '@/stores/monitor'
import { generateMockHistoryData } from '@/utils/mockData'
import { batchAutoTuning } from '@/utils/algorithm'
import { updateAlarmConfigByMonitorId, batchUpdateAlarmConfigsByMonitorIds } from '@/api/alarm'
import type { TuningResult, TuningParams } from '@/types/alarm'

const monitorStore = useMonitorStore()
const monitors = computed(() => monitorStore.monitors)

const tuning = ref(false)
const selectedMonitors = ref<string[]>([])
const results = ref<TuningResult[]>([])

const tuningParams = reactive<Omit<TuningParams, 'monitorId'>>({
  algorithm: 'statistical',
  sensitivity: 50,
  historyDays: 7,
  confidenceLevel: 95
})

// 从 sessionStorage 恢复数据
function loadFromStorage() {
  try {
    const savedResults = sessionStorage.getItem('autoTuningResults')
    const savedParams = sessionStorage.getItem('autoTuningParams')
    const savedMonitors = sessionStorage.getItem('autoTuningSelectedMonitors')
    
    if (savedResults) {
      results.value = JSON.parse(savedResults)
    }
    if (savedParams) {
      Object.assign(tuningParams, JSON.parse(savedParams))
    }
    if (savedMonitors) {
      selectedMonitors.value = JSON.parse(savedMonitors)
    }
  } catch (error) {
    console.error('Failed to load auto-tuning data from storage:', error)
  }
}

// 保存数据到 sessionStorage
function saveToStorage() {
  try {
    sessionStorage.setItem('autoTuningResults', JSON.stringify(results.value))
    sessionStorage.setItem('autoTuningParams', JSON.stringify(tuningParams))
    sessionStorage.setItem('autoTuningSelectedMonitors', JSON.stringify(selectedMonitors.value))
  } catch (error) {
    console.error('Failed to save auto-tuning data to storage:', error)
  }
}

// 监听数据变化，自动保存
watch(results, () => {
  saveToStorage()
}, { deep: true })

watch(selectedMonitors, () => {
  saveToStorage()
})

watch(tuningParams, () => {
  saveToStorage()
})

// 不同算法的配置
interface AlgorithmConfig {
  sensitivity: {
    min: number
    max: number
    step: number
    marks: Record<number, string>
    hint: string
  }
  historyDays: number[]
  historyHint: string
}

const algorithmConfigs: Record<string, AlgorithmConfig> = {
  statistical: {
    sensitivity: {
      min: 20,
      max: 100,
      step: 5,
      marks: { 20: '宽松', 60: '标准', 100: '严格' },
      hint: '控制标准差倍数，值越高阈值越严格'
    },
    historyDays: [7, 14, 30, 90],
    historyHint: '建议至少7天数据以保证统计有效性'
  },
  adaptive: {
    sensitivity: {
      min: 10,
      max: 50,
      step: 2,
      marks: { 10: '宽松', 30: '标准', 50: '严格' },
      hint: '控制IQR倍数，值越高对异常值越敏感'
    },
    historyDays: [7, 14, 30],
    historyHint: '建议7-30天数据，过长可能包含过多异常'
  },
  ml: {
    sensitivity: {
      min: 30,
      max: 90,
      step: 5,
      marks: { 30: '保守', 60: '平衡', 90: '激进' },
      hint: '控制趋势预测的敏感度'
    },
    historyDays: [14, 30, 60, 90],
    historyHint: '建议至少14天数据以学习趋势和周期'
  }
}

const algorithmConfig = computed(() => algorithmConfigs[tuningParams.algorithm])

// 切换算法时调整参数
function handleAlgorithmChange() {
  const config = algorithmConfigs[tuningParams.algorithm]
  
  // 调整灵敏度到新算法的合理范围
  if (tuningParams.sensitivity < config.sensitivity.min) {
    tuningParams.sensitivity = config.sensitivity.min
  } else if (tuningParams.sensitivity > config.sensitivity.max) {
    tuningParams.sensitivity = config.sensitivity.max
  } else {
    // 映射到新范围的中间值
    tuningParams.sensitivity = Math.round((config.sensitivity.min + config.sensitivity.max) / 2)
  }
  
  // 调整历史天数到新算法支持的范围
  if (!config.historyDays.includes(tuningParams.historyDays)) {
    tuningParams.historyDays = config.historyDays[0]
  }
}

async function executeTuning() {
  if (selectedMonitors.value.length === 0) {
    ElMessage.warning('请选择至少一个监测点')
    return
  }
  
  tuning.value = true
  results.value = []
  
  try {
    // 模拟加载历史数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const selectedMonitorList = monitors.value.filter(m => 
      selectedMonitors.value.includes(m.id)
    )
    
    // 生成历史数据
    const historyDataMap = new Map()
    for (const monitor of selectedMonitorList) {
      historyDataMap.set(monitor.id, generateMockHistoryData(monitor.id, tuningParams.historyDays))
    }
    
    // 执行调参算法
    results.value = batchAutoTuning(selectedMonitorList, historyDataMap, tuningParams)
    
    ElMessage.success(`已完成 ${results.value.length} 个监测点的自动调参`)
  } finally {
    tuning.value = false
  }
}

function getChangeClass(row: TuningResult) {
  const lowChange = row.suggestedLow - row.originalLow
  const highChange = row.suggestedHigh - row.originalHigh
  
  if (Math.abs(lowChange) < 1 && Math.abs(highChange) < 1) return 'change-none'
  if (lowChange > 0 || highChange > 0) return 'change-up'
  return 'change-down'
}

function getChangeText(row: TuningResult) {
  const lowChange = row.suggestedLow - row.originalLow
  const highChange = row.suggestedHigh - row.originalHigh
  
  if (Math.abs(lowChange) < 1 && Math.abs(highChange) < 1) return '无变化'
  
  const parts = []
  if (Math.abs(lowChange) >= 1) {
    parts.push(`下限${lowChange > 0 ? '+' : ''}${lowChange.toFixed(1)}`)
  }
  if (Math.abs(highChange) >= 1) {
    parts.push(`上限${highChange > 0 ? '+' : ''}${highChange.toFixed(1)}`)
  }
  return parts.join(', ')
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.9) return '#67c23a'
  if (confidence >= 0.7) return '#e6a23c'
  return '#f56c6c'
}

async function applyResult(row: TuningResult) {
  try {
    await ElMessageBox.confirm(
      `确定将 ${row.monitorName} 的阈值更新为 ${row.suggestedLow} - ${row.suggestedHigh} 吗？`,
      '确认应用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 1. 更新报警配置
    await updateAlarmConfigByMonitorId(row.monitorId, {
      lowThreshold: row.suggestedLow,
      highThreshold: row.suggestedHigh
    })
    
    // 2. 更新监测点阈值
    monitorStore.updateMonitorThresholds(row.monitorId, {
      minThreshold: row.suggestedLow,
      maxThreshold: row.suggestedHigh
    })
    
    // 3. 更新本地状态
    row.applied = true
    
    ElMessage.success('已应用新阈值')
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      ElMessage.error('应用失败，请重试')
    }
  }
}

async function applyAll() {
  const unapplied = results.value.filter(r => !r.applied)
  if (unapplied.length === 0) {
    ElMessage.info('所有结果已应用')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '此操作不可逆，请谨慎操作。确认应用？',
      '批量应用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    // 准备批量更新数据
    const updates = unapplied.map(r => ({
      monitorId: r.monitorId,
      data: {
        lowThreshold: r.suggestedLow,
        highThreshold: r.suggestedHigh
      }
    }))
    
    // 1. 批量更新报警配置
    await batchUpdateAlarmConfigsByMonitorIds(updates)
    
    // 2. 批量更新监测点阈值
    const thresholdUpdates = unapplied.map(r => ({
      id: r.monitorId,
      minThreshold: r.suggestedLow,
      maxThreshold: r.suggestedHigh
    }))
    monitorStore.batchUpdateMonitorThresholds(thresholdUpdates)
    
    // 3. 更新本地状态
    unapplied.forEach(r => r.applied = true)
    
    ElMessage.success(`已应用 ${unapplied.length} 个调参结果`)
  } catch (error) {
    // 用户取消操作
    if (error !== 'cancel') {
      ElMessage.error('批量应用失败，请重试')
    }
  }
}

function exportResults() {
  const data = results.value.map(r => ({
    监测点: r.monitorName,
    原始下限: r.originalLow,
    原始上限: r.originalHigh,
    建议下限: r.suggestedLow,
    建议上限: r.suggestedHigh,
    置信度: (r.confidence * 100).toFixed(1) + '%',
    调参依据: r.reason,
    是否应用: r.applied ? '是' : '否'
  }))
  
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `调参结果_${new Date().toLocaleDateString()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('导出成功')
}

async function clearResults() {
  try {
    await ElMessageBox.confirm(
      '确定清空所有调参结果吗？此操作不可恢复。',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    results.value = []
    selectedMonitors.value = []
    ElMessage.success('已清空调参结果')
  } catch (error) {
    // 用户取消操作
  }
}

const detailDialogVisible = ref(false)
const detailRow = ref<TuningResult | null>(null)

function viewDetail(row: TuningResult) {
  detailRow.value = row
  detailDialogVisible.value = true
}

function getAlgorithmLabel(algorithm: string) {
  const labels: Record<string, string> = {
    statistical: '统计学方法 (3σ原则)',
    adaptive: '自适应方法 (IQR)',
    ml: '机器学习方法'
  }
  return labels[algorithm] || algorithm
}

onMounted(() => {
  monitorStore.fetchMonitors()
  loadFromStorage()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.auto-tuning {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.config-card {
  .config-form {
    .slider-wrapper {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      width: 100%;
      
      :deep(.el-slider) {
        flex: 1;
        margin-right: 0;
        padding-right: $spacing-sm;
      }
      
      .slider-input {
        width: 80px;
        flex-shrink: 0;
      }
    }
    
    :deep(.el-form-item__label) {
      font-weight: 500;
    }
    
    :deep(.el-form-item) {
      margin-bottom: $spacing-md;
    }
  }
}

.algorithm-card {
  .algorithm-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;
  }
  
  .algorithm-item {
    padding: $spacing-lg;
    background: $bg-primary;
    border-radius: $border-radius-md;
    border: 2px solid transparent;
    transition: all 0.3s;
    cursor: pointer;
    
    &.active {
      border-color: $primary-color;
      background: rgba(64, 158, 255, 0.05);
      box-shadow: $shadow-md;
    }
    
    h4 {
      margin: 0 0 $spacing-sm;
      font-size: $font-size-lg;
      font-weight: 600;
      color: $text-primary;
    }
    
    p {
      margin: 0 0 $spacing-md;
      font-size: $font-size-sm;
      color: $text-secondary;
      line-height: 1.6;
      min-height: 48px;
    }
    
    .feature-list {
      margin: 0 0 $spacing-md;
      padding-left: $spacing-lg;
      font-size: $font-size-sm;
      color: $text-regular;
      line-height: 1.8;
      
      li {
        margin-bottom: $spacing-xs;
      }
    }
  }
}

.param-hint {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.4;
}

.results-card {
  .header-actions {
    display: flex;
    gap: $spacing-sm;
  }
  
  .suggested-value {
    color: $primary-color;
    font-weight: 600;
  }
  
  .change-none { color: $text-secondary; }
  .change-up { color: $danger-color; }
  .change-down { color: $success-color; }
}

@media (max-width: 1200px) {
  .algorithm-card .algorithm-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .config-card .config-form {
    label-width: 100px;
    
    .slider-wrapper {
      :deep(.el-slider__input) {
        width: 60px;
      }
    }
  }
}

@media (max-width: 768px) {
  .config-card .config-form {
    .slider-wrapper {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      
      :deep(.el-slider) {
        flex: 1;
        min-width: 150px;
      }
      
      :deep(.el-slider__input) {
        width: 60px;
        flex-shrink: 0;
      }
    }
    
    .monitor-select-wrapper {
      flex-direction: column;
      
      .monitor-select {
        min-width: 100%;
      }
      
      .select-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
  
  .results-card {
    :deep(.el-table) {
      font-size: 12px;
    }
  }
}
</style>
