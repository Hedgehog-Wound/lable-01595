/**
 * 监测点状态管理
 * 
 * 功能说明：
 * 1. 管理监测点的增删改查操作
 * 2. 提供监测点统计数据
 * 3. 支持数据持久化到 localStorage
 * 4. 支持批量操作和阈值管理
 * 
 * 数据持久化策略：
 * - 所有监测点的增删改操作都会自动保存到 localStorage
 * - 首次加载时，优先从 localStorage 读取数据
 * - 如果 localStorage 无数据，则生成初始 mock 数据
 * - 用户可以通过清空缓存来重置数据
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MonitorPoint, MonitorStats } from '@/types/monitor'
import { generateMockMonitors } from '@/utils/mockData'
import { getStorage, setStorage } from '@/utils/storage'

const STORAGE_KEY = 'monitors'

export const useMonitorStore = defineStore('monitor', () => {
  const monitors = ref<MonitorPoint[]>([])
  const loading = ref(false)
  const currentMonitor = ref<MonitorPoint | null>(null)

  // 统计数据
  const stats = computed<MonitorStats>(() => {
    return {
      total: monitors.value.length,
      normal: monitors.value.filter(m => m.status === 'normal').length,
      warning: monitors.value.filter(m => m.status === 'warning').length,
      alarm: monitors.value.filter(m => m.status === 'alarm').length,
      offline: monitors.value.filter(m => m.status === 'offline').length
    }
  })

  /**
   * 保存监测点数据到 localStorage
   * 内部方法，在每次数据变更后自动调用
   */
  function saveToStorage() {
    setStorage(STORAGE_KEY, monitors.value)
  }

  /**
   * 获取监测点列表
   * 
   * 数据加载优先级：
   * 1. 从 localStorage 读取已保存的数据
   * 2. 如果无数据，生成初始 mock 数据并保存
   */
  async function fetchMonitors() {
    loading.value = true
    try {
      // 模拟 API 请求延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 从 localStorage 读取保存的监测点（数据永久有效）
      const savedMonitors = getStorage<MonitorPoint[]>(STORAGE_KEY, 0)
      
      if (savedMonitors && savedMonitors.length > 0) {
        monitors.value = savedMonitors
        console.log(`✓ 从缓存加载了 ${savedMonitors.length} 个监测点`)
      } else {
        // 首次加载，生成 mock 数据并保存
        monitors.value = generateMockMonitors()
        saveToStorage()
        console.log(`✓ 生成并保存了 ${monitors.value.length} 个初始监测点`)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取单个监测点详情
   * 
   * @param {string} id - 监测点 ID
   * @returns {Promise<MonitorPoint | null>} 监测点对象或 null
   */
  async function fetchMonitor(id: string) {
    loading.value = true
    try {
      // 如果 monitors 为空，先加载列表
      if (monitors.value.length === 0) {
        await fetchMonitors()
      }
      currentMonitor.value = monitors.value.find(m => m.id === id) || null
      return currentMonitor.value
    } finally {
      loading.value = false
    }
  }

  /**
   * 新增监测点
   * 
   * @param {Omit<MonitorPoint, 'id'>} data - 监测点数据（不含 ID）
   * @returns {Promise<boolean>} 是否成功
   */
  async function addMonitor(data: Omit<MonitorPoint, 'id'>) {
    // 模拟 API 请求
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newMonitor: MonitorPoint = {
      ...data,
      id: `monitor_${Date.now()}`,
      createTime: new Date().toISOString()
    }
    
    monitors.value.unshift(newMonitor)
    saveToStorage()
    
    console.log(`✓ 新增监测点: ${newMonitor.name} (ID: ${newMonitor.id})`)
    return true
  }

  /**
   * 更新监测点
   * 
   * @param {string} id - 监测点 ID
   * @param {Partial<MonitorPoint>} data - 要更新的字段
   * @returns {Promise<boolean>} 是否成功
   */
  async function updateMonitor(id: string, data: Partial<MonitorPoint>) {
    // 模拟 API 请求
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = monitors.value.findIndex(m => m.id === id)
    if (index !== -1) {
      monitors.value[index] = { 
        ...monitors.value[index], 
        ...data,
        updateTime: new Date().toISOString()
      }
      saveToStorage()
      
      console.log(`✓ 更新监测点: ${monitors.value[index].name} (ID: ${id})`)
      return true
    }
    
    console.warn(`✗ 未找到监测点 ID: ${id}`)
    return false
  }

  /**
   * 删除监测点
   * 
   * @param {string} id - 监测点 ID
   * @returns {Promise<boolean>} 是否成功
   */
  async function deleteMonitor(id: string) {
    const index = monitors.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const deletedMonitor = monitors.value[index]
      monitors.value.splice(index, 1)
      saveToStorage()
      
      console.log(`✓ 删除监测点: ${deletedMonitor.name} (ID: ${id})`)
      return true
    }
    
    console.warn(`✗ 未找到监测点 ID: ${id}`)
    return false
  }

  /**
   * 更新监测点阈值
   * 
   * @param {string} id - 监测点 ID
   * @param {object} thresholds - 阈值对象
   * @returns {boolean} 是否成功
   */
  function updateMonitorThresholds(id: string, thresholds: { minThreshold: number; maxThreshold: number }) {
    const index = monitors.value.findIndex(m => m.id === id)
    if (index !== -1) {
      monitors.value[index] = {
        ...monitors.value[index],
        minThreshold: thresholds.minThreshold,
        maxThreshold: thresholds.maxThreshold,
        updateTime: new Date().toISOString()
      }
      saveToStorage()
      
      console.log(`✓ 更新阈值: ${monitors.value[index].name} (${thresholds.minThreshold} - ${thresholds.maxThreshold})`)
      return true
    }
    
    console.warn(`✗ 未找到监测点 ID: ${id}`)
    return false
  }

  /**
   * 批量更新监测点阈值
   * 
   * @param {Array} updates - 更新数组
   */
  function batchUpdateMonitorThresholds(updates: Array<{ id: string; minThreshold: number; maxThreshold: number }>) {
    let successCount = 0
    
    updates.forEach(update => {
      const index = monitors.value.findIndex(m => m.id === update.id)
      if (index !== -1) {
        monitors.value[index] = {
          ...monitors.value[index],
          minThreshold: update.minThreshold,
          maxThreshold: update.maxThreshold,
          updateTime: new Date().toISOString()
        }
        successCount++
      }
    })
    
    if (successCount > 0) {
      saveToStorage()
      console.log(`✓ 批量更新了 ${successCount} 个监测点的阈值`)
    }
  }

  /**
   * 重置监测点数据
   * 清空 localStorage 并重新生成初始数据
   */
  function resetMonitors() {
    monitors.value = generateMockMonitors()
    saveToStorage()
    console.log('✓ 已重置监测点数据')
  }

  return {
    monitors,
    loading,
    currentMonitor,
    stats,
    fetchMonitors,
    fetchMonitor,
    addMonitor,
    updateMonitor,
    deleteMonitor,
    updateMonitorThresholds,
    batchUpdateMonitorThresholds,
    resetMonitors
  }
})
