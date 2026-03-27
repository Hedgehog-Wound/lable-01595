import { ref, onMounted } from 'vue'
import type { MonitorPoint, MonitorData } from '@/types/monitor'
import { getMonitorList, getMonitorHistory } from '@/api/monitor'

export function useMonitor() {
  const monitors = ref<MonitorPoint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMonitors() {
    loading.value = true
    error.value = null
    try {
      monitors.value = await getMonitorList()
    } catch (e) {
      error.value = '获取监测点列表失败'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchMonitors)

  return {
    monitors,
    loading,
    error,
    fetchMonitors
  }
}

export function useMonitorHistory(monitorId: string) {
  const historyData = ref<MonitorData[]>([])
  const loading = ref(false)

  async function fetchHistory(days: number = 7) {
    loading.value = true
    try {
      historyData.value = await getMonitorHistory(monitorId, days)
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    historyData,
    loading,
    fetchHistory
  }
}
