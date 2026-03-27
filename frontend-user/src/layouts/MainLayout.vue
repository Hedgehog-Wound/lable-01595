<template>
  <div class="main-layout">
    <AppSidebar :collapsed="sidebarCollapsed" />
    <div class="layout-main">
      <AppHeader :collapsed="sidebarCollapsed" @toggle-sidebar="toggleSidebar" />
      <main class="layout-content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="['AutoTuning']">
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(() => {
  userStore.initUserInfo()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.main-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  overflow: auto;
  background: $bg-primary;
}
</style>
