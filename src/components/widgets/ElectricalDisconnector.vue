<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const disconnectorState = computed(() => {
  const { data, style, customProps } = props.component;
  const boundDs = props.datasets?.find(d => d.id === data?.datasetId);

  const isGrounding = props.component.type === 'elec-grounding';
  let isClosed = customProps?.state === 'closed';
  if (customProps?.state === undefined) isClosed = true;

  if (boundDs && boundDs.data) {
    const sKey = data?.mapping?.stateKey || data?.mapping?.statusKey;
    if (sKey && boundDs.data[sKey] !== undefined) {
      const val = String(boundDs.data[sKey]).toLowerCase();
      isClosed = !(val.includes('open') || val.includes('分') || val === '0' || val === 'false');
    }
  }

  const statusColor = isClosed ? (isGrounding ? '#eab308' : '#ef4444') : '#10b981';

  return {
    isGrounding,
    isClosed,
    statusColor,
    stroke: style.stroke || statusColor,
    strokeWidth: style.strokeWidth || 2.5
  };
});
</script>

<template>
  <div class="w-full h-full flex items-center justify-center select-none relative overflow-visible">
    <!-- Grounding Switch (接地刀闸) -->
    <svg 
      v-if="disconnectorState.isGrounding" 
      class="w-full h-full overflow-visible"
      viewBox="0 0 50 60" 
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1="25" y1="0" x2="25" y2="15" :stroke="disconnectorState.stroke" :stroke-width="disconnectorState.strokeWidth" stroke-linecap="round" />
      <circle cx="25" cy="15" r="3" :fill="disconnectorState.stroke" />
      
      <!-- Blade -->
      <line 
        :x1="25" :y1="15" 
        :x2="disconnectorState.isClosed ? 25 : 40" 
        :y2="disconnectorState.isClosed ? 40 : 20" 
        :stroke="disconnectorState.statusColor" 
        :stroke-width="disconnectorState.strokeWidth + 0.5" 
        stroke-linecap="round"
      />
      <circle cx="25" cy="40" r="2.5" :fill="disconnectorState.stroke" />
      
      <!-- Ground Plate Bars (大地标识) -->
      <line x1="12" y1="45" x2="38" y2="45" :stroke="disconnectorState.stroke" :stroke-width="disconnectorState.strokeWidth" stroke-linecap="round" />
      <line x1="17" y1="51" x2="33" y2="51" :stroke="disconnectorState.stroke" :stroke-width="disconnectorState.strokeWidth - 0.5" stroke-linecap="round" />
      <line x1="21" y1="57" x2="29" y2="57" :stroke="disconnectorState.stroke" :stroke-width="disconnectorState.strokeWidth - 1" stroke-linecap="round" />
    </svg>

    <!-- Standard Isolator Switch (隔离开关) -->
    <svg 
      v-else 
      class="w-full h-full overflow-visible"
      viewBox="0 0 50 60" 
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Top Terminal -->
      <line x1="25" y1="0" x2="25" y2="15" :stroke="disconnectorState.stroke" :stroke-width="disconnectorState.strokeWidth" stroke-linecap="round" />
      <circle cx="25" cy="15" r="3" :fill="disconnectorState.stroke" />
      
      <!-- Rotating Contact Blade -->
      <line 
        :x1="25" :y1="15" 
        :x2="disconnectorState.isClosed ? 25 : 42" 
        :y2="disconnectorState.isClosed ? 45 : 22" 
        :stroke="disconnectorState.statusColor" 
        :stroke-width="disconnectorState.strokeWidth + 0.5" 
        stroke-linecap="round"
      />
      
      <!-- Bottom Fixed Contact Pad & Terminal -->
      <circle cx="25" cy="45" r="3" :fill="disconnectorState.stroke" />
      <line x1="17" y1="45" x2="33" y2="45" :stroke="disconnectorState.stroke" :stroke-width="disconnectorState.strokeWidth" stroke-linecap="round" />
      <line x1="25" y1="45" x2="25" y2="60" :stroke="disconnectorState.stroke" :stroke-width="disconnectorState.strokeWidth" stroke-linecap="round" />
    </svg>
  </div>
</template>
