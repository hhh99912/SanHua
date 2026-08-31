<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { 
  ShieldCheck, 
  LogIn, 
  Lock,
  User,
  AlertCircle,
  Activity,
  ChevronDown,
  Cpu,
  Eye,
  EyeOff,
  Server,
  Zap,
  Clock,
  Radio,
  Sparkles
} from 'lucide-vue-next';
import { currentUser, loginUser, PRESET_USERS } from '../utils/auth';

const emit = defineEmits<{
  (e: 'login:success'): void;
}>();

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

// Prominent Real-time SCADA Industrial Clock
const currentTime = ref('');
const currentDate = ref('');
const currentWeekDay = ref('');
let timerId: any = null;

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

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
  currentWeekDay.value = weekDays[now.getDay()];
};

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
  }, 100);
};

onMounted(() => {
  updateTime();
  timerId = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId);
});
</script>

<template>
  <div class="relative w-screen h-screen min-h-[550px] overflow-y-auto bg-[#020713] text-slate-100 font-sans select-none flex flex-col justify-between">
    <!-- Vivid Photovoltaic Electricity High-Tech Background (Crisp bright vector artwork) -->
    <div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <!-- Deep Bright Solar & Cyan Ambient Glow -->
      <div class="absolute -top-[10%] -left-[5%] w-[70vw] h-[70vw] max-w-[850px] max-h-[850px] rounded-full bg-radial from-cyan-400/25 via-blue-500/15 to-transparent blur-3xl pointer-events-none" />
      <div class="absolute -bottom-[15%] -right-[5%] w-[70vw] h-[70vw] max-w-[850px] max-h-[850px] rounded-full bg-radial from-amber-400/25 via-cyan-500/15 to-transparent blur-3xl pointer-events-none" />

      <!-- Photovoltaic Power Station Vector Graphics Layer (Brighter, high-contrast) -->
      <svg 
        class="absolute inset-0 w-full h-full opacity-90"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1920 1080"
      >
        <defs>
          <!-- PV Panel Pattern (Luminous Solar Cells) -->
          <pattern id="pv-cell-pattern-vivid" width="28" height="18" patternUnits="userSpaceOnUse">
            <rect width="27" height="17" fill="#082046" stroke="#00f2ff" stroke-width="1.2" stroke-opacity="0.65" rx="1.5" />
            <line x1="13.5" y1="0" x2="13.5" y2="17" stroke="#00f2ff" stroke-width="0.8" stroke-opacity="0.45" />
            <line x1="0" y1="8.5" x2="27" y2="8.5" stroke="#00f2ff" stroke-width="0.8" stroke-opacity="0.45" />
          </pattern>

          <!-- Sun Radiation Vivid Gradient -->
          <radialGradient id="sun-glow-vivid" cx="80%" cy="15%" r="65%">
            <stop offset="0%" stop-color="#ffc300" stop-opacity="0.6" />
            <stop offset="25%" stop-color="#ff9100" stop-opacity="0.35" />
            <stop offset="50%" stop-color="#00f2ff" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#020713" stop-opacity="0" />
          </radialGradient>

          <!-- Power Flow Dash Animation Gradient -->
          <linearGradient id="power-flow-grad-vivid" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00f2ff" stop-opacity="0.95" />
            <stop offset="50%" stop-color="#ffb703" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="1" />
          </linearGradient>
        </defs>

        <!-- 1. Sun Solar Radiation & Angle Grid (右上角明亮太阳能弧线) -->
        <circle cx="1600" cy="180" r="480" fill="url(#sun-glow-vivid)" />
        <circle cx="1600" cy="180" r="140" fill="none" stroke="#ffc300" stroke-width="2" stroke-opacity="0.7" stroke-dasharray="6 4" />
        <circle cx="1600" cy="180" r="260" fill="none" stroke="#00f2ff" stroke-width="1.8" stroke-opacity="0.55" stroke-dasharray="8 6" />
        <circle cx="1600" cy="180" r="390" fill="none" stroke="#00f2ff" stroke-width="1.4" stroke-opacity="0.4" stroke-dasharray="4 8" />
        <circle cx="1600" cy="180" r="540" fill="none" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.3" />

        <!-- Sun Beam Radiation Rays (Brighter amber & cyan rays) -->
        <line x1="1600" y1="180" x2="1100" y2="700" stroke="#ffc300" stroke-width="1.8" stroke-opacity="0.5" stroke-dasharray="8 6" />
        <line x1="1600" y1="180" x2="800" y2="850" stroke="#00f2ff" stroke-width="1.6" stroke-opacity="0.4" stroke-dasharray="10 8" />
        <line x1="1600" y1="180" x2="500" y2="920" stroke="#00f2ff" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="6 10" />

        <!-- 2. High-Voltage Power Grid Transmission Tower (左侧明亮高压输电铁塔) -->
        <g transform="translate(140, 360) scale(0.95)" stroke="#00f2ff" stroke-opacity="0.65" stroke-width="2" fill="none">
          <!-- Tower Main Trusses -->
          <polygon points="120,40 100,340 140,340" stroke-opacity="0.8" stroke="#38bdf8" />
          <line x1="60" y1="100" x2="180" y2="100" stroke-width="2.5" />
          <line x1="40" y1="170" x2="200" y2="170" stroke-width="2.8" />
          <line x1="70" y1="240" x2="170" y2="240" stroke-width="2.2" />
          <line x1="100" y1="340" x2="140" y2="40" stroke-width="1.5" />
          <line x1="140" y1="340" x2="100" y2="40" stroke-width="1.5" />
          <line x1="60" y1="100" x2="120" y2="40" />
          <line x1="180" y1="100" x2="120" y2="40" />
          <line x1="40" y1="170" x2="120" y2="100" />
          <line x1="200" y1="170" x2="120" y2="100" />
          <line x1="70" y1="240" x2="100" y2="170" />
          <line x1="170" y1="240" x2="140" y2="170" />

          <!-- Insulators & Phase Lines -->
          <line x1="40" y1="170" x2="40" y2="200" stroke="#ffc300" stroke-width="2.5" stroke-opacity="0.9" />
          <line x1="200" y1="170" x2="200" y2="200" stroke="#ffc300" stroke-width="2.5" stroke-opacity="0.9" />
          <line x1="60" y1="100" x2="60" y2="130" stroke="#ffc300" stroke-width="2.5" stroke-opacity="0.9" />
          <line x1="180" y1="100" x2="180" y2="130" stroke="#ffc300" stroke-width="2.5" stroke-opacity="0.9" />
        </g>

        <!-- Second Distance Transmission Tower -->
        <g transform="translate(360, 480) scale(0.6)" stroke="#00f2ff" stroke-opacity="0.45" stroke-width="2" fill="none">
          <polygon points="120,40 100,340 140,340" />
          <line x1="50" y1="120" x2="190" y2="120" stroke-width="2.2" />
          <line x1="30" y1="190" x2="210" y2="190" stroke-width="2.5" />
          <line x1="60" y1="260" x2="180" y2="260" />
        </g>

        <!-- High-Voltage Sag Catenary Power Lines -->
        <path d="M 175,555 Q 275,585 385,595 T 600,615" fill="none" stroke="#00f2ff" stroke-width="1.8" stroke-opacity="0.55" />
        <path d="M 320,530 Q 420,560 530,570 T 750,590" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.5" />
        <path d="M 195,460 Q 300,495 405,505 T 620,530" fill="none" stroke="#ffc300" stroke-width="1.8" stroke-opacity="0.6" stroke-dasharray="6 4" />

        <!-- 3. Photovoltaic Solar Array Perspective Panels (明亮生动的光伏矩阵) -->
        <g fill="url(#pv-cell-pattern-vivid)">
          <!-- Left PV Array -->
          <polygon points="80,820 420,780 480,940 100,990" stroke="#00f2ff" stroke-width="2" stroke-opacity="0.8" />
          <polygon points="460,775 800,740 870,895 520,935" stroke="#00f2ff" stroke-width="2" stroke-opacity="0.8" />
          
          <!-- Right PV Array -->
          <polygon points="1380,740 1740,780 1800,945 1420,895" stroke="#00f2ff" stroke-width="2" stroke-opacity="0.8" />
          <polygon points="1060,775 1350,740 1390,895 1100,935" stroke="#00f2ff" stroke-width="2" stroke-opacity="0.8" />

          <!-- Mid PV Array Row 2 (Perspective Distant) -->
          <polygon points="120,720 400,690 440,760 140,795" stroke="#00f2ff" stroke-width="1.6" stroke-opacity="0.6" />
          <polygon points="430,685 710,655 760,725 470,755" stroke="#00f2ff" stroke-width="1.6" stroke-opacity="0.6" />
          <polygon points="1440,685 1720,720 1760,765 1470,725" stroke="#00f2ff" stroke-width="1.6" stroke-opacity="0.6" />
          <polygon points="1150,655 1410,685 1435,725 1180,695" stroke="#00f2ff" stroke-width="1.6" stroke-opacity="0.6" />
        </g>

        <!-- PV Array Support Racks & Inverter Ground Wiring -->
        <g stroke="#00f2ff" stroke-width="1.4" stroke-opacity="0.45" fill="none">
          <line x1="80" y1="820" x2="80" y2="850" />
          <line x1="420" y1="780" x2="420" y2="810" />
          <line x1="480" y1="940" x2="480" y2="965" />
          <line x1="100" y1="990" x2="100" y2="1015" />
          <line x1="1800" y1="945" x2="1800" y2="970" />
          <line x1="1420" y1="895" x2="1420" y2="920" />
        </g>

        <!-- Energy Flow Line to Central Substation Inverter -->
        <path 
          d="M 520,935 L 720,950 L 960,950 L 1200,950 L 1420,895" 
          fill="none" 
          stroke="url(#power-flow-grad-vivid)" 
          stroke-width="3" 
          stroke-dasharray="8 6" 
          stroke-linecap="round" 
        />

        <!-- Inverter / Step-Up Transformer Node Point -->
        <g transform="translate(960, 950)">
          <circle cx="0" cy="0" r="12" fill="#071836" stroke="#00f2ff" stroke-width="2.5" />
          <circle cx="0" cy="0" r="6" fill="#ffc300" />
        </g>
      </svg>

      <!-- Background Industrial Dot Grid Matrix -->
      <div 
        class="absolute inset-0 opacity-20 pointer-events-none"
        style="background-image: radial-gradient(circle, rgba(0, 242, 255, 0.4) 1.2px, transparent 1.2px); background-size: 32px 32px;"
      />

      <!-- Gentle Radial Vignette for Content Readability -->
      <div class="absolute inset-0 bg-radial from-transparent via-[#020713]/40 to-[#020713]/80 pointer-events-none" />
    </div>

    <!-- Top Industrial System Header with High-Visibility SCADA Master Clock -->
    <header class="relative z-10 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-cyan-500/40 bg-[#050e24]/90 backdrop-blur-md shrink-0 shadow-lg">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400/80 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.45)]">
          <Zap class="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-bold text-white tracking-wider">
              GE-SCADA 光伏电站监控系统
            </h1>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-mono font-bold shadow-xs">
              PV-SCADA
            </span>
          </div>
          <p class="text-[11px] text-slate-400 font-sans hidden sm:block">
            工业级全景综合监控与远动集控平台
          </p>
        </div>
      </div>

      <!-- Realtime Prominent Clock & Station Status -->
      <div class="flex items-center gap-3 sm:gap-6 font-mono">
        <!-- Communication Status (No fake telemetry numbers) -->
        <div class="flex items-center gap-2 text-emerald-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/40 shadow-xs">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <span class="text-xs font-sans font-bold">全站通信正常</span>
        </div>

        <!-- Prominent Glowing SCADA Digital Clock Capsule -->
        <div class="flex items-center gap-3 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 px-4 py-1.5 rounded-xl border border-cyan-400/70 shadow-[0_0_20px_rgba(0,242,255,0.25)]">
          <Clock class="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
          <div class="flex flex-col text-right">
            <div class="text-base sm:text-xl font-black text-cyan-300 tracking-widest font-mono leading-none drop-shadow-[0_0_10px_rgba(0,242,255,0.7)]">
              {{ currentTime }}
            </div>
            <div class="text-[11px] text-slate-300 font-medium tracking-wide flex items-center justify-end gap-1.5 mt-0.5">
              <span>{{ currentDate }}</span>
              <span class="text-cyan-400 font-bold">{{ currentWeekDay }}</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area: Centered, Responsive, Sleek Login Box (Single Time in Header, Minimalist Text) -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
      <div class="w-full max-w-sm sm:max-w-md bg-[#07132c]/95 border border-cyan-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
        <!-- Top Accent Strip -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400" />

        <!-- Form Title Header -->
        <div class="mb-6 text-center">
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center justify-center gap-2">
            <span>系统身份登录</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            请选择操作用户并验证密码
          </p>
        </div>

        <!-- Form with User Dropdown and Password -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- User Dropdown Menu -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              操作用户
            </label>
            <div class="relative">
              <User class="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                v-model="selectedUsername"
                class="w-full appearance-none bg-slate-900 border border-slate-700 hover:border-cyan-500/70 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-hidden transition-colors cursor-pointer"
              >
                <option
                  v-for="u in userList"
                  :key="u.username"
                  :value="u.username"
                  class="bg-slate-900 text-white py-2"
                >
                  {{ u.name }} ({{ u.roleName }})
                </option>
              </select>
              <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">
              登录密码
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="w-full bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-hidden transition-colors font-mono"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                tabindex="-1"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <div 
            v-if="errorMessage"
            class="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2 font-medium"
          >
            <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full mt-3 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 font-bold text-xs sm:text-sm tracking-widest shadow-[0_0_16px_rgba(0,242,255,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <LogIn class="w-4 h-4" />
            <span>{{ isSubmitting ? '验证中...' : '登 录' }}</span>
          </button>
        </form>
      </div>
    </main>

    <!-- Bottom Industrial Footer (Clean industrial system status) -->
    <footer class="relative z-10 w-full px-4 sm:px-8 py-3 border-t border-cyan-500/25 bg-[#050e24]/90 backdrop-blur-md shrink-0 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono gap-2">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Server class="w-4 h-4" />
          <span>GE-SCADA 工业监控平台</span>
        </div>
      </div>
      <div class="text-[11px] text-slate-400 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
        <span>系统工况正常</span>
      </div>
    </footer>
  </div>
</template>
