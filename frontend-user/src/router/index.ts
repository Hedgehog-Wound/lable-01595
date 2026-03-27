import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/RegisterView.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'auto-tuning',
        name: 'AutoTuning',
        component: () => import('@/views/autoTuning/AutoTuningView.vue'),
        meta: { title: '自动调参', icon: 'MagicStick' }
      },
      {
        path: 'monitor',
        name: 'MonitorList',
        component: () => import('@/views/monitor/MonitorList.vue'),
        meta: { title: '监测点管理', icon: 'Monitor' }
      },
      {
        path: 'monitor/:id',
        name: 'MonitorDetail',
        component: () => import('@/views/monitor/MonitorDetail.vue'),
        meta: { title: '监测点详情', hidden: true }
      },
      {
        path: 'alarm/config',
        name: 'AlarmConfig',
        component: () => import('@/views/alarm/AlarmConfig.vue'),
        meta: { title: '报警配置', icon: 'Setting' }
      },
      {
        path: 'alarm/history',
        name: 'AlarmHistory',
        component: () => import('@/views/alarm/AlarmHistory.vue'),
        meta: { title: '报警历史', icon: 'Bell' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: '系统设置', icon: 'Tools' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
