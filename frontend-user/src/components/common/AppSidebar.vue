<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <div class="logo">
      <el-icon class="logo-icon"><Monitor /></el-icon>
      <span v-show="!collapsed" class="logo-text">报警调参系统</span>
    </div>
    
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      :collapse-transition="false"
      background-color="#1f2937"
      text-color="rgba(255, 255, 255, 0.7)"
      active-text-color="#ffffff"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/dashboard">
        <el-icon><Odometer /></el-icon>
        <template #title>仪表盘</template>
      </el-menu-item>
      
      <el-menu-item index="/auto-tuning">
        <el-icon><MagicStick /></el-icon>
        <template #title>自动调参</template>
      </el-menu-item>
      
      <el-menu-item index="/monitor">
        <el-icon><Monitor /></el-icon>
        <template #title>监测点管理</template>
      </el-menu-item>
      
      <el-sub-menu index="alarm">
        <template #title>
          <el-icon><Bell /></el-icon>
          <span>报警管理</span>
        </template>
        <el-menu-item index="/alarm/config">报警配置</el-menu-item>
        <el-menu-item index="/alarm/history">报警历史</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/settings">
        <el-icon><Tools /></el-icon>
        <template #title>系统设置</template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Odometer, Monitor, Bell, MagicStick, Tools } from '@element-plus/icons-vue'

defineProps<{
  collapsed: boolean
}>()

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.app-sidebar {
  width: $sidebar-width;
  height: 100vh;
  background: $bg-dark;
  transition: width 0.3s;
  overflow: hidden;
  
  &.collapsed {
    width: $sidebar-collapsed-width;
  }
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: $header-height;
  padding: 0 $spacing-md;
  background: rgba(0, 0, 0, 0.2);
  
  .logo-icon {
    font-size: 28px;
    color: $primary-color;
  }
  
  .logo-text {
    margin-left: $spacing-sm;
    font-size: $font-size-lg;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
  }
}

.sidebar-menu {
  border-right: none;
  
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
    }
  }
  
  :deep(.el-menu-item.is-active) {
    background: $primary-color !important;
    color: #fff !important;
  }
  
  :deep(.el-sub-menu .el-menu) {
    background-color: #161d27 !important;
  }
  
  :deep(.el-sub-menu .el-menu-item) {
    padding-left: 50px !important;
    background-color: #161d27 !important;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.08) !important;
    }
    
    &.is-active {
      background: $primary-color !important;
    }
  }
}
</style>
