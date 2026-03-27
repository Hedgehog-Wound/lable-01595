<template>
  <footer class="app-footer">
    <span>© 2024 监测点报警系统 - 自动调参平台</span>
    <span class="version">v1.0.0</span>
  </footer>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  height: 40px;
  padding: 0 $spacing-lg;
  background: $bg-card;
  border-top: 1px solid $border-color;
  font-size: $font-size-xs;
  color: $text-secondary;
  
  .version {
    color: $text-placeholder;
  }
}
</style>
