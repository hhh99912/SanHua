import { DatasetItem, ScreenComponent, ScadaDeviceItem } from '../types';

/**
 * Strict Numeric Sanitizer & Parser
 * Enforces pure numeric parsing for all numeric components and fields.
 * Strictly strips any text/letters/symbols (except minus sign and decimal dot).
 */
export function parseStrictNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    // Strip everything except digits, negative sign, and decimal point
    const sanitized = trimmed.replace(/[^0-9.-]/g, '');
    if (!sanitized || sanitized === '-' || sanitized === '.') return fallback;
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Resolves a telemetry/tele-signal/energy value from bound dataset or point key.
 * Supports:
 * 1. Direct point key: e.g. 'DEV-101_YC_1', 'DEV-101_YX_1'
 * 2. Template expression: '{{DEV-101_YC_1}}' or '$bind(DEV-101_YC_1)'
 * 3. Direct lookup in dataset.data[key]
 * 4. Device-level search across devices[].telemetries, teleSignals, energies, teleControls, teleRegulations
 */
export function resolveDataPointValue(
  datasets: DatasetItem[] | undefined,
  datasetId: string | undefined,
  keyOrExpr: string | undefined,
  fallbackVal: any = undefined
): any {
  if (!datasets || !keyOrExpr) {
    return fallbackVal;
  }

  // Extract clean point key from expression if wrapped in {{...}} or $bind(...)
  let cleanKey = String(keyOrExpr).trim();
  const bindMatch = cleanKey.match(/^\$bind\((.+)\)$/i) || cleanKey.match(/^\{\{(.+)\}\}$/);
  if (bindMatch) {
    cleanKey = bindMatch[1].trim();
  }

  const effectiveDatasetId = datasetId || datasets[0]?.id;
  const ds = datasets.find(d => d.id === effectiveDatasetId) || datasets[0];
  if (!ds) return fallbackVal;

  // 1. Direct match in flattened dataset.data
  if (ds.data && ds.data[cleanKey] !== undefined) {
    return ds.data[cleanKey];
  }

  // 2. Direct device point lookup if key formatted like 'DEV-101_YC_1' or 'DEV-101_YX_1'
  if (Array.isArray(ds.devices)) {
    const parts = cleanKey.split('_');
    if (parts.length >= 3) {
      const devId = parts[0];
      const type = parts[1].toUpperCase(); // YC, YX, DD, YK, YT
      const ptId = parts.slice(2).join('_');

      const dev = ds.devices.find(d => d.deviceId === devId);
      if (dev) {
        if (type === 'YC') {
          const pt = dev.telemetries?.find(p => String(p.pointId) === String(ptId));
          if (pt) return pt.value;
        } else if (type === 'YX') {
          const pt = dev.teleSignals?.find(p => String(p.pointId) === String(ptId));
          if (pt) return pt.value;
        } else if (type === 'DD') {
          const pt = dev.energies?.find(p => String(p.pointId) === String(ptId));
          if (pt) return pt.value;
        } else if (type === 'YK') {
          const yk = dev.teleControls?.find(p => String(p.pointId) === String(ptId));
          const verifyYxId = yk?.targetPointId !== undefined ? yk.targetPointId : 1;
          const yx = dev.teleSignals?.find(p => String(p.pointId) === String(verifyYxId));
          if (yx) return yx.value;
        } else if (type === 'YT') {
          const yt = dev.teleRegulations?.find(p => String(p.pointId) === String(ptId));
          if (yt?.targetYcPointId !== undefined) {
            const yc = dev.telemetries?.find(p => String(p.pointId) === String(yt.targetYcPointId));
            if (yc) return yc.value;
          }
          if (yt) return yt.value;
        }
      }
    }
  }

  return fallbackVal;
}

/**
 * Recursively resolves an object by injecting dynamic live data into bound fields or {{expressions}}.
 */
function resolveDynamicObjectValues(
  obj: any,
  bindings: Record<string, string> | undefined,
  datasets: DatasetItem[] | undefined,
  datasetId: string | undefined
): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => resolveDynamicObjectValues(item, bindings, datasets, datasetId));
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      // 1. Check if direct property binding exists in bindings
      if (bindings && bindings[key]) {
        const boundKey = bindings[key];
        const liveVal = resolveDataPointValue(datasets, datasetId, boundKey, val);
        result[key] = liveVal !== undefined ? liveVal : val;
      } else if (typeof val === 'string') {
        // 2. Check if string contains template expressions like {{DEV-101_YC_1}} or $bind(...)
        if (val.startsWith('$bind(') && val.endsWith(')')) {
          const pointKey = val.slice(6, -1).trim();
          result[key] = resolveDataPointValue(datasets, datasetId, pointKey, val);
        } else if (val.includes('{{') && val.includes('}}')) {
          const resolvedStr = val.replace(/\{\{([^}]+)\}\}/g, (_, pointKey) => {
            const resolved = resolveDataPointValue(datasets, datasetId, pointKey.trim(), pointKey);
            return resolved !== undefined ? String(resolved) : '';
          });
          // If the entire string was a single expression and resolved to a number, preserve numeric type
          if (/^\{\{[^}]+\}\}$/.test(val)) {
            const pointKey = val.slice(2, -2).trim();
            const resolvedNum = resolveDataPointValue(datasets, datasetId, pointKey, undefined);
            if (typeof resolvedNum === 'number') {
              result[key] = resolvedNum;
              continue;
            }
          }
          result[key] = resolvedStr;
        } else {
          result[key] = val;
        }
      } else if (typeof val === 'object') {
        result[key] = resolveDynamicObjectValues(val, bindings, datasets, datasetId);
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  return obj;
}

