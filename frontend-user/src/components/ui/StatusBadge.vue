<template>
  <span class="status-badge" :class="status">
    <span class="dot"></span>
    <span class="text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'normal' | 'warning' | 'alarm' | 'offline' | 'active' | 'acknowledged' | 'resolved'
}

const props = defineProps<Props>()

const statusMap: Record<string, string> = {
  normal: '正常',
  warning: '预警',
  alarm: '报警',
  offline: '离线',
  active: '活跃',
  acknowledged: '已确认',
  resolved: '已解决'
}

const label = computed(() => statusMap[props.status] || props.status)
</script>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  
  &.normal, &.resolved {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
    .dot { background: #67c23a; }
  }
  
  &.warning, &.acknowledged {
    background: rgba(230, 162, 60, 0.1);
    color: #e6a23c;
    .dot { background: #e6a23c; }
  }
  
  &.alarm, &.active {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
    .dot { background: #f56c6c; animation: pulse 1.5s infinite; }
  }
  
  &.offline {
    background: rgba(144, 147, 153, 0.1);
    color: #909399;
    .dot { background: #909399; }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
