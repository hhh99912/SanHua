<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { 
  Leafer, 
  Rect, 
  Ellipse, 
  Line, 
  Text, 
  Group, 
  Polygon, 
  Path, 
  Box 
} from 'leafer-ui';
import { 
  Sun, 
  Zap, 
  ShieldCheck, 
  UserCheck, 
  Eye, 
  EyeOff, 
  LogIn, 
  Lock,
  User,
  AlertCircle,
  Activity,
  ChevronDown,
  Cpu,
  Layers,
  BatteryCharging
} from 'lucide-vue-next';
import { currentUser, loginUser, PRESET_USERS } from '../utils/auth';

const emit = defineEmits<{
  (e: 'login:success'): void;
}>();

// Container & Canvas references
const leaferContainerRef = ref<HTMLDivElement | null>(null);
let leaferApp: Leafer | null = null;
let animFrameId: number | null = null;

// User List from PRESET_USERS
const userList = computed(() => PRESET_USERS);

// Form state - Default to first user (系统管理员) and standard password (123456)
const selectedUsername = ref(PRESET_USERS[0]?.username || 'admin');
const password = ref('123456');
const showPassword = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);

// Active selected user profile details
const currentSelectedUser = computed(() => {
  return PRESET_USERS.find(u => u.username === selectedUsername.value) || PRESET_USERS[0];
});

// Real-time Clock
const currentTime = ref('');
const currentDate = ref('');
let timerId: any = null;

const updateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  currentDate.value = `${year}-${month}-${day}`;
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

// Particles & Currents Animation State
interface PhotonParticle {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  size: number;
  color: string;
  shape?: Ellipse;
}

interface CurrentPulse {
  pathPoints: { x: number; y: number }[];
  progress: number;
  speed: number;
  color: string;
  size: number;
  shape?: Ellipse;
}

const particles: PhotonParticle[] = [];
const currentPulses: CurrentPulse[] = [];

// Handle Login Form Submit
const handleLogin = () => {
  errorMessage.value = '';
  if (!selectedUsername.value) {
    errorMessage.value = '请选择登录用户';
    return;
  }
  if (!password.value.trim()) {
    errorMessage.value = '请输入登录密码';
    return;
  }

  isSubmitting.value = true;
  setTimeout(() => {
    const res = loginUser(selectedUsername.value, password.value);
    isSubmitting.value = false;
    if (res.success) {
      emit('login:success');
    } else {
      errorMessage.value = res.message;
    }
  }, 180);
};

