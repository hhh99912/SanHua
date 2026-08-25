<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import { ScreenComponent, DatasetItem } from '../../types';
import { withAlpha } from '../../utils/color';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();
const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let isDisposed = false;

const buildChartOptions = () => {
  const { type, data, style, customProps } = props.component;
  const boundDataset = props.datasets?.find(d => d.id === data.datasetId);
  const activeData = boundDataset?.data || data.staticData || {};

  const themeColor = style.fill || '#00f2ff';
  const subColor = style.stroke || '#3b82f6';
  const textColor = style.textColor || '#94a3b8';

  const defaultLineCategories = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const defaultLineSeries = [45, 62, 78, 59, 88, 92, 74];

  // 1. Line Chart
  if (type === 'chart-line') {
    const xData = (data.mapping.categoriesKey && activeData[data.mapping.categoriesKey]) 
      || activeData.timestamps 
      || defaultLineCategories;
    const yData = (data.mapping.seriesKey && activeData[data.mapping.seriesKey]) 
      || activeData.history 
      || defaultLineSeries;

    return {
      backgroundColor: 'transparent',
      grid: { top: 32, right: 20, bottom: 25, left: 40, containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0a1120',
        borderColor: themeColor,
        textStyle: { color: '#fff', fontSize: 11, fontFamily: 'monospace' }
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: textColor, fontSize: 10, fontFamily: 'monospace' },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: textColor, fontSize: 10, fontFamily: 'monospace' },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
      },
      series: [
        {
          name: props.component.name,
          type: 'line',
          smooth: customProps?.smooth !== false,
          showSymbol: false,
          data: yData,
          itemStyle: { color: themeColor },
          lineStyle: { width: style.strokeWidth || 3, color: themeColor },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: withAlpha(themeColor, 0.5) },
              { offset: 1, color: withAlpha(themeColor, 0.03) }
            ])
          }
        }
      ]
    };
  }

  // 2. Bar Chart
  if (type === 'chart-bar') {
    const xData = (data.mapping.categoriesKey && activeData[data.mapping.categoriesKey]) 
      || activeData.workshops 
      || ['1#车间', '2#车间', '3#车间', '4#车间', '5#车间', '6#车间'];
    const yData = (data.mapping.seriesKey && activeData[data.mapping.seriesKey]) 
      || activeData.efficiency 
      || [86, 92, 78, 95, 88, 91];

    return {
      backgroundColor: 'transparent',
      grid: { top: 32, right: 15, bottom: 25, left: 35, containLabel: false },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0a1120',
        borderColor: themeColor,
        textStyle: { color: '#fff', fontSize: 11 }
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: textColor, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
      },
      series: [
        {
          name: props.component.name,
          type: 'bar',
          barWidth: customProps?.barWidth || 16,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeColor },
              { offset: 1, color: subColor }
            ])
          },
          data: yData
        }
      ]
    };
  }

  // 3. Pie / Doughnut Chart
  if (type === 'chart-pie') {
    const pieData = activeData.energy_distribution || [
      { name: '重载机加工', value: 42 },
      { name: '热处理炉', value: 28 },
      { name: '空压动力站', value: 18 },
      { name: '照明与辅助', value: 12 }
    ];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0a1120',
        borderColor: themeColor,
        textStyle: { color: '#fff', fontSize: 11 }
      },
      legend: {
        bottom: '2%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: textColor, fontSize: 10 }
      },
      series: [
        {
          name: props.component.name,
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#050914',
            borderWidth: 2
          },
          label: { show: false },
          labelLine: { show: false },
          data: pieData
        }
      ]
    };
  }

  // 4. Gauge Chart
  if (type === 'chart-gauge') {
    const val = (data.mapping.valueKey && activeData[data.mapping.valueKey]) 
      || activeData.sensor_val 
      || activeData.yield_rate 
      || 85.6;

    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          center: ['50%', '55%'],
          radius: '88%',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: data.mapping.thresholdMax || 100,
          splitNumber: 5,
          itemStyle: { color: themeColor },
          progress: {
            show: true,
            width: 8,
            roundCap: true,
            itemStyle: { color: themeColor }
          },
          pointer: {
            length: '55%',
            width: 4,
            itemStyle: { color: themeColor }
          },
          axisLine: {
            roundCap: true,
            lineStyle: { width: 8, color: [[1, '#1e293b']] }
          },
          axisTick: { distance: -16, length: 4, lineStyle: { color: '#475569', width: 1 } },
          splitLine: { distance: -20, length: 8, lineStyle: { color: themeColor, width: 2 } },
          axisLabel: { distance: -28, color: textColor, fontSize: 9, fontFamily: 'monospace' },
          title: {
            offsetCenter: [0, '40%'],
            fontSize: 11,
            color: textColor,
            fontFamily: 'monospace'
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '70%'],
            fontSize: 18,
            fontWeight: 'bold',
            formatter: `{value}${data.mapping.unitKey || '%'}`,
            color: '#ffffff',
            fontFamily: 'monospace'
          },
          data: [{ value: Math.round(Number(val) * 10) / 10, name: props.component.name }]
        }
      ]
    };
  }

  // 5. Radar Chart
  if (type === 'chart-radar') {
    return {
      backgroundColor: 'transparent',
      radar: {
        indicator: [
          { name: '综合能效', max: 100 },
          { name: '良品率', max: 100 },
          { name: '稼动率', max: 100 },
          { name: '安全指数', max: 100 },
          { name: '维护健康', max: 100 }
        ],
        radius: '65%',
        splitNumber: 4,
        axisName: { color: textColor, fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } },
        splitArea: { areaStyle: { color: ['rgba(0,242,255,0.02)', 'rgba(0,242,255,0.06)'] } },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [88, 96, 91, 99, 85],
              name: '车间全维指标',
              itemStyle: { color: themeColor },
              areaStyle: { color: withAlpha(themeColor, 0.25) }
            }
          ]
        }
      ]
    };
  }

  // 6. Scatter / Default
  return {
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 20, left: 30 },
    xAxis: { splitLine: { lineStyle: { color: '#1e293b' } } },
    yAxis: { splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      {
        symbolSize: 8,
        data: [[10.0, 8.04], [8.07, 6.95], [13.0, 7.58], [9.05, 8.81], [11.0, 8.33], [14.0, 7.66]],
        type: 'scatter',
        itemStyle: { color: themeColor }
      }
    ]
  };
};

