/**
 * Mock 数据生成工具
 * 
 * 用途说明：
 * 1. 用于开发和测试阶段，模拟后端 API 返回的数据
 * 2. 生成的数据具有一定的随机性，但保持 ID 的稳定性以支持数据持久化
 * 3. 实际生产环境中，这些函数应该被真实的 API 调用替代
 * 
 * 数据持久化：
 * - 监测点数据会通过 localStorage 持久化存储
 * - 使用固定格式的 ID（如 monitor_1, alarm_1）确保数据一致性
 * - 首次加载时生成 mock 数据，后续从 localStorage 读取
 * 
 * 替换说明：
 * - 当后端 API 就绪后，在 src/api/ 目录下的文件中替换这些 mock 函数
 * - 保持数据结构不变，只需修改数据来源即可
 */

import type { MonitorPoint, MonitorStatus, MonitorType, MonitorData } from '@/types/monitor'
import type { AlarmRecord, AlarmConfig, AlarmLevel, AlarmStatus } from '@/types/alarm'

// 生成随机 ID（用于临时数据，如历史记录）
function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

// 生成随机日期
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString()
}

// 监测点名称（可根据实际业务场景修改）
const monitorNames = [
  '1号锅炉温度', '2号锅炉温度', '主管道压力', '分支管道压力',
  '车间湿度', '仓库湿度', '电机振动', '泵站振动',
  '进水流量', '出水流量', '冷却塔温度', '压缩机压力'
]

/**
 * 生成模拟监测点数据
 * 
 * 特点：
 * - 使用固定格式的 ID（monitor_1, monitor_2...）确保数据持久化后的一致性
 * - 生成的数据包含完整的监测点信息：名称、类型、状态、阈值等
 * - 数据会被存储到 localStorage，刷新页面后保持不变
 * 
 * @returns {MonitorPoint[]} 监测点数组
 */
export function generateMockMonitors(): MonitorPoint[] {
  const types: MonitorType[] = ['temperature', 'humidity', 'pressure', 'vibration', 'flow']
  const statuses: MonitorStatus[] = ['normal', 'warning', 'alarm', 'offline']
  const units: Record<MonitorType, string> = {
    temperature: '°C',
    humidity: '%',
    pressure: 'MPa',
    vibration: 'mm/s',
    flow: 'm³/h'
  }
  
  const thresholds: Record<MonitorType, { min: number; max: number; range: number }> = {
    temperature: { min: 20, max: 80, range: 100 },
    humidity: { min: 30, max: 70, range: 100 },
    pressure: { min: 0.5, max: 2.0, range: 3 },
    vibration: { min: 0, max: 5, range: 10 },
    flow: { min: 50, max: 200, range: 300 }
  }
  
  // 使用固定种子生成稳定的 ID，避免每次调用生成不同的 ID
  return monitorNames.map((name, index) => {
    const type = types[index % types.length]
    const status = statuses[Math.floor(Math.random() * 10) < 7 ? 0 : Math.floor(Math.random() * 4)]
    const threshold = thresholds[type]
    const currentValue = threshold.min + Math.random() * (threshold.max - threshold.min)
    
    return {
      id: `monitor_${index + 1}`, // 使用固定 ID 格式
      name,
      code: `MP${String(index + 1).padStart(3, '0')}`,
      type,
      status,
      location: `${['A', 'B', 'C'][index % 3]}区-${Math.floor(index / 3) + 1}号`,
      description: `${name}监测点`,
      currentValue: Number(currentValue.toFixed(2)),
      unit: units[type],
      minThreshold: threshold.min,
      maxThreshold: threshold.max,
      updateTime: randomDate(new Date(Date.now() - 3600000), new Date()),
      createTime: randomDate(new Date('2024-01-01'), new Date('2024-06-01'))
    }
  })
}

