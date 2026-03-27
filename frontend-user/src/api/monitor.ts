import type { MonitorPoint, MonitorData, MonitorForm } from '@/types/monitor'
import { generateMockMonitors, generateMockHistoryData } from '@/utils/mockData'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 获取监测点列表
export async function getMonitorList(): Promise<MonitorPoint[]> {
  await delay(300)
  return generateMockMonitors()
}

// 获取监测点详情
export async function getMonitorDetail(id: string): Promise<MonitorPoint | null> {
  await delay(200)
  const monitors = generateMockMonitors()
  return monitors.find(m => m.id === id) || null
}

// 获取监测点历史数据
export async function getMonitorHistory(id: string, days: number = 7): Promise<MonitorData[]> {
  await delay(400)
  return generateMockHistoryData(id, days)
}

// 创建监测点
export async function createMonitor(data: MonitorForm): Promise<MonitorPoint> {
  await delay(300)
  return {
    id: Math.random().toString(36).slice(2, 11),
    ...data,
    status: 'normal',
    currentValue: 0,
    updateTime: new Date().toISOString(),
    createTime: new Date().toISOString()
  }
}

// 更新监测点
export async function updateMonitor(id: string, data: Partial<MonitorForm>): Promise<boolean> {
  await delay(300)
  console.log('Update monitor:', id, data)
  return true
}

// 删除监测点
export async function deleteMonitor(id: string): Promise<boolean> {
  await delay(200)
  console.log('Delete monitor:', id)
  return true
}