/**
 * Unified Component Dynamic Data Resolver
 * Dynamically resolves the component's full JSON structure and live properties in real-time.
 * Eliminates the need for manual static data splicing by combining:
 * 1. Component `data.staticData` / JSON schema template
 * 2. Component `data.bindings` (e.g. { "value": "DEV-101_YC_1", "min": "DEV-101_YC_1_min" })
 * 3. Component `data.mapping` (compatible with legacy valueKey / stateKey / categoriesKey / seriesKey)
 */
export function resolveComponentDynamicData(
  component: ScreenComponent,
  datasets?: DatasetItem[]
): Record<string, any> {
  const dataConfig = component.data;
  const datasetId = dataConfig?.datasetId;
  const mapping = dataConfig?.mapping || ({} as any);
  const bindings: Record<string, string> = { ...(dataConfig?.bindings || {}) };

  // Sync mapping keys into bindings if not already present
  if (mapping.valueKey && !bindings.value) {
    bindings.value = mapping.valueKey;
  }
  if (mapping.stateKey && !bindings.state) {
    bindings.state = mapping.stateKey;
  }
  if (mapping.unitKey && !bindings.unit) {
    bindings.unit = mapping.unitKey;
  }

  let baseData: any = {};
  if (dataConfig?.staticData !== undefined && dataConfig.staticData !== null) {
    if (typeof dataConfig.staticData === 'object') {
      baseData = JSON.parse(JSON.stringify(dataConfig.staticData));
    } else {
      baseData = { value: dataConfig.staticData };
    }
  } else {
    // Fallback base data from customProps / style / name
    baseData = {
      value: component.customProps?.value ?? 0,
      state: component.customProps?.state ?? 0,
      unit: component.customProps?.unit || component.style?.unit || '',
      label: component.customProps?.label || component.name || ''
    };
  }

  // Dynamically resolve properties with live dataset values
  const resolved = resolveDynamicObjectValues(baseData, bindings, datasets, datasetId);

  // If mapping has valueKey and resolved.value wasn't set, resolve it
  if (mapping.valueKey && resolved.value === undefined) {
    resolved.value = resolveDataPointValue(datasets, datasetId, mapping.valueKey, component.customProps?.value ?? 0);
  }
  // If mapping has stateKey and resolved.state wasn't set, resolve it
  if (mapping.stateKey && resolved.state === undefined) {
    resolved.state = resolveDataPointValue(datasets, datasetId, mapping.stateKey, component.customProps?.state ?? 0);
  }

  return resolved;
}

/**
 * Strict Live Numeric Extractor for Numeric Components
 * Guarantees that only pure numeric values are returned, rejecting any text.
 */
export function getComponentLiveNumericValue(
  component: ScreenComponent,
  datasets?: DatasetItem[],
  fallback = 0
): number {
  const dynamic = resolveComponentDynamicData(component, datasets);
  if (dynamic && dynamic.value !== undefined) {
    return parseStrictNumber(dynamic.value, fallback);
  }
  const customPropVal = component.customProps?.value;
  if (customPropVal !== undefined) {
    return parseStrictNumber(customPropVal, fallback);
  }
  return fallback;
}

/**
 * Resolves device tele-signal (YX) state with strict numeric enum conversion
 */
export function resolveTeleSignalState(
  datasets: DatasetItem[] | undefined,
  datasetId: string | undefined,
  stateKey: string | undefined,
  defaultVal: number | string = 0
): {
  numericValue: number;
  statusText: string;
  isClosed: boolean;
  isOpen: boolean;
  isFault: boolean;
  isTest: boolean;
  isWorking: boolean;
  color: string;
} {
  const raw = resolveDataPointValue(datasets, datasetId, stateKey, defaultVal);
  let num = 0;
  if (typeof raw === 'number') {
    num = isNaN(raw) ? 0 : raw;
  } else if (typeof raw === 'boolean') {
    num = raw ? 1 : 0;
  } else if (typeof raw === 'string') {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      num = parsed;
    } else {
      const lower = raw.toLowerCase();
      if (lower.includes('合') || lower.includes('close') || lower.includes('run') || lower === 'on') num = 1;
      else if (lower.includes('分') || lower.includes('open') || lower.includes('stop') || lower === 'off') num = 0;
      else if (lower.includes('障') || lower.includes('fault') || lower.includes('trip') || lower.includes('err')) num = 2;
      else if (lower.includes('试') || lower.includes('test')) num = 3;
      else if (lower.includes('工') || lower.includes('work')) num = 4;
    }
  }

  let statusText = `状态 (${num})`;
  let isClosed = num === 1;
  let isOpen = num === 0;
  let isFault = num === 2;
  let isTest = num === 3;
  let isWorking = num === 4 || num === 1;

  let color = '#10b981'; // Green for normal/open/0 state
  if (isClosed || isWorking) {
    color = '#ef4444'; // Red for energized/closed/1 state
  } else if (isFault) {
    color = '#f59e0b'; // Amber for fault/alarm
  } else if (isTest) {
    color = '#3b82f6'; // Blue for test position
  }

  if (num === 0) statusText = '分闸 (0)';
  else if (num === 1) statusText = '合闸 (1)';
  else if (num === 2) statusText = '故障 (2)';
  else if (num === 3) statusText = '试验位 (3)';
  else if (num === 4) statusText = '工作位 (4)';

  return {
    numericValue: num,
    statusText,
    isClosed,
    isOpen,
    isFault,
    isTest,
    isWorking,
    color
  };
}
