<template>
  <header class="app-header">
    <div class="header-left">
      <el-icon class="menu-toggle" @click="$emit('toggle-sidebar')">
        <Fold v-if="!collapsed" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="header-right">
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :icon="UserFilled" />
          <span class="username">{{ userStore.userInfo?.nickname || '用户' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人信息
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <!-- 个人信息弹窗 -->
    <el-dialog 
      v-model="profileDialogVisible" 
      title="个人信息" 
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="handleProfileDialogClose"
    >
      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-width="56px"
        style="padding: 0 20px"
      >
        <el-form-item label="头像">
          <el-avatar :size="64" :icon="UserFilled" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input :value="userStore.userInfo?.username" disabled />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="profileForm.nickname" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelProfile">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { setStorage } from '@/utils/storage'
import { UserFilled, ArrowDown, User, Setting, SwitchButton, Fold, Expand } from '@element-plus/icons-vue'

defineProps<{
  collapsed: boolean
}>()

defineEmits(['toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentRoute = computed(() => route.meta.title as string)

// 个人信息弹窗
const profileDialogVisible = ref(false)
const profileFormRef = ref<FormInstance>()
const profileForm = reactive({
  nickname: '',
  email: '',
  phone: ''
})

const profileRules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ]
}

function openProfileDialog() {
  if (userStore.userInfo) {
    profileForm.nickname = userStore.userInfo.nickname
    profileForm.email = userStore.userInfo.email
    profileForm.phone = userStore.userInfo.phone
  }
  profileDialogVisible.value = true
}

// 重置个人信息表单
function resetProfileForm() {
  if (profileFormRef.value) {
    profileFormRef.value.resetFields()
    profileFormRef.value.clearValidate()
  }
}

// 取消按钮
function handleCancelProfile() {
  profileDialogVisible.value = false
  resetProfileForm()
}

// 对话框关闭时
function handleProfileDialogClose() {
  resetProfileForm()
}

function saveProfile() {
  profileFormRef.value?.validate((valid) => {
    if (valid) {
      if (userStore.userInfo) {
        userStore.userInfo.nickname = profileForm.nickname
        userStore.userInfo.email = profileForm.email
        userStore.userInfo.phone = profileForm.phone
        setStorage('userInfo', userStore.userInfo)
      }
      ElMessage.success('个人信息已保存')
      profileDialogVisible.value = false
      resetProfileForm()
    }
  })
}

function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      openProfileDialog()
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $header-height;
  padding: 0 $spacing-lg;
  background: $bg-card;
  border-bottom: 1px solid $border-color;
  box-shadow: $shadow-sm;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  
  .menu-toggle {
    font-size: 20px;
    cursor: pointer;
    color: $text-regular;
    transition: color 0.3s;
    
    &:hover {
      color: $primary-color;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-md;
  transition: background 0.3s;
  outline: none;
  
  &:hover {
    background: $bg-primary;
  }
  
  &:focus {
    outline: none;
  }
  
  .username {
    font-size: $font-size-md;
    color: $text-primary;
  }
}
</style>
