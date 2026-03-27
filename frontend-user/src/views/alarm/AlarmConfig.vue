<template>
  <div class="alarm-config page-container">
    <div class="card">
      <div class="card-header">
        <span class="title">报警配置</span>
        <div class="header-actions">
          <el-button :icon="Refresh" @click="fetchConfigs">刷新</el-button>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="configs"
        stripe
      >
        <el-table-column prop="monitorName" label="监测点" min-width="150" />
        <el-table-column prop="enabled" label="启用" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="阈值范围" width="150">
          <template #default="{ row }">
            {{ formatNumber(row.lowThreshold) }} - {{ formatNumber(row.highThreshold) }}
          </template>
        </el-table-column>
        <el-table-column label="预警阈值" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.warningThreshold) }}
          </template>
        </el-table-column>
        <el-table-column label="严重阈值" width="100">
          <template #default="{ row }">
            {{ formatNumber(row.criticalThreshold) }}
          </template>
        </el-table-column>
        <el-table-column label="通知方式" width="150">
          <template #default="{ row }">
            <el-space>
              <el-tag v-if="row.notifyEmail" size="small">邮件</el-tag>
              <el-tag v-if="row.notifySms" size="small">短信</el-tag>
              <el-tag v-if="row.notifyPush" size="small">推送</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="cooldownMinutes" label="冷却时间" width="100">
          <template #default="{ row }">
            {{ row.cooldownMinutes }}分钟
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑报警配置"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="监测点">
          <el-input :value="editingConfig?.monitorName" disabled />
        </el-form-item>
        <el-form-item label="启用报警">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <el-form-item label="下限阈值" prop="lowThreshold">
          <el-input-number 
            v-model="form.lowThreshold" 
            :precision="2" 
            style="width: 100%" 
            @change="handleThresholdChange('lowThreshold')"
          />
        </el-form-item>
        <el-form-item label="上限阈值" prop="highThreshold">
          <el-input-number 
            v-model="form.highThreshold" 
            :precision="2" 
            style="width: 100%" 
            @change="handleThresholdChange('highThreshold')"
          />
        </el-form-item>
        <el-form-item label="预警阈值" prop="warningThreshold">
          <el-input-number 
            v-model="form.warningThreshold" 
            :precision="2" 
            style="width: 100%" 
            @change="handleThresholdChange('warningThreshold')"
          />
        </el-form-item>
        <el-form-item label="严重阈值" prop="criticalThreshold">
          <el-input-number 
            v-model="form.criticalThreshold" 
            :precision="2" 
            style="width: 100%" 
            @change="handleThresholdChange('criticalThreshold')"
          />
        </el-form-item>
        <el-form-item label="通知方式">
          <el-checkbox v-model="form.notifyEmail">邮件</el-checkbox>
          <el-checkbox v-model="form.notifySms">短信</el-checkbox>
          <el-checkbox v-model="form.notifyPush">推送</el-checkbox>
        </el-form-item>
        <el-form-item label="冷却时间" prop="cooldownMinutes">
          <el-select v-model="form.cooldownMinutes" style="width: 100%">
            <el-option :value="5" label="5分钟" />
            <el-option :value="10" label="10分钟" />
            <el-option :value="15" label="15分钟" />
            <el-option :value="30" label="30分钟" />
            <el-option :value="60" label="60分钟" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAlarmConfigs, updateAlarmConfig } from '@/api/alarm'
import type { AlarmConfig, AlarmConfigForm } from '@/types/alarm'
import { useMonitorStore } from '@/stores/monitor'

const monitorStore = useMonitorStore()