/**
 * 生成模拟历史数据
 * 
 * 用途：为指定监测点生成历史趋势数据，用于图表展示
 * 
 * @param {string} monitorId - 监测点 ID
 * @param {number} days - 生成多少天的历史数据，默认 7 天
 * @returns {MonitorData[]} 历史数据数组，按时间倒序排列
 */
export function generateMockHistoryData(monitorId: string, days: number = 7): MonitorData[] {
  const data: MonitorData[] = []
  const now = Date.now()
  const interval = 3600000 // 1小时
  const count = days * 24
  
  let baseValue = 50 + Math.random() * 30
  
  for (let i = 0; i < count; i++) {
    // 添加一些随机波动和趋势
    const trend = Math.sin(i / 24 * Math.PI) * 5
    const noise = (Math.random() - 0.5) * 10
    const value = baseValue + trend + noise
    
    data.push({
      id: generateId(),
      monitorId,
      value: Number(Math.max(0, value).toFixed(2)),
      timestamp: new Date(now - (count - i) * interval).toISOString()
    })
    
    // 缓慢漂移
    baseValue += (Math.random() - 0.5) * 0.5
  }
  
  return data
}

/**
 * 生成模拟报警记录
 * 
 * 用途：生成报警历史记录，包含不同级别和状态的报警
 * 
 * @param {number} count - 生成的报警记录数量，默认 20 条
 * @returns {AlarmRecord[]} 报警记录数组，按触发时间倒序排列
 */
export function generateMockAlarmRecords(count: number = 20): AlarmRecord[] {
  const levels: AlarmLevel[] = ['low', 'medium', 'high', 'critical']
  const statuses: AlarmStatus[] = ['active', 'acknowledged', 'resolved']
  const monitors = generateMockMonitors()
  
  return Array.from({ length: count }, (_, index) => {
    const monitor = monitors[Math.floor(Math.random() * monitors.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const triggerTime = randomDate(new Date(Date.now() - 7 * 24 * 3600000), new Date())
    
    return {
      id: `alarm_${index + 1}`, // 使用固定 ID
      monitorId: monitor.id,
      monitorName: monitor.name,
      level,
      status,
      value: Number((monitor.maxThreshold + Math.random() * 10).toFixed(2)),
      threshold: monitor.maxThreshold,
      message: `${monitor.name}超过阈值`,
      triggerTime,
      acknowledgeTime: status !== 'active' ? randomDate(new Date(triggerTime), new Date()) : undefined,
      resolveTime: status === 'resolved' ? randomDate(new Date(triggerTime), new Date()) : undefined,
      handler: status !== 'active' ? ['张三', '李四', '王五'][Math.floor(Math.random() * 3)] : undefined
    }
  }).sort((a, b) => new Date(b.triggerTime).getTime() - new Date(a.triggerTime).getTime())
}

/**
 * 生成模拟报警配置
 * 
 * 用途：为每个监测点生成报警配置，包含阈值和通知设置
 * 
 * @returns {AlarmConfig[]} 报警配置数组
 */
export function generateMockAlarmConfigs(): AlarmConfig[] {
  const monitors = generateMockMonitors()
  
  return monitors.map((monitor, index) => {
    const range = monitor.maxThreshold - monitor.minThreshold
    return {
      id: `alarm_config_${index + 1}`, // 使用固定 ID
      monitorId: monitor.id,
      monitorName: monitor.name,
      enabled: Math.random() > 0.2,
      lowThreshold: Number(monitor.minThreshold.toFixed(2)),
      highThreshold: Number(monitor.maxThreshold.toFixed(2)),
      warningThreshold: Number((monitor.minThreshold + range * 0.7).toFixed(2)),
      criticalThreshold: Number((monitor.minThreshold + range * 0.9).toFixed(2)),
      notifyEmail: Math.random() > 0.3,
      notifySms: Math.random() > 0.5,
      notifyPush: Math.random() > 0.4,
      cooldownMinutes: [5, 10, 15, 30][Math.floor(Math.random() * 4)],
      updateTime: randomDate(new Date('2024-01-01'), new Date())
    }
  })
}
