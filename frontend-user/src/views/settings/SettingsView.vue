<template>
  <div class="settings-page page-container">
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 安全设置 -->
      <el-tab-pane label="安全设置" name="security">
        <div class="card">
          <div class="card-header">
            <span class="title">修改密码</span>
          </div>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            style="max-width: 500px"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      
      <!-- 通知设置 -->
      <el-tab-pane label="通知设置" name="notification">
        <div class="card">
          <div class="card-header">
            <span class="title">通知偏好</span>
          </div>
          <div class="notification-settings">
            <div class="setting-item">
              <div class="setting-info">
                <h4>邮件通知</h4>
                <p>接收报警邮件通知</p>
              </div>
              <el-switch v-model="notificationSettings.email" />
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>短信通知</h4>
                <p>接收报警短信通知</p>
              </div>
              <el-switch v-model="notificationSettings.sms" />
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>浏览器推送</h4>
                <p>接收浏览器推送通知</p>
              </div>
              <el-switch v-model="notificationSettings.push" />
            </div>
            <div class="setting-item quiet-hours-item">
              <div class="setting-info">
                <h4>免打扰时段</h4>
                <p>设置不接收通知的时间段</p>
              </div>
              <div class="quiet-hours-picker">
                <el-time-select
                  v-model="notificationSettings.quietStart"
                  :max-time="notificationSettings.quietEnd"
                  placeholder="开始时间"
                  start="00:00"
                  step="00:30"
                  end="23:30"
                  style="width: 120px"
                />
                <span class="time-separator">至</span>
                <el-time-select
                  v-model="notificationSettings.quietEnd"
                  :min-time="notificationSettings.quietStart"
                  placeholder="结束时间"
                  start="00:00"
                  step="00:30"
                  end="23:30"
                  style="width: 120px"
                />
              </div>
            </div>
          </div>
          <el-button type="primary" style="margin-top: 24px" @click="saveNotification">
            保存设置
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { setStorage, getStorage } from '@/utils/storage'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const activeTab = ref('security')

// 密码表单
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (_rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

// 通知设置
const notificationSettings = reactive({
  email: true,
  sms: false,
  push: true,
  quietStart: '22:00',
  quietEnd: '08:00'
})

function changePassword() {
  passwordFormRef.value?.validate(async (valid) => {
    if (valid) {
      const username = userStore.userInfo?.username
      if (!username) return
      
      // 获取存储的密码对象
      const storedPasswords = getStorage('userPassword') || {}
      const registeredUsers = getStorage('registeredUsers') || {}
      
      // 验证当前密码
      let currentPassword = storedPasswords[username]
      if (!currentPassword) {
        if (username === 'admin') {
          currentPassword = 'admin123'
        } else if (username === 'user') {
          currentPassword = 'user123'
        } else if (registeredUsers[username]) {
          currentPassword = registeredUsers[username].password
        }
      }
      
      if (currentPassword !== passwordForm.oldPassword) {
        ElMessage.error('当前密码错误')
        return
      }
      
      // 保存新密码
      storedPasswords[username] = passwordForm.newPassword
      setStorage('userPassword', storedPasswords)
      
      // 如果是注册用户，也更新注册用户的密码
      if (registeredUsers[username]) {
        registeredUsers[username].password = passwordForm.newPassword
        setStorage('registeredUsers', registeredUsers)
      }
      
      ElMessage.success('密码修改成功，请重新登录')
      
      setTimeout(() => {
        userStore.logout()
        router.push('/login')
      }, 1500)
    }
  })
}

function saveNotification() {
  // 保存通知设置到 localStorage
  setStorage('notificationSettings', {
    email: notificationSettings.email,
    sms: notificationSettings.sms,
    push: notificationSettings.push,
    quietStart: notificationSettings.quietStart,
    quietEnd: notificationSettings.quietEnd
  })
  ElMessage.success('通知设置已保存')
}

function loadNotificationSettings() {
  const saved = getStorage('notificationSettings')
  if (saved) {
    notificationSettings.email = saved.email
    notificationSettings.sms = saved.sms
    notificationSettings.push = saved.push
    notificationSettings.quietStart = saved.quietStart
    notificationSettings.quietEnd = saved.quietEnd
  }
}

onMounted(() => {
  // 加载通知设置
  loadNotificationSettings()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.settings-page {
  .settings-tabs {
    :deep(.el-tabs__content) {
      padding: 0;
    }
  }
}

.notification-settings {
  max-width: 500px;
  
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md 0;
    border-bottom: 1px solid $border-color;
    
    &:last-child {
      border-bottom: none;
    }
    
    .setting-info {
      h4 {
        margin: 0 0 4px;
        font-size: $font-size-md;
        color: $text-primary;
      }
      
      p {
        margin: 0;
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }
  }
  
  .quiet-hours-item {
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;
    
    .quiet-hours-picker {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      
      .time-separator {
        color: $text-secondary;
        padding: 0 $spacing-xs;
      }
    }
  }
}
</style>
