// 报警级别
export type AlarmLevel = 'low' | 'medium' | 'high' | 'critical'

// 报警状态
export type AlarmStatus = 'active' | 'acknowledged' | 'resolved'

// 报警记录
export interface AlarmRecord {
  id: string
  monitorId: string
  monitorName: string
  level: AlarmLevel
  status: AlarmStatus
  value: number
  threshold: number
  message: string
  triggerTime: string
  acknowledgeTime?: string
  resolveTime?: string
  handler?: string
}

// 报警配置
export interface AlarmConfig {
  id: string
  monitorId: string
  monitorName: string
  enabled: boolean
  lowThreshold: number
  highThreshold: number
  warningThreshold: number
  criticalThreshold: number
  notifyEmail: boolean
  notifySms: boolean
  notifyPush: boolean
  cooldownMinutes: number
  updateTime: string
}

// 报警配置表单
export interface AlarmConfigForm {
  enabled: boolean
  lowThreshold: number
  highThreshold: number
  warningThreshold: number
  criticalThreshold: number
  notifyEmail: boolean
  notifySms: boolean
  notifyPush: boolean
  cooldownMinutes: number
}

// 报警级别选项
export const alarmLevelOptions = [
  { label: '低', value: 'low', color: '#67c23a' },
  { label: '中', value: 'medium', color: '#e6a23c' },
  { label: '高', value: 'high', color: '#f56c6c' },
  { label: '严重', value: 'critical', color: '#f56c6c' }
]

// 报警状态选项
export const alarmStatusOptions = [
  { label: '活跃', value: 'active', color: '#f56c6c' },
  { label: '已确认', value: 'acknowledged', color: '#e6a23c' },
  { label: '已解决', value: 'resolved', color: '#67c23a' }
]

// 自动调参参数
export interface TuningParams {
  monitorId: string
  algorithm: 'statistical' | 'adaptive' | 'ml'
  sensitivity: number
  historyDays: number
  confidenceLevel: number
}

// 调参结果
export interface TuningResult {
  monitorId: string
  monitorName: string
  originalLow: number
  originalHigh: number
  suggestedLow: number
  suggestedHigh: number
  confidence: number
  reason: string
  applied: boolean
}
