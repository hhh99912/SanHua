<script setup lang="ts">
import { ref } from 'vue';
import {
  Database,
  X,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Edit,
  Check,
  Code,
  Trash2,
  Settings,
  Sliders
} from 'lucide-vue-next';
import { DatasetItem, DatasetField } from '../types';

interface Props {
  visible: boolean;
  datasets: DatasetItem[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:datasets', datasets: DatasetItem[]): void;
}>();

const selectedDatasetId = ref<string>(props.datasets[0]?.id || '');
const viewMode = ref<'fields' | 'json' | 'settings'>('fields');
const jsonString = ref('');
const jsonError = ref('');

// New Field Form State
const newFieldName = ref('');
const newFieldLabel = ref('');
const newFieldType = ref<'number' | 'string' | 'boolean' | 'array'>('number');
const newFieldValue = ref('0.00');

// Dataset Edit Form State
const editName = ref('');
const editDescription = ref('');
const editInterval = ref(2000);

const selectedDataset = () => props.datasets.find(d => d.id === selectedDatasetId.value) || props.datasets[0];

const selectDataset = (ds: DatasetItem) => {
  selectedDatasetId.value = ds.id;
  editName.value = ds.name;
  editDescription.value = ds.description;
  editInterval.value = ds.updateIntervalMs;
  jsonString.value = JSON.stringify(ds.data, null, 2);
  jsonError.value = '';
};

const toggleStreaming = (dsId: string) => {
  const updated = props.datasets.map(d => {
    if (d.id === dsId) {
      return { ...d, isStreaming: !d.isStreaming };
    }
    return d;
  });
  emit('update:datasets', updated);
};

const startEditJson = () => {
  const ds = selectedDataset();
  if (!ds) return;
  jsonString.value = JSON.stringify(ds.data, null, 2);
  jsonError.value = '';
  viewMode.value = 'json';
};

const saveEditJson = () => {
  try {
    const parsed = JSON.parse(jsonString.value);
    const updated = props.datasets.map(d => {
      if (d.id === selectedDatasetId.value) {
        return { ...d, data: parsed };
      }
      return d;
    });
    emit('update:datasets', updated);
    viewMode.value = 'fields';
    jsonError.value = '';
  } catch (err: any) {
    jsonError.value = 'JSON 解析格式错误: ' + err.message;
  }
};

const saveDatasetSettings = () => {
  const updated = props.datasets.map(d => {
    if (d.id === selectedDatasetId.value) {
      return {
        ...d,
        name: editName.value || d.name,
        description: editDescription.value || d.description,
        updateIntervalMs: Number(editInterval.value) || 2000
      };
    }
    return d;
  });
  emit('update:datasets', updated);
  viewMode.value = 'fields';
};

const addNewDataset = () => {
  const newId = `ds-custom-${Date.now().toString().slice(-4)}`;
  const newDs: DatasetItem = {
    id: newId,
    name: '新建遥测数据集',
    type: 'mock',
    description: '用户自定义时序遥测数据集',
    updateIntervalMs: 2000,
    isStreaming: true,
    data: {
      temperature: 42.5,
      pressure: 0.85,
      speed_rpm: 1450.0,
      status: 'NORMAL'
    },
    fields: [
      { name: 'temperature', label: '温度', type: 'number', sample: '42.5' },
      { name: 'pressure', label: '压力', type: 'number', sample: '0.85' },
      { name: 'speed_rpm', label: '主轴转速', type: 'number', sample: '1450.0' },
      { name: 'status', label: '状态', type: 'string', sample: 'NORMAL' }
    ]
  };

  const updated = [...props.datasets, newDs];
  emit('update:datasets', updated);
  selectDataset(newDs);
};

const deleteDataset = (dsId: string) => {
  if (props.datasets.length <= 1) {
    alert('至少需要保留一个数据集');
    return;
  }
  const updated = props.datasets.filter(d => d.id !== dsId);
  emit('update:datasets', updated);
  if (selectedDatasetId.value === dsId && updated[0]) {
    selectDataset(updated[0]);
  }
};

const addNewField = () => {
  if (!newFieldName.value.trim()) return;
  const ds = selectedDataset();
  if (!ds) return;

  const fieldKey = newFieldName.value.trim();
  let sampleVal: any = newFieldValue.value;
  if (newFieldType.value === 'number') {
    sampleVal = parseFloat(newFieldValue.value) || 0.0;
  } else if (newFieldType.value === 'boolean') {
    sampleVal = newFieldValue.value === 'true';
  }

  const newField: DatasetField = {
    name: fieldKey,
    label: newFieldLabel.value.trim() || fieldKey,
    type: newFieldType.value,
    sample: String(sampleVal)
  };

  const updated = props.datasets.map(d => {
    if (d.id === ds.id) {
      const existingFields = d.fields.filter(f => f.name !== fieldKey);
      return {
        ...d,
        fields: [...existingFields, newField],
        data: {
          ...d.data,
          [fieldKey]: sampleVal
        }
      };
    }
    return d;
  });

  emit('update:datasets', updated);
  newFieldName.value = '';
  newFieldLabel.value = '';
  newFieldValue.value = '0.00';
};

const deleteField = (fieldName: string) => {
  const ds = selectedDataset();
  if (!ds) return;

  const updated = props.datasets.map(d => {
    if (d.id === ds.id) {
      const remainingFields = d.fields.filter(f => f.name !== fieldName);
      const newData = { ...d.data };
      delete newData[fieldName];
      return {
        ...d,
        fields: remainingFields,
        data: newData
      };
    }
    return d;
  });

  emit('update:datasets', updated);
};
</script>

<template>
  <div 
    v-if="visible"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-4xl bg-[#080e1a] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-[#050914]">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Database class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-mono font-bold text-white tracking-wider">
              数据集与实时动态遥测流管理
            </h2>
            <p class="text-[10px] font-mono text-slate-400">
              动态模拟工控、SCADA、储罐液位、浮点指标及自定义数据流
            </p>
          </div>
        </div>

        <button 
          @click="emit('close')"
          class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body: Split Sidebar and Details -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Dataset Selector List -->
        <div class="w-72 border-r border-slate-800/80 bg-[#060a14] p-3 space-y-2 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 font-bold">
              <span>可用数据集 ({{ datasets.length }})</span>
              <button
                @click="addNewDataset"
                class="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 cursor-pointer text-[9px]"
                title="新建数据集"
              >
                <Plus class="w-3 h-3" />
                <span>新建</span>
              </button>
            </div>

            <div
              v-for="ds in datasets"
              :key="ds.id"
              @click="selectDataset(ds)"
              class="p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer space-y-1 group relative"
              :class="selectedDatasetId === ds.id 
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-md font-bold' 
                : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900'"
            >
              <div class="flex items-center justify-between">
                <span class="truncate pr-4">{{ ds.name }}</span>
                <span 
                  class="w-2 h-2 rounded-full shrink-0 ml-1"
                  :class="ds.isStreaming ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-600'"
                />
              </div>
              <p class="text-[10px] text-slate-400 line-clamp-1">
                {{ ds.description }}
              </p>
              <div class="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span>刷新率: {{ ds.updateIntervalMs }}ms</span>
                <span class="uppercase">{{ ds.type }}</span>
              </div>

              <!-- Delete Button -->
              <button
                v-if="datasets.length > 1"
                @click.stop="deleteDataset(ds.id)"
                class="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded hover:bg-red-950/80 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                title="删除数据集"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>

          <div class="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[10px] text-slate-400">
            💡 提示：在右侧属性面板选择组件后，可在「数据」页签中一键关联此数据集及字段。
          </div>
        </div>

        <!-- Selected Dataset Detail Panel -->
        <div v-if="selectedDataset()" class="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col font-mono text-xs space-y-4">
          <!-- Toolbar -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <div class="text-sm font-bold text-white flex items-center gap-2">
                <span>{{ selectedDataset().name }}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  ID: {{ selectedDataset().id }}
                </span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">
                {{ selectedDataset().description }}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="toggleStreaming(selectedDataset().id)"
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border"
                :class="selectedDataset().isStreaming 
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' 
                  : 'bg-slate-900 border-slate-700 text-slate-400'"
              >
                <Pause v-if="selectedDataset().isStreaming" class="w-3.5 h-3.5" />
                <Play v-else class="w-3.5 h-3.5" />
                <span>{{ selectedDataset().isStreaming ? '模拟流运行中' : '模拟流已暂停' }}</span>
              </button>

              <!-- View Switch Buttons -->
              <div class="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  @click="viewMode = 'fields'"
                  class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
                  :class="viewMode === 'fields' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'"
                >
                  字段列表
                </button>
                <button
                  @click="startEditJson"
                  class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
                  :class="viewMode === 'json' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'"
                >
                  JSON 源码
                </button>
                <button
                  @click="viewMode = 'settings'"
                  class="px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
                  :class="viewMode === 'settings' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'"
                >
                  配置
                </button>
              </div>
            </div>
          </div>

          <!-- 1. JSON Editor View -->
          <div v-if="viewMode === 'json'" class="flex-1 flex flex-col space-y-2">
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>编辑当前数据集的静态 JSON 数据结构:</span>
              <div class="flex items-center gap-2">
                <button
                  @click="viewMode = 'fields'"
                  class="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer"
                >
                  取消
                </button>
                <button
                  @click="saveEditJson"
                  class="px-3 py-1 rounded bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 cursor-pointer"
                >
                  保存并生效
                </button>
              </div>
            </div>

            <div v-if="jsonError" class="p-2 rounded bg-red-950/80 border border-red-500/50 text-red-300 text-[10px]">
              {{ jsonError }}
            </div>

            <textarea
              v-model="jsonString"
              rows="12"
              class="w-full flex-1 p-3 bg-slate-950 border border-cyan-500/40 rounded-xl font-mono text-xs text-cyan-300 outline-hidden custom-scrollbar"
            />
          </div>

          <!-- 2. Dataset Settings View -->
          <div v-else-if="viewMode === 'settings'" class="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div class="text-sm font-bold text-cyan-300">数据集基础属性配置</div>

            <div>
              <label class="text-[10px] text-slate-400 block mb-1">数据集名称</label>
              <input
                v-model="editName"
                type="text"
                class="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-white outline-hidden"
              />
            </div>

            <div>
              <label class="text-[10px] text-slate-400 block mb-1">功能描述</label>
              <input
                v-model="editDescription"
                type="text"
                class="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-white outline-hidden"
              />
            </div>

            <div>
              <label class="text-[10px] text-slate-400 block mb-1">动态数据刷新间隔 (毫秒)</label>
              <input
                v-model="editInterval"
                type="number"
                min="200"
                step="100"
                class="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-white outline-hidden"
              />
            </div>

            <div class="pt-2 flex justify-end">
              <button
                @click="saveDatasetSettings"
                class="px-4 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 cursor-pointer"
              >
                保存配置
              </button>
            </div>
          </div>

          <!-- 3. Dataset Field Keys & Live Telemetry Inspector View -->
          <div v-else class="space-y-4">
            <!-- Add New Field Form -->
            <div class="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 space-y-2">
              <div class="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Plus class="w-3.5 h-3.5 text-cyan-400" />
                <span>新增遥测字段</span>
              </div>

              <div class="grid grid-cols-4 gap-2">
                <div>
                  <label class="text-[9px] text-slate-400 block mb-0.5">字段键名 (Key)</label>
                  <input
                    v-model="newFieldName"
                    placeholder="如: voltage"
                    class="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2 py-1 text-white outline-hidden"
                  />
                </div>
                <div>
                  <label class="text-[9px] text-slate-400 block mb-0.5">中文描述</label>
                  <input
                    v-model="newFieldLabel"
                    placeholder="如: 额定电压"
                    class="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2 py-1 text-white outline-hidden"
                  />
                </div>
                <div>
                  <label class="text-[9px] text-slate-400 block mb-0.5">数据类型</label>
                  <select
                    v-model="newFieldType"
                    class="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2 py-1 text-cyan-300 outline-hidden"
                  >
                    <option value="number">浮点数 / 数值 (number)</option>
                    <option value="string">文本 (string)</option>
                    <option value="boolean">布尔值 (boolean)</option>
                  </select>
                </div>
                <div>
                  <label class="text-[9px] text-slate-400 block mb-0.5">初始默认值</label>
                  <div class="flex items-center gap-1.5">
                    <input
                      v-model="newFieldValue"
                      placeholder="如: 380.00"
                      class="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-2 py-1 text-white outline-hidden"
                    />
                    <button
                      @click="addNewField"
                      class="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 cursor-pointer"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Field List Grid -->
            <div>
              <div class="text-[11px] font-bold text-slate-300 flex items-center justify-between mb-2">
                <span>实时遥测字段列表 ({{ selectedDataset().fields.length }})</span>
                <span class="text-[10px] text-emerald-400 flex items-center gap-1">
                  <RefreshCw class="w-3 h-3 animate-spin" />
                  动态时序流更新中
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="field in selectedDataset().fields"
                  :key="field.name"
                  class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between group hover:border-cyan-500/40 transition-colors"
                >
                  <div class="min-w-0 pr-2">
                    <div class="font-bold text-cyan-300 truncate">{{ field.name }}</div>
                    <div class="text-[10px] text-slate-400 truncate">{{ field.label }}</div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="text-right">
                      <div class="text-xs font-bold text-emerald-400 font-mono">
                        {{ selectedDataset().data[field.name] }}
                      </div>
                      <div class="text-[9px] text-slate-500 uppercase">{{ field.type }}</div>
                    </div>
                    <button
                      @click="deleteField(field.name)"
                      class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950/80 text-slate-500 hover:text-red-400 cursor-pointer transition-all"
                      title="删除字段"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
