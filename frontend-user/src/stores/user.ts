import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, LoginForm } from '@/types'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(getStorage('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  // 登录
  async function login(form: LoginForm): Promise<boolean> {
    // 获取存储的密码对象
    const storedPasswords = getStorage('userPassword') || {}
    // 获取已注册用户
    const registeredUsers = getStorage('registeredUsers') || {}
    
    // 验证用户名和密码
    let isValid = false
    let userRole: 'admin' | 'user' = 'user'
    let userNickname = ''
    let userEmail = ''
    let userId = ''
    
    if (form.username === 'admin') {
      // 如果有存储的密码，使用存储的密码验证，否则使用默认密码
      const correctPassword = storedPasswords.admin || 'admin123'
      isValid = form.password === correctPassword
      userRole = 'admin'
      userNickname = '管理员'
      userEmail = 'admin@example.com'
      userId = '1'
    } else if (form.username === 'user') {
      const correctPassword = storedPasswords.user || 'user123'
      isValid = form.password === correctPassword
      userRole = 'user'
      userNickname = '普通用户'
      userEmail = 'user@example.com'
      userId = '2'
    } else if (registeredUsers[form.username]) {
      // 检查注册用户
      const registeredUser = registeredUsers[form.username]
      isValid = form.password === registeredUser.password
      userRole = registeredUser.role || 'user'
      userNickname = registeredUser.nickname
      userEmail = registeredUser.email
      userId = `reg_${form.username}`
    }
    
    if (isValid) {
      const mockToken = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`
      token.value = mockToken
      
      userInfo.value = {
        id: userId,
        username: form.username,
        nickname: userNickname,
        avatar: '',
        role: userRole,
        email: userEmail,
        phone: '13800138000',
        createTime: new Date().toISOString()
      }
      
      // 始终保存到 localStorage，确保刷新后状态保持
      setStorage('token', mockToken)
      setStorage('userInfo', userInfo.value)
      
      return true
    }
    return false
  }

  // 登出
  function logout() {
    token.value = ''
    userInfo.value = null
    removeStorage('token')
    removeStorage('userInfo')
  }

  // 注册
  async function register(form: { username: string; nickname: string; email: string; password: string }): Promise<boolean> {
    // 获取已注册用户列表
    const registeredUsers = getStorage('registeredUsers') || {}
    
    // 检查用户名是否已存在
    if (registeredUsers[form.username] || form.username === 'admin' || form.username === 'user') {
      return false
    }
    
    // 保存新用户
    registeredUsers[form.username] = {
      nickname: form.nickname,
      email: form.email,
      password: form.password,
      role: 'user',
      createTime: new Date().toISOString()
    }
    setStorage('registeredUsers', registeredUsers)
    
    return true
  }

  // 初始化用户信息
  function initUserInfo() {
    const storedUserInfo = getStorage('userInfo')
    if (storedUserInfo && token.value) {
      userInfo.value = storedUserInfo
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    register,
    initUserInfo
  }
})
