<template>
  <div ref="chartRef" class="line-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

interface Props {
  data: { timestamp: string; value: number }[]
  title?: string
  unit?: string
  thresholdLow?: number
  thresholdHigh?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  unit: '',
  thresholdLow: undefined,
  thresholdHigh: undefined
})

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
  
  // 使用 ResizeObserver 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    handleResize()
  })
  resizeObserver.observe(chartRef.value)
  
  // 同时监听 window resize 作为备用
  window.addEventListener('resize', handleResize)
}

function updateChart() {
  if (!chart) return
  
  const xData = props.data.map(d => {
    const date = new Date(d.timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
  })
  const yData = props.data.map(d => d.value)
  
  const markLines: any[] = []
  if (props.thresholdLow !== undefined) {
    markLines.push({
      yAxis: props.thresholdLow,
      lineStyle: { color: '#67c23a', type: 'dashed' },
      label: { formatter: `下限: ${props.thresholdLow}` }
    })
  }
  if (props.thresholdHigh !== undefined) {
    markLines.push({
      yAxis: props.thresholdHigh,
      lineStyle: { color: '#f56c6c', type: 'dashed' },
      label: { formatter: `上限: ${props.thresholdHigh}` }
    })
  }
  
  const option: echarts.EChartsOption = {
    title: {
      text: props.title,
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.axisValue}<br/>数值: ${data.value} ${props.unit}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: props.title ? '15%' : '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: 45,
        fontSize: 10
      }
    },
    yAxis: {
      type: 'value',
      name: props.unit,
      axisLabel: { fontSize: 11 }
    },
    series: [{
      type: 'line',
      data: yData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { width: 2, color: '#409eff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      markLine: markLines.length > 0 ? {
        silent: true,
        data: markLines
      } : undefined
    }]
  }
  
  chart.setOption(option)
}

function handleResize() {
  if (chart) {
    // 使用 nextTick 确保 DOM 更新完成后再 resize
    nextTick(() => {
      chart?.resize()
    })
  }
}

watch(() => props.data, () => {
  updateChart()
  // 数据更新后也触发一次 resize
  nextTick(() => {
    handleResize()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  if (resizeObserver && chartRef.value) {
    resizeObserver.unobserve(chartRef.value)
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<style lang="scss" scoped>
.line-chart {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