// Initialize Rich Photovoltaic Scene (No blank spaces, sun placed properly below header)
const initLeaferScene = () => {
  if (!leaferContainerRef.value) return;

  const width = leaferContainerRef.value.clientWidth || window.innerWidth;
  const height = leaferContainerRef.value.clientHeight || window.innerHeight;

  // Clear animation arrays
  particles.length = 0;
  currentPulses.length = 0;

  // 1. Create Leafer Canvas Instance
  leaferApp = new Leafer({
    view: leaferContainerRef.value,
    width,
    height,
    fill: '#020614' // Deep tech midnight blue
  });

  const rootGroup = new Group();
  leaferApp.add(rootGroup);

  // 2. Background Sky Gradient, Atmosphere & Mountains
  const bgGroup = new Group();
  rootGroup.add(bgGroup);

  const horizonY = height * 0.44;

  // Sky ambient gradient
  const skyGlow = new Rect({
    x: 0,
    y: 0,
    width,
    height: horizonY + 80,
    fill: 'radial-gradient(ellipse at 22% 30%, rgba(245, 158, 11, 0.22) 0%, rgba(14, 116, 144, 0.16) 45%, rgba(2, 6, 20, 0.96) 88%)'
  });
  bgGroup.add(skyGlow);

  // Solar Radiation Field Equipotential Contour Arcs in Sky
  const contourCenter = { x: Math.max(160, width * 0.18), y: Math.max(160, height * 0.24) };
  for (let c = 1; c <= 4; c++) {
    const radius = 140 + c * 85;
    const contour = new Ellipse({
      x: contourCenter.x - radius,
      y: contourCenter.y - radius,
      width: radius * 2,
      height: radius * 2,
      stroke: `rgba(245, 158, 11, ${0.08 - c * 0.015})`,
      strokeWidth: 1,
      dashPattern: [6, 8]
    });
    bgGroup.add(contour);
  }

  // Distant Mountain Ranges (Layer 1 - Far Silhouette)
  const mountainFar = new Path({
    path: `M 0 ${horizonY - 10} 
           Q ${width * 0.12} ${horizonY - 90}, ${width * 0.28} ${horizonY - 40} 
           T ${width * 0.52} ${horizonY - 110} 
           T ${width * 0.76} ${horizonY - 50} 
           T ${width} ${horizonY - 30} 
           L ${width} ${height} L 0 ${height} Z`,
    fill: 'rgba(4, 15, 36, 0.75)',
    stroke: 'rgba(0, 242, 255, 0.15)',
    strokeWidth: 1
  });
  bgGroup.add(mountainFar);

  // Distant Mountain Ranges (Layer 2 - Mid Ridge)
  const mountainNear = new Path({
    path: `M 0 ${horizonY + 25} 
           Q ${width * 0.2} ${horizonY - 55}, ${width * 0.38} ${horizonY + 15} 
           T ${width * 0.68} ${horizonY - 65} 
           T ${width} ${horizonY + 20} 
           L ${width} ${height} L 0 ${height} Z`,
    fill: 'rgba(7, 24, 52, 0.9)',
    stroke: 'rgba(0, 242, 255, 0.3)',
    strokeWidth: 1.2
  });
  bgGroup.add(mountainNear);

  // Perspective Horizon Ground Grid Lines (Dense fill, no blank ground)
  const gridLineCount = 32;
  for (let i = 0; i <= gridLineCount; i++) {
    const yRatio = i / gridLineCount;
    const y = horizonY + Math.pow(yRatio, 1.6) * (height - horizonY);
    const line = new Line({
      points: [0, y, width, y],
      stroke: `rgba(0, 242, 255, ${0.04 + yRatio * 0.14})`,
      strokeWidth: 1
    });
    bgGroup.add(line);
  }

  // Perspective Vertical Ground Ray Lines
  const vLineCount = 42;
  for (let i = 0; i <= vLineCount; i++) {
    const xBottom = (i / vLineCount) * width;
    const xTop = width * 0.48 + (i / vLineCount - 0.5) * (width * 0.42);
    const line = new Line({
      points: [xTop, horizonY, xBottom, height],
      stroke: 'rgba(0, 242, 255, 0.08)',
      strokeWidth: 1
    });
    bgGroup.add(line);
  }

  // Distant Wind Turbines along the Mountain Horizon
  const windTurbinePositions = [width * 0.32, width * 0.44, width * 0.56, width * 0.70, width * 0.86];
  windTurbinePositions.forEach((wtX, idx) => {
    const wtH = 34 + (idx % 3) * 12;
    const wtY = horizonY - 20 - (idx % 2) * 25;
    const tower = new Line({
      points: [wtX, wtY + wtH, wtX, wtY],
      stroke: 'rgba(148, 163, 184, 0.55)',
      strokeWidth: 1.5
    });
    const nacelle = new Ellipse({
      x: wtX - 2,
      y: wtY - 2,
      width: 4,
      height: 4,
      fill: 'rgba(241, 245, 249, 0.85)'
    });
    const blade1 = new Line({ points: [wtX, wtY, wtX, wtY - 18], stroke: 'rgba(203, 213, 225, 0.7)', strokeWidth: 1 });
    const blade2 = new Line({ points: [wtX, wtY, wtX - 15, wtY + 9], stroke: 'rgba(203, 213, 225, 0.7)', strokeWidth: 1 });
    const blade3 = new Line({ points: [wtX, wtY, wtX + 15, wtY + 9], stroke: 'rgba(203, 213, 225, 0.7)', strokeWidth: 1 });
    bgGroup.add(tower);
    bgGroup.add(nacelle);
    bgGroup.add(blade1);
    bgGroup.add(blade2);
    bgGroup.add(blade3);
  });

  // 3. Radiant Sun & Solar Radiation Corona (Positioned comfortably below the top navbar header)
  const sunGroup = new Group();
  rootGroup.add(sunGroup);

  const sunX = Math.max(160, width * 0.18);
  const sunY = Math.max(160, height * 0.24); // Low enough so no top navbar clipping!

  // Multi-layer Corona Halos
  const sunHalo3 = new Ellipse({
    x: sunX - 110,
    y: sunY - 110,
    width: 220,
    height: 220,
    fill: 'radial-gradient(circle, rgba(251, 191, 36, 0.16) 0%, rgba(245, 158, 11, 0) 72%)'
  });
  const sunHalo2 = new Ellipse({
    x: sunX - 70,
    y: sunY - 70,
    width: 140,
    height: 140,
    fill: 'radial-gradient(circle, rgba(251, 191, 36, 0.32) 0%, rgba(245, 158, 11, 0) 78%)'
  });
  const sunHalo1 = new Ellipse({
    x: sunX - 42,
    y: sunY - 42,
    width: 84,
    height: 84,
    fill: 'radial-gradient(circle, rgba(254, 240, 138, 0.7) 0%, rgba(245, 158, 11, 0.2) 80%)'
  });
  const sunCore = new Ellipse({
    x: sunX - 28,
    y: sunY - 28,
    width: 56,
    height: 56,
    fill: '#fbbf24',
    stroke: '#fef08a',
    strokeWidth: 2.5,
    shadow: {
      color: '#f59e0b',
      blur: 28,
      x: 0,
      y: 0
    }
  });

  sunGroup.add(sunHalo3);
  sunGroup.add(sunHalo2);
  sunGroup.add(sunHalo1);
  sunGroup.add(sunCore);

  // Rotating Solar Flare Rays
  const rayCount = 18;
  const sunRays: Line[] = [];
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const r1 = 34;
    const r2 = (i % 2 === 0) ? 68 : 50;
    const ray = new Line({
      points: [
        sunX + Math.cos(angle) * r1,
        sunY + Math.sin(angle) * r1,
        sunX + Math.cos(angle) * r2,
        sunY + Math.sin(angle) * r2
      ],
      stroke: (i % 2 === 0) ? 'rgba(253, 224, 71, 0.9)' : 'rgba(245, 158, 11, 0.75)',
      strokeWidth: (i % 2 === 0) ? 2 : 1.2
    });
    sunGroup.add(ray);
    sunRays.push(ray);
  }

  // 4. Dense Multi-Row Photovoltaic Arrays with Tracking Brackets & Combiner Boxes
  const pvGroup = new Group();
  rootGroup.add(pvGroup);

  // 8 Dense Solar Array Clusters across foreground, midground and distant slope
  const pvClusters = [
    // Distant Hillside Terraced Arrays
    { id: '1', x: width * 0.02, y: height * 0.46, scaleW: width * 0.15, scaleH: height * 0.11, rows: 2, cols: 5, angle: 18 },
    { id: '2', x: width * 0.19, y: height * 0.47, scaleW: width * 0.16, scaleH: height * 0.12, rows: 2, cols: 5, angle: 18 },
    { id: '3', x: width * 0.37, y: height * 0.48, scaleW: width * 0.14, scaleH: height * 0.12, rows: 2, cols: 4, angle: 18 },
    
    // Midground Tracking Bracket Arrays
    { id: '4', x: width * 0.02, y: height * 0.60, scaleW: width * 0.18, scaleH: height * 0.15, rows: 3, cols: 5, angle: 26 },
    { id: '5', x: width * 0.22, y: height * 0.61, scaleW: width * 0.20, scaleH: height * 0.16, rows: 3, cols: 5, angle: 26 },
    { id: '6', x: width * 0.44, y: height * 0.62, scaleW: width * 0.12, scaleH: height * 0.15, rows: 3, cols: 3, angle: 26 },

    // Foreground High-Def Single-Axis Tracking Arrays
    { id: '7', x: width * 0.03, y: height * 0.79, scaleW: width * 0.22, scaleH: height * 0.17, rows: 3, cols: 6, angle: 32 },
    { id: '8', x: width * 0.27, y: height * 0.80, scaleW: width * 0.23, scaleH: height * 0.17, rows: 3, cols: 6, angle: 32 }
  ];

  pvClusters.forEach((cluster) => {
    const clusterBox = new Group({
      x: cluster.x,
      y: cluster.y
    });

    const rows = cluster.rows;
    const cols = cluster.cols;
    const panelGapX = 4;
    const panelGapY = 6;
    const pW = (cluster.scaleW - (cols - 1) * panelGapX) / cols;
    const pH = (cluster.scaleH - (rows - 1) * panelGapY) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * (pW + panelGapX) + r * 6;
        const py = r * (pH + panelGapY);

        // 3D Parallelogram Solar Module
        const skewX = 6;
        const panel = new Polygon({
          points: [
            px + skewX, py,
            px + pW + skewX, py,
            px + pW, py + pH,
            px, py + pH
          ],
          fill: 'linear-gradient(135deg, #09234e 0%, #03142d 100%)',
          stroke: '#00f2ff',
          strokeWidth: 0.9,
          opacity: 0.96
        });
        clusterBox.add(panel);

        // Silicon solar cell grid lines
        const midY = py + pH * 0.5;
        const cellLine = new Line({
          points: [px + skewX * 0.5, midY, px + pW + skewX * 0.5, midY],
          stroke: 'rgba(0, 242, 255, 0.45)',
          strokeWidth: 0.7
        });
        clusterBox.add(cellLine);

        // Cell vertical divider lines
        const cellV1 = new Line({
          points: [px + pW * 0.33 + skewX * 0.5, py, px + pW * 0.33, py + pH],
          stroke: 'rgba(0, 242, 255, 0.25)',
          strokeWidth: 0.5
        });
        const cellV2 = new Line({
          points: [px + pW * 0.66 + skewX * 0.5, py, px + pW * 0.66, py + pH],
          stroke: 'rgba(0, 242, 255, 0.25)',
          strokeWidth: 0.5
        });
        clusterBox.add(cellV1);
        clusterBox.add(cellV2);
      }
    }

    // Single-Axis Tracking Torque Tube Shaft under array
    const torqueTube = new Line({
      points: [0, cluster.scaleH + 2, cluster.scaleW + 10, cluster.scaleH + 2],
      stroke: 'rgba(100, 116, 139, 0.8)',
      strokeWidth: 2
    });
    clusterBox.add(torqueTube);

    // Foundation support posts
    const postCount = 3;
    for (let p = 0; p < postCount; p++) {
      const postX = (p / (postCount - 1)) * cluster.scaleW;
      const post = new Line({
        points: [postX, cluster.scaleH + 2, postX, cluster.scaleH + 14],
        stroke: '#475569',
        strokeWidth: 2
      });
      clusterBox.add(post);
    }

    // DC Combiner Box (直流汇流箱) attached at array end
    const cbX = cluster.scaleW + 8;
    const cbY = cluster.scaleH * 0.4;
    const cbBox = new Rect({
      x: cbX,
      y: cbY,
      width: 14,
      height: 20,
      cornerRadius: 2,
      fill: '#0f2744',
      stroke: '#38bdf8',
      strokeWidth: 1
    });
    const cbLed = new Ellipse({
      x: cbX + 5,
      y: cbY + 4,
      width: 4,
      height: 4,
      fill: '#10b981'
    });
    clusterBox.add(cbBox);
    clusterBox.add(cbLed);

    pvGroup.add(clusterBox);

    // Continuous Photons streaming from Sun to each PV array cluster
    const photonCount = 4;
    for (let p = 0; p < photonCount; p++) {
      particles.push({
        startX: sunX + (Math.random() - 0.5) * 30,
        startY: sunY + (Math.random() - 0.5) * 30,
        targetX: cluster.x + Math.random() * cluster.scaleW,
        targetY: cluster.y + Math.random() * cluster.scaleH,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.006,
        size: 2.2 + Math.random() * 1.8,
        color: '#fef08a'
      });
    }
  });

  // 5. Main Photovoltaic Station Equipment Zone (Midground Infrastructure)
  const stationGroup = new Group();
  rootGroup.add(stationGroup);

  // 5.1 Photovoltaic Control & Dispatch Building (光伏电站主控室/配电室)
  const bldgX = width * 0.56;
  const bldgY = height * 0.52;
  const bldgGroup = new Group({ x: bldgX, y: bldgY });

  const bldgBody = new Rect({
    x: 0,
    y: 0,
    width: 96,
    height: 75,
    cornerRadius: 4,
    fill: 'linear-gradient(180deg, #091d38 0%, #040e1d 100%)',
    stroke: 'rgba(56, 189, 248, 0.6)',
    strokeWidth: 1.2
  });
  bldgGroup.add(bldgBody);

  // Control Room Windows
  for (let w = 0; w < 3; w++) {
    const win = new Rect({
      x: 10 + w * 28,
      y: 14,
      width: 20,
      height: 18,
      cornerRadius: 2,
      fill: 'rgba(56, 189, 248, 0.25)',
      stroke: 'rgba(56, 189, 248, 0.7)',
      strokeWidth: 1
    });
    bldgGroup.add(win);
  }

  // Building Rooftop Solar Panels
  const bldgRoofPV = new Polygon({
    points: [
      6, -6,
      90, -6,
      82, 0,
      14, 0
    ],
    fill: '#0284c7',
    stroke: '#38bdf8',
    strokeWidth: 1
  });
  bldgGroup.add(bldgRoofPV);

  // Communication Antenna & Lightning Rod on roof
  const antennaPole = new Line({ points: [82, -6, 82, -26], stroke: '#94a3b8', strokeWidth: 1.5 });
  const antennaDish = new Ellipse({ x: 77, y: -24, width: 10, height: 6, fill: '#0284c7', stroke: '#38bdf8', strokeWidth: 1 });
  bldgGroup.add(antennaPole);
  bldgGroup.add(antennaDish);

  const bldgSignBoard = new Rect({
    x: 8,
    y: 46,
    width: 80,
    height: 20,
    cornerRadius: 3,
    fill: '#081a30',
    stroke: '#38bdf8',
    strokeWidth: 1.2
  });
  bldgGroup.add(bldgSignBoard);

  const bldgLabel = new Text({
    x: 8,
    y: 46,
    width: 80,
    height: 20,
    text: '站控配电中心',
    fontSize: 10,
    fontWeight: 'bold',
    fill: '#38bdf8',
    textAlign: 'center',
    verticalAlign: 'middle'
  });
  bldgGroup.add(bldgLabel);
  stationGroup.add(bldgGroup);

  // 5.2 Battery Energy Storage System (BESS 储能舱/电池集装箱)
  const bessX = width * 0.47;
  const bessY = height * 0.74;
  const bessGroup = new Group({ x: bessX, y: bessY });

  const bessBody = new Rect({
    x: 0,
    y: 0,
    width: 88,
    height: 60,
    cornerRadius: 4,
    fill: 'linear-gradient(180deg, #0d2838 0%, #05141e 100%)',
    stroke: '#10b981',
    strokeWidth: 1.2,
    shadow: {
      color: 'rgba(16, 185, 129, 0.3)',
      blur: 10,
      x: 0,
      y: 0
    }
  });
  bessGroup.add(bessBody);

  // Container vertical structural ribs
  for (let r = 1; r <= 4; r++) {
    const rib = new Line({ points: [r * 17, 4, r * 17, 56], stroke: 'rgba(16, 185, 129, 0.35)', strokeWidth: 1 });
    bessGroup.add(rib);
  }

  // BESS HVAC Chiller unit at side
  const hvac = new Rect({ x: -14, y: 12, width: 14, height: 36, cornerRadius: 2, fill: '#061a24', stroke: '#10b981', strokeWidth: 1 });
  bessGroup.add(hvac);

  const bessLabel = new Text({
    x: 0,
    y: 18,
    width: 88,
    height: 16,
    text: '储能电池舱',
    fontSize: 10,
    fill: '#10b981',
    fontWeight: 'bold',
    textAlign: 'center',
    verticalAlign: 'middle'
  });
  const bessTag = new Text({
    x: 0,
    y: 34,
    width: 88,
    height: 16,
    text: 'BESS 储能系统',
    fontSize: 9,
    fill: '#6ee7b7',
    fontFamily: 'monospace',
    textAlign: 'center',
    verticalAlign: 'middle'
  });
  bessGroup.add(bessLabel);
  bessGroup.add(bessTag);
  stationGroup.add(bessGroup);

  // 5.3 Central Inverter Station (集中式逆变器)
  const invX1 = width * 0.58;
  const invY1 = height * 0.72;
  const invBox1 = new Group({ x: invX1, y: invY1 });

  const invBody1 = new Rect({
    x: 0,
    y: 0,
    width: 86,
    height: 82,
    cornerRadius: 6,
    fill: 'linear-gradient(180deg, #0d223f 0%, #061426 100%)',
    stroke: '#00f2ff',
    strokeWidth: 1.4,
    shadow: {
      color: 'rgba(0, 242, 255, 0.35)',
      blur: 14,
      x: 0,
      y: 0
    }
  });
  invBox1.add(invBody1);

  // Inverter LCD Screen
  const lcdScreen1 = new Rect({
    x: 10,
    y: 10,
    width: 66,
    height: 32,
    cornerRadius: 4,
    fill: '#020919',
    stroke: '#0284c7',
    strokeWidth: 1
  });
  invBox1.add(lcdScreen1);

  const lcdSine1 = new Path({
    path: 'M 14 26 Q 22 16, 30 26 T 46 26 T 62 26 T 72 26',
    stroke: '#00f2ff',
    strokeWidth: 1.5,
    fill: 'none'
  });
  invBox1.add(lcdSine1);

  const invTitle1 = new Text({
    x: 0,
    y: 46,
    width: 86,
    height: 16,
    text: '逆变一体机',
    fontSize: 10,
    fill: '#94a3b8',
    textAlign: 'center',
    verticalAlign: 'middle'
  });
  const invEff1 = new Text({
    x: 0,
    y: 60,
    width: 86,
    height: 16,
    text: 'DC / AC',
    fontSize: 10,
    fill: '#38bdf8',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    verticalAlign: 'middle'
  });
  invBox1.add(invTitle1);
  invBox1.add(invEff1);
  stationGroup.add(invBox1);

  // 5.4 Step-Up Box Transformer (35kV箱式变电站)
  const transX = invX1 + 104;
  const transY = invY1;
  const transBox = new Group({ x: transX, y: transY });

  const transBody = new Rect({
    x: 0,
    y: 0,
    width: 82,
    height: 82,
    cornerRadius: 6,
    fill: 'linear-gradient(180deg, #102a3a 0%, #061722 100%)',
    stroke: '#10b981',
    strokeWidth: 1.4,
    shadow: {
      color: 'rgba(16, 185, 129, 0.35)',
      blur: 14,
      x: 0,
      y: 0
    }
  });
  transBox.add(transBody);

  // High Voltage Bushing Terminals on top
  for (let b = 0; b < 3; b++) {
    const bushing = new Line({
      points: [18 + b * 22, 0, 18 + b * 22, -10],
      stroke: '#e2e8f0',
      strokeWidth: 2.5
    });
    const cap = new Ellipse({
      x: 16 + b * 22,
      y: -14,
      width: 5,
      height: 5,
      fill: '#f59e0b'
    });
    transBox.add(bushing);
    transBox.add(cap);
  }

  // Transformer Dual-Winding Coils Symbol
  const coil1 = new Ellipse({
    x: 23,
    y: 14,
    width: 34,
    height: 34,
    fill: 'none',
    stroke: '#10b981',
    strokeWidth: 2
  });
  const coil2 = new Ellipse({
    x: 23,
    y: 28,
    width: 34,
    height: 34,
    fill: 'none',
    stroke: '#38bdf8',
    strokeWidth: 2
  });
  transBox.add(coil1);
  transBox.add(coil2);

  const transText = new Text({
    x: 0,
    y: 60,
    width: 82,
    height: 16,
    text: '升压箱变',
    fontSize: 10,
    fill: '#10b981',
    fontWeight: 'bold',
    textAlign: 'center',
    verticalAlign: 'middle'
  });
  transBox.add(transText);
  stationGroup.add(transBox);

  // 6. High-Voltage Overhead Transmission Pylon Towers & Lines
  const towerX = transX + 105;
  const towerY = height * 0.48;
  const towerGroup = new Group({ x: towerX, y: towerY });

  // Pylon Lattice Truss
  const pylonPath = new Path({
    path: `M 26 0 L 16 16 L 36 16 Z 
           M 12 16 L 40 16 
           M 8 36 L 44 36 
           M 16 16 L 8 130 
           M 36 16 L 44 130 
           M 16 16 L 44 70 M 36 16 L 8 70 
           M 8 70 L 44 130 M 44 70 L 8 130`,
    stroke: 'rgba(56, 189, 248, 0.75)',
    strokeWidth: 1.5,
    fill: 'none'
  });
  towerGroup.add(pylonPath);

  // Crossarms with Insulators
  const crossarm1 = new Line({ points: [-5, 36, 57, 36], stroke: '#38bdf8', strokeWidth: 2 });
  const crossarm2 = new Line({ points: [-12, 70, 64, 70], stroke: '#38bdf8', strokeWidth: 2 });
  towerGroup.add(crossarm1);
  towerGroup.add(crossarm2);

  const gridTag = new Rect({
    x: -8,
    y: 135,
    width: 68,
    height: 18,
    cornerRadius: 4,
    fill: 'rgba(6, 18, 38, 0.9)',
    stroke: 'rgba(16, 185, 129, 0.6)',
    strokeWidth: 1
  });
  const gridTagText = new Text({
    x: -8,
    y: 135,
    width: 68,
    height: 18,
    text: '并网送出',
    fontSize: 9,
    fill: '#10b981',
    textAlign: 'center',
    verticalAlign: 'middle'
  });
  towerGroup.add(gridTag);
  towerGroup.add(gridTagText);
  rootGroup.add(towerGroup);

  // Distant 2nd Pylon Tower for perspective depth
  const towerX2 = towerX + 120;
  const towerY2 = height * 0.42;
  const tower2 = new Path({
    path: `M ${towerX2 + 18} ${towerY2} L ${towerX2 + 10} ${towerY2 + 12} L ${towerX2 + 26} ${towerY2 + 12} Z
           M ${towerX2 + 10} ${towerY2 + 12} L ${towerX2 + 4} ${towerY2 + 90}
           M ${towerX2 + 26} ${towerY2 + 12} L ${towerX2 + 32} ${towerY2 + 90}
           M ${towerX2 - 4} ${towerY2 + 28} L ${towerX2 + 40} ${towerY2 + 28}
           M ${towerX2 - 8} ${towerY2 + 50} L ${towerX2 + 44} ${towerY2 + 50}`,
    stroke: 'rgba(56, 189, 248, 0.4)',
    strokeWidth: 1.2,
    fill: 'none'
  });
  rootGroup.add(tower2);

  // Overhead Transmission Lines between Transformer & Towers
  const transLine1 = new Path({
    path: `M ${transX + 41} ${transY - 14} Q ${transX + 70} ${transY - 35}, ${towerX + 26} ${towerY + 36}`,
    stroke: '#10b981',
    strokeWidth: 2,
    fill: 'none'
  });
  const transLine2 = new Path({
    path: `M ${towerX + 26} ${towerY + 36} Q ${(towerX + towerX2) / 2} ${towerY + 45}, ${towerX2 + 18} ${towerY2 + 28}`,
    stroke: '#38bdf8',
    strokeWidth: 1.8,
    fill: 'none'
  });
  const transLine3 = new Path({
    path: `M ${towerX2 + 18} ${towerY2 + 28} Q ${towerX2 + 80} ${towerY2 + 35}, ${width} ${towerY2 + 15}`,
    stroke: '#38bdf8',
    strokeWidth: 1.5,
    fill: 'none'
  });
  rootGroup.add(transLine1);
  rootGroup.add(transLine2);
  rootGroup.add(transLine3);

  // 7. Photovoltaic Weather & Radiation Station (全要素环境监测仪)
  const metX = width * 0.46;
  const metY = height * 0.46;
  const metGroup = new Group({ x: metX, y: metY });

  const metPole = new Line({
    points: [12, 0, 12, 55],
    stroke: '#94a3b8',
    strokeWidth: 2
  });
  const metArm = new Line({
    points: [-10, 8, 34, 8],
    stroke: '#94a3b8',
    strokeWidth: 2
  });
  const metHead = new Ellipse({
    x: 7,
    y: -5,
    width: 10,
    height: 10,
    fill: '#38bdf8'
  });
  const metPyranometer = new Polygon({
    points: [-14, 8, -6, 8, -10, 0],
    fill: '#f59e0b'
  });
  const metAnemometer = new Ellipse({
    x: 28,
    y: 3,
    width: 8,
    height: 8,
    fill: '#10b981'
  });
  metGroup.add(metPole);
  metGroup.add(metArm);
  metGroup.add(metHead);
  metGroup.add(metPyranometer);
  metGroup.add(metAnemometer);
  rootGroup.add(metGroup);

  // 8. Underground Flow Cables Connecting PV Arrays to Inverter, Storage and Transformer
  const cableGroup = new Group();
  rootGroup.add(cableGroup);

  const cables = [
    { points: [pvClusters[0].x + pvClusters[0].scaleW, pvClusters[0].y + pvClusters[0].scaleH * 0.5, invX1, invY1 + 25], color: '#f59e0b' },
    { points: [pvClusters[1].x + pvClusters[1].scaleW, pvClusters[1].y + pvClusters[1].scaleH * 0.5, invX1, invY1 + 40], color: '#f59e0b' },
    { points: [pvClusters[3].x + pvClusters[3].scaleW, pvClusters[3].y + pvClusters[3].scaleH * 0.5, invX1, invY1 + 55], color: '#f59e0b' },
    { points: [pvClusters[4].x + pvClusters[4].scaleW, pvClusters[4].y + pvClusters[4].scaleH * 0.5, invX1, invY1 + 68], color: '#f59e0b' },
    { points: [pvClusters[6].x + pvClusters[6].scaleW, pvClusters[6].y + pvClusters[6].scaleH * 0.5, invX1, invY1 + 75], color: '#f59e0b' },
    { points: [bessX + 88, bessY + 30, invX1, invY1 + 70], color: '#10b981' },
    { points: [invX1 + 86, invY1 + 45, transX, transY + 45], color: '#00f2ff' }
  ];

  cables.forEach((c) => {
    const cableLine = new Line({
      points: c.points,
      stroke: c.color,
      strokeWidth: 1.5,
      opacity: 0.65
    });
    cableGroup.add(cableLine);

    // Add flowing electric pulses
    currentPulses.push({
      pathPoints: [
        { x: c.points[0], y: c.points[1] },
        { x: c.points[2], y: c.points[3] }
      ],
      progress: Math.random(),
      speed: 0.012 + Math.random() * 0.008,
      color: c.color === '#f59e0b' ? '#fbbf24' : (c.color === '#10b981' ? '#34d399' : '#38bdf8'),
      size: 4
    });
  });

  // 9. Particle Layer Initialization
  const particleGroup = new Group();
  rootGroup.add(particleGroup);

  particles.forEach((p) => {
    const circle = new Ellipse({
      x: p.startX,
      y: p.startY,
      width: p.size,
      height: p.size,
      fill: p.color,
      shadow: {
        color: '#f59e0b',
        blur: 8,
        x: 0,
        y: 0
      }
    });
    particleGroup.add(circle);
    p.shape = circle;
  });

  currentPulses.forEach((pulse) => {
    const circle = new Ellipse({
      x: pulse.pathPoints[0].x,
      y: pulse.pathPoints[0].y,
      width: pulse.size,
      height: pulse.size,
      fill: pulse.color,
      shadow: {
        color: pulse.color,
        blur: 8,
        x: 0,
        y: 0
      }
    });
    particleGroup.add(circle);
    pulse.shape = circle;
  });

  // 10. Animation Loop
  let rotationAngle = 0;
  let waveShift = 0;

  const animate = () => {
    // 10.1 Rotate Sun Rays
    rotationAngle += 0.0035;
    sunRays.forEach((ray, i) => {
      const baseAngle = (i / rayCount) * Math.PI * 2 + rotationAngle;
      const r1 = 34;
      const r2 = (i % 2 === 0) ? 68 : 50;
      ray.points = [
        sunX + Math.cos(baseAngle) * r1,
        sunY + Math.sin(baseAngle) * r1,
        sunX + Math.cos(baseAngle) * r2,
        sunY + Math.sin(baseAngle) * r2
      ];
    });

    // 10.2 Animate Photons Streaming to Arrays
    particles.forEach((p) => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
      }
      if (p.shape) {
        p.shape.x = p.startX + (p.targetX - p.startX) * p.progress;
        p.shape.y = p.startY + (p.targetY - p.startY) * p.progress;
        p.shape.opacity = Math.sin(p.progress * Math.PI);
      }
    });

    // 10.3 Animate Electric Current Pulses
    currentPulses.forEach((pulse) => {
      pulse.progress += pulse.speed;
      if (pulse.progress >= 1) {
        pulse.progress = 0;
      }

      if (pulse.shape && pulse.pathPoints.length >= 2) {
        const p1 = pulse.pathPoints[0];
        const p2 = pulse.pathPoints[1];
        pulse.shape.x = p1.x + (p2.x - p1.x) * pulse.progress;
        pulse.shape.y = p1.y + (p2.y - p1.y) * pulse.progress;
      }
    });

    // 10.4 Inverter LCD Sine Wave Oscillation
    waveShift += 0.08;
    const waveY1 = 26 + Math.sin(waveShift) * 5;
    const waveY2 = 26 + Math.sin(waveShift + 1.5) * 5;
    const waveY3 = 26 + Math.sin(waveShift + 3.0) * 5;
    lcdSine1.path = `M 14 26 Q 22 ${waveY1.toFixed(1)}, 30 26 T 46 ${waveY2.toFixed(1)} T 62 ${waveY3.toFixed(1)} T 72 26`;

    animFrameId = requestAnimationFrame(animate);
  };

  animate();
};

