<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const breakerState = computed(() => {
  const { data, style, customProps } = props.component;
  const boundDs = props.datasets?.find(d => d.id === data?.datasetId);

  // Status: 'closed' (合闸) | 'open' (分闸) | 'fault' (故障)
  let status: 'closed' | 'open' | 'fault' = customProps?.state || 'closed';
  
  if (boundDs && boundDs.data) {
    const sKey = data?.mapping?.stateKey || data?.mapping?.statusKey;
    if (sKey && boundDs.data[sKey] !== undefined) {
      const val = boundDs.data[sKey];
      if (typeof val === 'boolean') {
        status = val ? 'closed' : 'open';
      } else if (typeof val === 'string') {
        if (val.toLowerCase().includes('open') || val.includes('分') || val === '0') status = 'open';
        else if (val.toLowerCase().includes('fault') || val.includes('故障')) status = 'fault';
        else status = 'closed';
      } else if (typeof val === 'number') {
        status = val === 1 ? 'closed' : 'open';
      }
    }
  }

  const isClosed = status === 'closed';
  const statusColor = status === 'fault' 
    ? '#f59e0b' 
    : (isClosed ? (style.breakerColorClosed || '#ef4444') : (style.breakerColorOpen || '#10b981'));

  return {
    status,
    isClosed,
    statusColor,
    stroke: style.stroke || statusColor,
    strokeWidth: style.strokeWidth || 2.5
  };
});
</script>

<template>
  <div class="w-full h-full flex items-center justify-center select-none relative overflow-visible">
    <svg 
      class="w-full h-full overflow-visible"
      viewBox="0 0 60 80" 
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Top Incomer Terminal Line -->
      <line x1="30" y1="0" x2="30" y2="20" :stroke="breakerState.stroke" :stroke-width="breakerState.strokeWidth" stroke-linecap="round" />
      <circle cx="30" cy="20" r="3" :fill="breakerState.stroke" />

      <!-- Center Breaker Square Box (IEC 60617 standard) -->
      <rect 
        x="15" 
        y="20" 
        width="30" 
        height="40" 
        :fill="breakerState.isClosed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'" 
        :stroke="breakerState.statusColor" 
        :stroke-width="breakerState.strokeWidth"
        rx="2"
      />

      <!-- Switch Contact Blade -->
      <line 
        v-if="breakerState.isClosed"
        x1="30" 
        y1="20" 
        x2="30" 
        y2="60" 
        :stroke="breakerState.statusColor" 
        :stroke-width="breakerState.strokeWidth + 1" 
        stroke-linecap="round"
      />
      <line 
        v-else
        x1="30" 
        y1="60" 
        x2="46" 
        y2="28" 
        :stroke="breakerState.statusColor" 
        :stroke-width="breakerState.strokeWidth + 1" 
        stroke-linecap="round"
      />

      <!-- Bottom Terminal Line -->
      <circle cx="30" cy="60" r="3" :fill="breakerState.stroke" />
      <line x1="30" y1="60" x2="30" y2="80" :stroke="breakerState.stroke" :stroke-width="breakerState.strokeWidth" stroke-linecap="round" />
    </svg>
  </div>
</template>
