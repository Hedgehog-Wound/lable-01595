import type { TuningParams, TuningResult } from '@/types/alarm'
import type { MonitorData, MonitorPoint } from '@/types/monitor'

/**
 * 自动调参算法模块
 * 提供多种阈值优化算法
 */

// 计算均值
function mean(data: number[]): number {
  if (data.length === 0) return 0
  return data.reduce((sum, val) => sum + val, 0) / data.length
}

// 计算标准差
function standardDeviation(data: number[]): number {
  if (data.length <= 1) return 0
  const avg = mean(data)
  const squareDiffs = data.map(value => Math.pow(value - avg, 2))
  return Math.sqrt(mean(squareDiffs))
}

// 计算百分位数
function percentile(data: number[], p: number): number {
  if (data.length === 0) return 0
  const sorted = [...data].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

// 计算四分位距 (IQR) - 用于自适应调参
function iqr(data: number[]): number {
  return percentile(data, 75) - percentile(data, 25)
}

/**
 * 统计方法调参
 * 基于历史数据的统计特征计算阈值
 */
export function statisticalTuning(
  historyData: MonitorData[],
  params: TuningParams,
  monitor?: MonitorPoint
): { low: number; high: number; confidence: number } {
  const values = historyData.map(d => d.value)
  
  if (values.length < 10) {
    // 当数据量不足时，使用监测点的原始阈值作为回退
    if (monitor) {
      return { 
        low: monitor.minThreshold, 
        high: monitor.maxThreshold, 
        confidence: 0.3 
      }
    }
    return { low: 0, high: 100, confidence: 0.3 }
  }
  
  const avg = mean(values)
  const std = standardDeviation(values)
  const sensitivity = params.sensitivity / 100
  
  // 使用 3σ 原则，根据灵敏度调整
  const multiplier = 3 * (1 - sensitivity * 0.5)
  
  const low = Math.max(0, avg - std * multiplier)
  const high = avg + std * multiplier
  
  // 置信度基于数据量和标准差
  const avgAbs = Math.abs(avg)
  const confidence = avgAbs > 0 
    ? Math.min(0.95, 0.5 + (values.length / 1000) * 0.3 + (1 - std / avgAbs) * 0.15)
    : Math.min(0.95, 0.5 + (values.length / 1000) * 0.3)
  
  return { low: Number(low.toFixed(2)), high: Number(high.toFixed(2)), confidence }
}

/**
 * 自适应调参
 * 基于 IQR 方法，对异常值更鲁棒
 */
export function adaptiveTuning(
  historyData: MonitorData[],
  params: TuningParams,
  monitor?: MonitorPoint
): { low: number; high: number; confidence: number } {
  const values = historyData.map(d => d.value)
  
  if (values.length < 10) {
    // 当数据量不足时，使用监测点的原始阈值作为回退
    if (monitor) {
      return { 
        low: monitor.minThreshold, 
        high: monitor.maxThreshold, 
        confidence: 0.3 
      }
    }
    return { low: 0, high: 100, confidence: 0.3 }
  }
  
  const q1 = percentile(values, 25)
  const q3 = percentile(values, 75)
  const iqrValue = iqr(values)
  const sensitivity = params.sensitivity / 100
  
  // IQR 方法，根据灵敏度调整倍数
  const multiplier = 1.5 * (1 + (1 - sensitivity) * 0.5)
  
  const low = Math.max(0, q1 - iqrValue * multiplier)
  const high = q3 + iqrValue * multiplier
  
  const confidence = Math.min(0.92, 0.55 + (values.length / 1000) * 0.25)
  
  return { low: Number(low.toFixed(2)), high: Number(high.toFixed(2)), confidence }
}

/**
 * 机器学习方法调参 (简化版)
 * 使用移动平均和趋势分析
 */
export function mlTuning(
  historyData: MonitorData[],
  params: TuningParams,
  monitor?: MonitorPoint
): { low: number; high: number; confidence: number } {
  const values = historyData.map(d => d.value)
  
  if (values.length < 20) {
    return statisticalTuning(historyData, params, monitor)
  }
  
  // 计算移动平均
  const windowSize = Math.min(20, Math.floor(values.length / 5))
  const movingAvg: number[] = []
  
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1)
    movingAvg.push(mean(window))
  }
  
  // 计算趋势
  const recentAvg = mean(movingAvg.slice(-10))
  const overallAvg = mean(movingAvg)
  const trend = (recentAvg - overallAvg) / overallAvg
  
  // 基于趋势调整阈值
  const std = standardDeviation(values)
  const sensitivity = params.sensitivity / 100
  const multiplier = 2.5 * (1 - sensitivity * 0.3)
  
  let low = overallAvg - std * multiplier
  let high = overallAvg + std * multiplier
  
  // 根据趋势微调
  if (trend > 0.05) {
    high *= (1 + trend * 0.5)
  } else if (trend < -0.05) {
    low *= (1 + trend * 0.5)
  }
  
  low = Math.max(0, low)
  
  const confidence = Math.min(0.88, 0.6 + (values.length / 1000) * 0.2)
  
  return { low: Number(low.toFixed(2)), high: Number(high.toFixed(2)), confidence }
}

/**
 * 执行自动调参
 */
export function executeAutoTuning(
  monitor: MonitorPoint,
  historyData: MonitorData[],
  params: TuningParams
): TuningResult {
  let result: { low: number; high: number; confidence: number }
  let reason: string
  
  switch (params.algorithm) {
    case 'statistical':
      result = statisticalTuning(historyData, params, monitor)
      reason = '基于统计学 3σ 原则计算，适用于正态分布数据'
      break
    case 'adaptive':
      result = adaptiveTuning(historyData, params, monitor)
      reason = '基于 IQR 四分位距方法，对异常值更鲁棒'
      break
    case 'ml':
      result = mlTuning(historyData, params, monitor)
      reason = '基于移动平均和趋势分析，考虑数据变化趋势'
      break
    default:
      result = statisticalTuning(historyData, params, monitor)
      reason = '默认使用统计学方法'
  }
  
  return {
    monitorId: monitor.id,
    monitorName: monitor.name,
    originalLow: monitor.minThreshold,
    originalHigh: monitor.maxThreshold,
    suggestedLow: result.low,
    suggestedHigh: result.high,
    confidence: result.confidence,
    reason,
    applied: false
  }
}

/**
 * 批量执行自动调参
 */
export function batchAutoTuning(
  monitors: MonitorPoint[],
  historyDataMap: Map<string, MonitorData[]>,
  params: Omit<TuningParams, 'monitorId'>
): TuningResult[] {
  return monitors.map(monitor => {
    const historyData = historyDataMap.get(monitor.id) || []
    return executeAutoTuning(monitor, historyData, { ...params, monitorId: monitor.id })
  })
}
