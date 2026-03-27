// 监测点状态
export type MonitorStatus = 'normal' | 'warning' | 'alarm' | 'offline'

// 监测点类型
export type MonitorType = 'temperature' | 'humidity' | 'pressure' | 'vibration' | 'flow'

// 监测点信息
export interface MonitorPoint {
  id: string
  name: string
  code: string
  type: MonitorType
  status: MonitorStatus
  location: string
  description: string
  currentValue: number
  unit: string
  minThreshold: number
  maxThreshold: number
  updateTime: string
  createTime: string
}

// 监测数据
export interface MonitorData {
  id: string
  monitorId: string
  value: number
  timestamp: string
}

// 监测点表单
export interface MonitorForm {
  name: string
  code: string
  type: MonitorType
  location: string
  description: string
  unit: string
  minThreshold: number
  maxThreshold: number
}

// 监测点统计
export interface MonitorStats {
  total: number
  normal: number
  warning: number
  alarm: number
  offline: number
}

// 监测类型选项
export const monitorTypeOptions = [
  { label: '温度', value: 'temperature', unit: '°C' },
  { label: '湿度', value: 'humidity', unit: '%' },
  { label: '压力', value: 'pressure', unit: 'MPa' },
  { label: '振动', value: 'vibration', unit: 'mm/s' },
  { label: '流量', value: 'flow', unit: 'm³/h' }
]

// 状态选项
export const statusOptions = [
  { label: '正常', value: 'normal', color: '#67c23a' },
  { label: '预警', value: 'warning', color: '#e6a23c' },
  { label: '报警', value: 'alarm', color: '#f56c6c' },
  { label: '离线', value: 'offline', color: '#909399' }
]
