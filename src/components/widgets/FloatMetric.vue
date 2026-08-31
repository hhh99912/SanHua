<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';
import { resolveDataPointValue } from '../../utils/scadaResolver';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const metricState = computed(() => {
  const { data, style, customProps } = props.component;

  const decimals = typeof style.decimals === 'number' 
    ? style.decimals 
    : (typeof customProps?.decimals === 'number' ? customProps.decimals : 2);

  let rawVal: any = customProps?.value ?? 0.0;
  
  const vKey = data?.mapping?.valueKey || data?.mapping?.voltageKey || data?.mapping?.currentKey || data?.mapping?.powerKey;
  if (vKey) {
    const val = resolveDataPointValue(props.datasets, data?.datasetId, vKey);
    if (val !== undefined) {
      rawVal = val;
    }
  } else if (data?.datasetId) {
    const boundDs = props.datasets?.find(d => d.id === data?.datasetId);
    if (boundDs && typeof boundDs.data === 'number') {
      rawVal = boundDs.data;
    }
  }

  const num = parseFloat(rawVal);
  const formattedVal = isNaN(num) ? String(rawVal) : num.toFixed(decimals);

  const textColor = style.textColor || style.stroke || '#00f2ff';
  const bgColor = style.fill || 'transparent';

  // Calculate SVG viewBox width based on character length for optimal fit
  const strLen = Math.max(1, formattedVal.length);
  const charWidth = strLen * 24 + 10;

  return {
    value: formattedVal,
    textColor,
    bgColor,
    viewWidth: charWidth
  };
});
</script>

<template>
  <!-- Pure Atomic Float Metric - Numbers only, scales 100% to bounding box -->
  <div 
    class="w-full h-full flex items-center justify-center p-0 m-0 select-none overflow-hidden"
    :style="{ backgroundColor: metricState.bgColor }"
  >
    <svg 
      :viewBox="`0 0 ${metricState.viewWidth} 40`" 
      class="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <text 
        :x="metricState.viewWidth / 2" 
        y="30" 
        text-anchor="middle" 
        font-family="monospace" 
        font-weight="900" 
        font-size="34" 
        letter-spacing="1"
        :fill="metricState.textColor"
        :style="{ filter: `drop-shadow(0 0 6px ${metricState.textColor}70)` }"
      >
        {{ metricState.value }}
      </text>
    </svg>
  </div>
</template>