const loading = ref(false)
const configs = ref<AlarmConfig[]>([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const editingConfig = ref<AlarmConfig | null>(null)

const form = reactive<AlarmConfigForm>({
  enabled: true,
  lowThreshold: 0,
  highThreshold: 100,
  warningThreshold: 70,
  criticalThreshold: 90,
  notifyEmail: true,
  notifySms: false,
  notifyPush: true,
  cooldownMinutes: 10
})

const rules: FormRules = {
  lowThreshold: [
    { required: true, message: '请输入下限阈值', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value == null) {
          callback(new Error('请输入下限阈值'))
        } else if (form.highThreshold != null && value >= form.highThreshold) {
          callback(new Error('下限阈值必须小于上限阈值'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  highThreshold: [
    { required: true, message: '请输入上限阈值', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value == null) {
          callback(new Error('请输入上限阈值'))
        } else if (form.lowThreshold != null && value <= form.lowThreshold) {
          callback(new Error('上限阈值必须大于下限阈值'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  warningThreshold: [
    { required: true, message: '请输入预警阈值', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value == null) {
          callback(new Error('请输入预警阈值'))
        } else if (form.lowThreshold != null && value < form.lowThreshold) {
          callback(new Error('预警阈值不能小于下限阈值'))
        } else if (form.highThreshold != null && value > form.highThreshold) {
          callback(new Error('预警阈值不能大于上限阈值'))
        } else if (form.criticalThreshold != null && value > form.criticalThreshold) {
          callback(new Error('预警阈值必须小于等于严重阈值'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  criticalThreshold: [
    { required: true, message: '请输入严重阈值', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value == null) {
          callback(new Error('请输入严重阈值'))
        } else if (form.lowThreshold != null && value < form.lowThreshold) {
          callback(new Error('严重阈值不能小于下限阈值'))
        } else if (form.highThreshold != null && value > form.highThreshold) {
          callback(new Error('严重阈值不能大于上限阈值'))
        } else if (form.warningThreshold != null && value < form.warningThreshold) {
          callback(new Error('严重阈值必须大于等于预警阈值'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

async function fetchConfigs() {
  loading.value = true
  try {
    configs.value = await getAlarmConfigs()
    
    // 同步监测点的阈值到报警配置
    configs.value.forEach(config => {
      const monitor = monitorStore.monitors.find(m => m.id === config.monitorId)
      if (monitor) {
        config.lowThreshold = monitor.minThreshold
        config.highThreshold = monitor.maxThreshold
      }
    })
  } finally {
    loading.value = false
  }
}

function handleToggle(row: AlarmConfig) {
  ElMessage.success(`已${row.enabled ? '启用' : '禁用'}报警`)
}

function handleEdit(row: AlarmConfig) {
  editingConfig.value = row
  Object.assign(form, {
    enabled: row.enabled,
    lowThreshold: row.lowThreshold,
    highThreshold: row.highThreshold,
    warningThreshold: row.warningThreshold,
    criticalThreshold: row.criticalThreshold,
    notifyEmail: row.notifyEmail,
    notifySms: row.notifySms,
    notifyPush: row.notifyPush,
    cooldownMinutes: row.cooldownMinutes
  })
  dialogVisible.value = true
}

// 阈值变化时触发相关字段的验证
function handleThresholdChange(field: string) {
  if (!formRef.value) return
  
  // 根据改变的字段，验证相关联的字段
  const relatedFields: Record<string, string[]> = {
    lowThreshold: ['highThreshold', 'warningThreshold', 'criticalThreshold'],
    highThreshold: ['lowThreshold', 'warningThreshold', 'criticalThreshold'],
    warningThreshold: ['criticalThreshold'],
    criticalThreshold: ['warningThreshold']
  }
  
  // 验证当前字段
  formRef.value.validateField(field)
  
  // 验证相关字段
  const fieldsToValidate = relatedFields[field] || []
  fieldsToValidate.forEach(f => {
    formRef.value?.validateField(f)
  })
}

// 重置表单
function resetForm() {
  if (formRef.value) {
    formRef.value.resetFields()
    formRef.value.clearValidate()
  }
  editingConfig.value = null
}

// 取消按钮
function handleCancel() {
  dialogVisible.value = false
  resetForm()
}

// 对话框关闭时
function handleDialogClose() {
  resetForm()
}

async function handleSubmit() {
  if (!formRef.value || !editingConfig.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      await updateAlarmConfig(editingConfig.value!.id, form)
      
      // 更新本地数据
      const index = configs.value.findIndex(c => c.id === editingConfig.value!.id)
      if (index !== -1) {
        configs.value[index] = { ...configs.value[index], ...form }
      }
      
      // 同步更新监测点阈值
      monitorStore.updateMonitorThresholds(editingConfig.value!.monitorId, {
        minThreshold: form.lowThreshold,
        maxThreshold: form.highThreshold
      })
      
      ElMessage.success('保存成功')
      dialogVisible.value = false
      resetForm()
    } finally {
      submitLoading.value = false
    }
  })
}

// 格式化数字显示
function formatNumber(value: number): string {
  if (value == null) return '-'
  return Number(value.toFixed(2)).toString()
}

onMounted(fetchConfigs)

// 页面激活时刷新数据（从其他页面切换回来时）
onActivated(fetchConfigs)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.alarm-config {
  .header-actions {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