let renderScheduled = false;

const renderChart = () => {
  if (isDisposed || !chartRef.value) return;
  if (renderScheduled) return;

  renderScheduled = true;
  nextTick(() => {
    renderScheduled = false;
    if (isDisposed || !chartRef.value) return;

    try {
      if (!chartInstance) {
        chartInstance = echarts.init(chartRef.value);
      }
      const options = buildChartOptions();
      chartInstance.setOption(options, {
        notMerge: true,
        lazyUpdate: true,
        silent: true
      });
    } catch (err) {
      console.warn('ECharts render warning:', err);
    }
  });
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  isDisposed = false;
  renderChart();

  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!isDisposed && chartInstance) {
        chartInstance.resize();
      }
    });
    resizeObserver.observe(chartRef.value);
  }
});

watch(
  () => [props.component, props.datasets],
  () => {
    renderChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  isDisposed = true;
  resizeObserver?.disconnect();
  if (chartInstance) {
    try {
      chartInstance.dispose();
    } catch {}
    chartInstance = null;
  }
});
</script>

<template>
  <div class="w-full h-full p-1 relative flex flex-col select-none overflow-hidden">
    <!-- Chart Title Bar (Optional) -->
    <div 
      v-if="component.style.fontSize && component.style.fontSize > 12"
      class="text-xs font-mono font-bold text-cyan-300 px-2 pt-1 flex items-center justify-between"
    >
      <span class="truncate">{{ component.name }}</span>
      <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
    </div>

    <!-- ECharts Container -->
    <div ref="chartRef" class="flex-1 w-full h-full min-h-16" />
  </div>
</template>