const handleWindowResize = () => {
  if (leaferApp && leaferContainerRef.value) {
    const width = leaferContainerRef.value.clientWidth;
    const height = leaferContainerRef.value.clientHeight;
    leaferApp.width = width;
    leaferApp.height = height;
    initLeaferScene();
  }
};

onMounted(() => {
  updateTime();
  timerId = setInterval(updateTime, 1000);
  initLeaferScene();
  window.addEventListener('resize', handleWindowResize);
});

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId);
  if (animFrameId) cancelAnimationFrame(animFrameId);
  window.removeEventListener('resize', handleWindowResize);
  if (leaferApp) {
    leaferApp.destroy();
    leaferApp = null;
  }
});
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden bg-[#02050e] font-sans select-none flex flex-col justify-between">
    <!-- 1. Fullscreen Dynamic Canvas Scene (Rich photovoltaic background) -->
    <div 
      ref="leaferContainerRef" 
      class="absolute inset-0 w-full h-full z-0 cursor-default"
    />

    <!-- 2. Subtle Vignette Depth Layer -->
    <div class="absolute inset-0 pointer-events-none z-1 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,5,14,0.35)_70%,rgba(2,5,14,0.85)_100%)]" />

    <!-- 3. Top System Header (Clear & elevated) -->
    <header class="relative z-10 w-full px-6 py-3.5 flex items-center justify-between border-b border-cyan-500/20 bg-slate-950/75 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-cyan-500/30 border border-cyan-400/50 p-1.5 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.25)]">
          <Sun class="w-5 h-5 text-amber-400 animate-[spin_25s_linear_infinite]" />
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-black text-white tracking-wider flex items-center gap-2">
            <span>光伏电站监控系统</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-medium">
              SCADA CONTROL
            </span>
          </h1>
        </div>
      </div>

      <!-- Realtime Clock & Status -->
      <div class="flex items-center gap-4 font-mono text-xs">
        <div class="hidden sm:flex items-center gap-1.5 text-emerald-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>系统就绪</span>
        </div>

        <div class="text-right">
          <div class="text-cyan-300 font-black text-sm tracking-wider">{{ currentTime }}</div>
          <div class="text-[10px] text-slate-400">{{ currentDate }}</div>
        </div>
      </div>
    </header>

    <!-- 4. Main Body: Floating Industrial SCADA Login Console on Right Side -->
    <main class="relative z-10 flex-1 flex items-center justify-end px-6 lg:px-16 py-6 overflow-hidden">
      <div class="w-full max-w-md bg-[#050d22]/90 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_70px_rgba(0,242,255,0.25)] relative overflow-hidden">
        <!-- Top Tech Bar -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400" />

        <!-- Form Title Header -->
        <div class="mb-6 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck class="w-4 h-4 text-cyan-400" />
              <span>用户认证中心</span>
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              在线服务
            </span>
          </div>
          <h2 class="text-xl font-black text-white tracking-wide">
            控制台登录
          </h2>
          <p class="text-xs text-slate-400">
            请选择操作用户并输入密码以进入集中监控大屏
          </p>
        </div>

        <!-- Form with User Dropdown and Password -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- User Dropdown Menu -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>选择登录用户名</span>
              <span class="text-[10px] text-cyan-400 font-mono">共 {{ userList.length }} 个用户</span>
            </label>
            <div class="relative">
              <User class="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                v-model="selectedUsername"
                class="w-full appearance-none bg-slate-900/90 border border-slate-700 hover:border-cyan-500/60 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-hidden transition-colors cursor-pointer"
              >
                <option
                  v-for="u in userList"
                  :key="u.username"
                  :value="u.username"
                  class="bg-slate-900 text-white py-2"
                >
                  {{ u.name }} ({{ u.username }})
                </option>
              </select>
              <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            <!-- Selected User Info Card -->
            <div class="mt-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <ShieldCheck class="w-3.5 h-3.5 text-cyan-400" />
                <span class="text-slate-200 font-medium">{{ currentSelectedUser.roleName }}</span>
              </div>
              <span class="text-[10px] text-cyan-400/90 font-mono">统一初始密码: 123456</span>
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>登录密码</span>
              <span class="text-[10px] text-slate-400 font-mono">默认 123456</span>
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码 (统一初始密码: 123456)"
                class="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-hidden transition-colors font-mono"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <div 
            v-if="errorMessage"
            class="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 font-medium"
          >
            <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_30px_rgba(0,242,255,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogIn class="w-4 h-4" />
            <span>{{ isSubmitting ? '正在验证身份...' : '进入监控大屏' }}</span>
          </button>
        </form>
      </div>
    </main>

    <!-- 5. Bottom Status Bar -->
    <footer class="relative z-10 w-full px-6 py-2.5 border-t border-cyan-500/20 bg-slate-950/80 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 font-mono">
      <div class="flex items-center gap-2">
        <Activity class="w-3.5 h-3.5 text-cyan-400" />
        <span>光伏电站实时监控系统</span>
      </div>
      <div class="text-[11px] text-slate-500">
        系统状态正常
      </div>
    </footer>
  </div>
</template>
