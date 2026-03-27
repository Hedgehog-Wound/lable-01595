<template>
  <div class="data-card" :class="type">
    <div class="card-icon">
      <el-icon :size="28">
        <component :is="icon" />
      </el-icon>
    </div>
    <div class="card-content">
      <div class="card-value">{{ value }}</div>
      <div class="card-label">{{ label }}</div>
    </div>
    <div v-if="trend !== undefined" class="card-trend" :class="{ up: trend > 0, down: trend < 0 }">
      <el-icon>
        <CaretTop v-if="trend > 0" />
        <CaretBottom v-else-if="trend < 0" />
        <Minus v-else />
      </el-icon>
      <span>{{ Math.abs(trend) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CaretTop, CaretBottom, Minus } from '@element-plus/icons-vue'
import type { Component } from 'vue'

interface Props {
  icon: Component
  value: string | number
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: number
}

withDefaults(defineProps<Props>(), {
  type: 'primary',
  trend: undefined
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.data-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-lg;
  background: $bg-card;
  border-radius: $border-radius-md;
  box-shadow: $shadow-sm;
  transition: all 0.3s;
  
  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }
  
  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: $border-radius-md;
  }
  
  .card-content {
    flex: 1;
    
    .card-value {
      font-size: 24px;
      font-weight: 600;
      color: $text-primary;
    }
    
    .card-label {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: 4px;
    }
  }
  
  .card-trend {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: $font-size-sm;
    
    &.up { color: $success-color; }
    &.down { color: $danger-color; }
  }
  
  &.primary .card-icon {
    background: rgba(64, 158, 255, 0.1);
    color: $primary-color;
  }
  
  &.success .card-icon {
    background: rgba(103, 194, 58, 0.1);
    color: $success-color;
  }
  
  &.warning .card-icon {
    background: rgba(230, 162, 60, 0.1);
    color: $warning-color;
  }
  
  &.danger .card-icon {
    background: rgba(245, 108, 108, 0.1);
    color: $danger-color;
  }
  
  &.info .card-icon {
    background: rgba(144, 147, 153, 0.1);
    color: $info-color;
  }
}
</style>
