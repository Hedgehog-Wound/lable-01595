import type { AlarmRecord, AlarmConfig, AlarmConfigForm } from '@/types/alarm'
import { generateMockAlarmRecords, generateMockAlarmConfigs } from '@/utils/mockData'
import { getStorage, setStorage } from '@/utils/storage'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 获取报警记录列表
export async function getAlarmRecords(params?: {
  page?: number
  pageSize?: number
  status?: string
  level?: string
}): Promise<{ list: AlarmRecord[]; total: number }> {
  await delay(300)
  let records = generateMockAlarmRecords(50)
  
  if (params?.status) {
    records = records.filter(r => r.status === params.status)
  }
  if (params?.level) {
    records = records.filter(r => r.level === params.level)
  }
  
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const start = (page - 1) * pageSize
  
  return {
    list: records.slice(start, start + pageSize),
    total: records.length
  }
}

// 确认报警
export async function acknowledgeAlarm(id: string): Promise<boolean> {
  await delay(200)
  console.log('Acknowledge alarm:', id)
  return true
}

// 解决报警
export async function resolveAlarm(id: string): Promise<boolean> {
  await delay(200)
  console.log('Resolve alarm:', id)
  return true
}

// 获取报警配置列表
export async function getAlarmConfigs(): Promise<AlarmConfig[]> {
  await delay(300)
  
  // 从 localStorage 读取保存的配置
  const savedConfigs = getStorage<AlarmConfig[]>('alarmConfigs')
  
  // 如果有保存的配置，使用保存的配置
  if (savedConfigs && savedConfigs.length > 0) {
    return savedConfigs
  }
  
  // 否则生成新的配置并保存
  const configs = generateMockAlarmConfigs()
  setStorage('alarmConfigs', configs)
  return configs
}

// 更新报警配置
export async function updateAlarmConfig(id: string, data: AlarmConfigForm): Promise<boolean> {
  await delay(300)
  
  // 获取当前所有配置
  const configs = getStorage<AlarmConfig[]>('alarmConfigs') || []
  
  // 找到并更新指定配置
  const index = configs.findIndex(c => c.id === id)
  if (index !== -1) {
    configs[index] = {
      ...configs[index],
      ...data,
      updateTime: new Date().toISOString()
    }
    
    // 保存到 localStorage
    setStorage('alarmConfigs', configs)
    return true
  }
  
  return false
}

// 通过监测点ID更新报警配置
export async function updateAlarmConfigByMonitorId(monitorId: string, data: Partial<AlarmConfigForm>): Promise<boolean> {
  await delay(300)
  
  // 获取当前所有配置
  const configs = getStorage<AlarmConfig[]>('alarmConfigs') || []
  
  // 找到并更新指定监测点的配置
  const index = configs.findIndex(c => c.monitorId === monitorId)
  if (index !== -1) {
    configs[index] = {
      ...configs[index],
      ...data,
      updateTime: new Date().toISOString()
    }
    
    // 保存到 localStorage
    setStorage('alarmConfigs', configs)
    return true
  }
  
  return false
}

// 批量更新报警配置
export async function batchUpdateAlarmConfigs(
  ids: string[],
  data: Partial<AlarmConfigForm>
): Promise<boolean> {
  await delay(400)
  
  // 获取当前所有配置
  const configs = getStorage<AlarmConfig[]>('alarmConfigs') || []
  
  // 批量更新
  ids.forEach(id => {
    const index = configs.findIndex(c => c.id === id)
    if (index !== -1) {
      configs[index] = {
        ...configs[index],
        ...data,
        updateTime: new Date().toISOString()
      }
    }
  })
  
  // 保存到 localStorage
  setStorage('alarmConfigs', configs)
  return true
}

// 批量通过监测点ID更新报警配置
export async function batchUpdateAlarmConfigsByMonitorIds(
  updates: Array<{ monitorId: string; data: Partial<AlarmConfigForm> }>
): Promise<boolean> {
  await delay(400)
  
  // 获取当前所有配置
  const configs = getStorage<AlarmConfig[]>('alarmConfigs') || []
  
  // 批量更新
  updates.forEach(({ monitorId, data }) => {
    const index = configs.findIndex(c => c.monitorId === monitorId)
    if (index !== -1) {
      configs[index] = {
        ...configs[index],
        ...data,
        updateTime: new Date().toISOString()
      }
    }
  })
  
  // 保存到 localStorage
  setStorage('alarmConfigs', configs)
  return true
}
