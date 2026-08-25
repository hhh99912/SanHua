<script setup lang="ts">
import { computed } from 'vue';
import { ScreenComponent, DatasetItem } from '../../types';

interface Props {
  component: ScreenComponent;
  datasets?: DatasetItem[];
}

const props = defineProps<Props>();

const metricState = computed(() => {
  const { data, style, customProps } = props.component;
  const boundDs = props.datasets?.find(d => d.id === data?.datasetId);

  let suffix = style.suffix ?? customProps?.suffix ?? '';
  let prefix = style.prefix ?? customProps?.prefix ?? '';

  const decimals = typeof style.decimals === 'number' 
    ? style.decimals 
    : (typeof customProps?.decimals === 'number' ? customProps.decimals : 2);

  let rawVal: any = customProps?.value ?? 0.0;
  
  if (boundDs && boundDs.data) {
    const vKey = data?.mapping?.valueKey;
    if (vKey && boundDs.data[vKey] !== undefined) {
      rawVal = boundDs.data[vKey];
    } else if (typeof boundDs.data === 'number') {
      rawVal = boundDs.data;
    }
  }

  const num = parseFloat(rawVal);
  const formattedVal = isNaN(num) ? (0).toFixed(decimals) : num.toFixed(decimals);

  const textColor = style.textColor || style.stroke || '#00f2ff';
  const bgColor = style.fill || 'transparent';
  const fontSize = style.fontSize || 20;

  return {
    prefix,
    suffix,
    value: formattedVal,
    textColor,
    bgColor,
    fontSize
  };
});
</script>

<template>
  <div 
    class="w-full h-full flex items-center justify-center p-0 m-0 select-none font-mono tracking-tight overflow-hidden leading-none"
    :style="{
      backgroundColor: metricState.bgColor,
      color: metricState.textColor,
      fontSize: `${metricState.fontSize}px`
    }"
  >
    <span v-if="metricState.prefix" class="opacity-80 text-[0.8em] mr-0.5 leading-none">{{ metricState.prefix }}</span>
    <span class="font-bold leading-none inline-block">{{ metricState.value }}</span>
    <span v-if="metricState.suffix" class="opacity-80 text-[0.75em] ml-0.5 font-sans leading-none">{{ metricState.suffix }}</span>
  </div>
</template>
