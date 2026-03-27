import { ref, onMounted } from 'vue'
import type { AlarmRecord, AlarmConfig } from '@/types/alarm'
import { getAlarmRecords, getAlarmConfigs, acknowledgeAlarm, resolveAlarm } from '@/api/alarm'
import { ElMessage } from 'element-plus'

export function useAlarmRecords() {
  const records = ref<AlarmRecord[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(10)

  async function fetchRecords(params?: { status?: string; level?: string }) {
    loading.value = true
    try {
      const result = await getAlarmRecords({
        page: page.value,
        pageSize: pageSize.value,
        ...params
      })
      records.value = result.list
      total.value = result.total
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function handleAcknowledge(id: string) {
    try {
      await acknowledgeAlarm(id)
      ElMessage.success('已确认报警')
      await fetchRecords()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }

  async function handleResolve(id: string) {
    try {
      await resolveAlarm(id)
      ElMessage.success('已解决报警')
      await fetchRecords()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  }

  onMounted(() => fetchRecords())

  return {
    records,
    total,
    loading,
    page,
    pageSize,
    fetchRecords,
    handleAcknowledge,
    handleResolve
  }
}

export function useAlarmConfigs() {
  const configs = ref<AlarmConfig[]>([])
  const loading = ref(false)

  async function fetchConfigs() {
    loading.value = true
    try {
      configs.value = await getAlarmConfigs()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchConfigs)

  return {
    configs,
    loading,
    fetchConfigs
  }
}
