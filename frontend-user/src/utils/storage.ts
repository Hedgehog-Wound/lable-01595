/**
 * 本地存储工具
 * 
 * 功能说明：
 * 1. 提供统一的 localStorage 操作接口
 * 2. 自动添加应用前缀，避免与其他应用数据冲突
 * 3. 支持数据版本管理，便于数据迁移和升级
 * 4. 提供错误处理和数据验证
 * 
 * 数据持久化策略：
 * - 监测点数据（monitors）：用户添加/修改的监测点会持久化保存
 * - 报警配置（alarm_configs）：报警规则配置会持久化保存
 * - 用户设置（user_settings）：用户偏好设置会持久化保存
 * - 历史数据（history_data）：可选持久化，建议从后端实时获取
 */

const PREFIX = 'alarm_system_'
const VERSION_KEY = PREFIX + 'version'
const CURRENT_VERSION = '1.0.0'

/**
 * 初始化存储版本
 * 用于数据迁移和版本管理
 */
function initStorageVersion(): void {
  const version = localStorage.getItem(VERSION_KEY)
  if (!version) {
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
  }
}

// 初始化版本
initStorageVersion()

/**
 * 保存数据到 localStorage
 * 
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的数据（会自动序列化为 JSON）
 * @param {boolean} withTimestamp - 是否添加时间戳，默认 true
 */
export function setStorage(key: string, value: any, withTimestamp: boolean = true): void {
  try {
    const dataToStore = withTimestamp 
      ? { data: value, timestamp: Date.now() }
      : value
    
    const jsonString = JSON.stringify(dataToStore)
    localStorage.setItem(PREFIX + key, jsonString)
  } catch (e) {
    console.error('Storage setItem error:', e)
    // 如果存储空间不足，尝试清理过期数据
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting to clear old data')
      clearExpiredData()
    }
  }
}

/**
 * 从 localStorage 读取数据
 * 
 * @param {string} key - 存储键名
 * @param {number} maxAge - 数据最大有效期（毫秒），0 表示永久有效
 * @returns {T | null} 返回存储的数据，如果不存在或已过期则返回 null
 */
export function getStorage<T = any>(key: string, maxAge: number = 0): T | null {
  try {
    const jsonString = localStorage.getItem(PREFIX + key)
    if (!jsonString) return null
    
    const stored = JSON.parse(jsonString)
    
    // 如果数据包含时间戳，检查是否过期
    if (stored && typeof stored === 'object' && 'timestamp' in stored) {
      if (maxAge > 0 && Date.now() - stored.timestamp > maxAge) {
        removeStorage(key)
        return null
      }
      return stored.data as T
    }
    
    return stored as T
  } catch (e) {
    console.error('Storage getItem error:', e)
    return null
  }
}

/**
 * 删除指定的存储数据
 * 
 * @param {string} key - 存储键名
 */
export function removeStorage(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

/**
 * 清空所有应用相关的存储数据
 */
export function clearStorage(): void {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * 清理过期数据
 * 当存储空间不足时自动调用
 */
function clearExpiredData(): void {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(PREFIX) && key !== VERSION_KEY) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed = JSON.parse(data)
          // 清理超过 30 天的数据
          if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 24 * 3600 * 1000) {
            localStorage.removeItem(key)
          }
        }
      } catch (e) {
        // 如果解析失败，删除该数据
        localStorage.removeItem(key)
      }
    }
  })
}

/**
 * 获取存储使用情况
 * 
 * @returns {object} 包含已使用空间和总空间的对象
 */
export function getStorageInfo(): { used: number; total: number; percentage: number } {
  let used = 0
  const keys = Object.keys(localStorage)
  
  keys.forEach(key => {
    if (key.startsWith(PREFIX)) {
      const value = localStorage.getItem(key)
      if (value) {
        used += key.length + value.length
      }
    }
  })
  
  // localStorage 通常限制为 5-10MB，这里假设 5MB
  const total = 5 * 1024 * 1024
  const percentage = (used / total) * 100
  
  return { used, total, percentage }
}

/**
 * 导出所有存储数据（用于备份）
 * 
 * @returns {object} 包含所有应用数据的对象
 */
export function exportStorage(): Record<string, any> {
  const data: Record<string, any> = {}
  const keys = Object.keys(localStorage)
  
  keys.forEach(key => {
    if (key.startsWith(PREFIX)) {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          data[key.replace(PREFIX, '')] = JSON.parse(value)
        } catch (e) {
          data[key.replace(PREFIX, '')] = value
        }
      }
    }
  })
  
  return data
}

/**
 * 导入存储数据（用于恢复备份）
 * 
 * @param {object} data - 要导入的数据对象
 */
export function importStorage(data: Record<string, any>): void {
  Object.entries(data).forEach(([key, value]) => {
    setStorage(key, value)
  })
}
