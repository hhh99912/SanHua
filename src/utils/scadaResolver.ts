import { DatasetItem, ScadaDeviceItem } from '../types';

/**
 * Resolves a telemetry/tele-signal/energy value from bound dataset or mappings.
 * Supports:
 * 1. Direct key match in `dataset.data[key]`
 * 2. Device-level search by `${deviceId}_${category}_${pointId}`
 * 3. Point-level factor multiplication
 * 4. Custom fallback values
 */
export function resolveDataPointValue(
  datasets: DatasetItem[] | undefined,
  datasetId: string | undefined,
  key: string | undefined,
  fallbackVal: any = undefined
): any {
  if (!datasets || !datasetId || !key) {
    return fallbackVal;
  }

  const ds = datasets.find(d => d.id === datasetId);
  if (!ds) return fallbackVal;

  // 1. Direct match in flattened dataset.data
  if (ds.data && ds.data[key] !== undefined) {
    return ds.data[key];
  }

  // 2. Direct device point lookup if key formatted like 'DEV-101_YC_1' or 'DEV-101_YX_1'
  if (Array.isArray(ds.devices)) {
    const parts = key.split('_');
    if (parts.length >= 3) {
      const devId = parts[0];
      const type = parts[1]; // YC, YX, DD, YT
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
          // 严谨 SCADA 规约：遥控本身为命令输出通道无采样值，画面显示取其关联校验遥信点 (targetPointId) 的值
          const yk = dev.teleControls?.find(p => String(p.pointId) === String(ptId));
          const verifyYxId = yk?.targetPointId !== undefined ? yk.targetPointId : 1;
          const yx = dev.teleSignals?.find(p => String(p.pointId) === String(verifyYxId));
          if (yx) return yx.value;
        } else if (type === 'YT') {
          // 严谨 SCADA 规约：遥调本身为设定输出通道无采样值，画面显示优先取其关联校验遥测点 (targetYcPointId) 的实测值
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
 * Resolves device tele-signal (YX) with support for full integer enums (0, 1, 2, 3, 4, etc.)
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
    num = raw;
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

  // Find label if dataset has enum mapping
  let statusText = `状态 (${num})`;
  let isClosed = num === 1;
  let isOpen = num === 0;
  let isFault = num === 2;
  let isTest = num === 3;
  let isWorking = num === 4 || num === 1;

  let color = '#10b981'; // Green for normal/open
  if (isClosed || isWorking) {
    color = '#ef4444'; // Red for energized/closed/working in Chinese power standards
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
