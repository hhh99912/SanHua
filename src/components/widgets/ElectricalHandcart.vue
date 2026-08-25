<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const handcartState = computed(() => {
  const { data, style, customProps } = props.component;
  const boundDs = props.datasets?.find(d => d.id === data?.datasetId);

  // Position: 'working' (工作位置) | 'test' (试验位置) | 'isolated' (检修位置)
  let position: 'working' | 'test' | 'isolated' = customProps?.position || 'working';

  if (boundDs && boundDs.data) {
    const pKey = data?.mapping?.stateKey || data?.mapping?.statusKey;
    if (pKey && boundDs.data[pKey] !== undefined) {
      const val = String(boundDs.data[pKey]).toLowerCase();
      if (val.includes('test') || val.includes('试')) position = 'test';
      else if (val.includes('iso') || val.includes('隔') || val.includes('检')) position = 'isolated';
      else position = 'working';
    }
  }

  const isWorking = position === 'working';
  const posColor = isWorking ? '#ef4444' : '#10b981';

  return {
    isWorking,
    posColor,
    stroke: style.stroke || posColor,
    strokeWidth: style.strokeWidth || 2
  };
});
</script>

<template>
  <div class="w-full h-full flex items-center justify-center select-none relative overflow-visible">
    <!-- Handcart IEC Switchgear Symbol -->
    <svg 
      class="w-full h-full overflow-visible"
      viewBox="0 0 70 80" 
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Fixed Outer Cabinet Guide Frame (Dashed) -->
      <rect x="8" y="8" width="54" height="64" rx="2" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3" />
      
      <!-- Top Fixed Contact Pin -->
      <circle cx="35" cy="8" r="3" :fill="handcartState.stroke" />
      <line x1="35" y1="0" x2="35" y2="8" :stroke="handcartState.stroke" :stroke-width="handcartState.strokeWidth" />

      <!-- Movable Trolley Core -->
      <rect 
        x="18" 
        y="18" 
        width="34" 
        height="44" 
        rx="2" 
        fill="rgba(6, 14, 28, 0.8)" 
        :stroke="handcartState.posColor" 
        :stroke-width="handcartState.strokeWidth" 
      />

      <!-- Breaker Element inside Trolley -->
      <line 
        v-if="handcartState.isWorking"
        x1="35" y1="24" x2="35" y2="56" 
        :stroke="handcartState.posColor" 
        :stroke-width="handcartState.strokeWidth + 1" 
        stroke-linecap="round"
      />
      <line 
        v-else
        x1="35" y1="56" x2="47" y2="28" 
        :stroke="handcartState.posColor" 
        :stroke-width="handcartState.strokeWidth + 1" 
        stroke-linecap="round"
      />

      <!-- Bottom Fixed Contact Pin -->
      <circle cx="35" cy="72" r="3" :fill="handcartState.stroke" />
      <line x1="35" y1="72" x2="35" y2="80" :stroke="handcartState.stroke" :stroke-width="handcartState.strokeWidth" />

      <!-- Trolley Small Wheels (Double Circle) -->
      <circle cx="26" cy="62" r="2.5" :fill="handcartState.posColor" />
      <circle cx="44" cy="62" r="2.5" :fill="handcartState.posColor" />
    </svg>
  </div>
</template>
