<script setup lang="ts">
import { ref } from 'vue';
import { 
  X, 
  User, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  Zap,
  KeyRound
} from 'lucide-vue-next';
import { currentUser, loginUser, switchQuickUser, PRESET_USERS } from '../utils/auth';

interface Props {
  notice?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
  (e: 'logout'): void;
}>();

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const handleLogin = () => {
  errorMessage.value = '';
  if (!username.value.trim()) {
    errorMessage.value = '请输入用户名';
    return;
  }
  if (!password.value.trim()) {
    errorMessage.value = '请输入登录密码';
    return;
  }

  isSubmitting.value = true;
  setTimeout(() => {
    const res = loginUser(username.value, password.value);
    isSubmitting.value = false;
    if (res.success) {
      emit('success');
      emit('close');
    } else {
      errorMessage.value = res.message;
    }
  }, 200);
};

const handleQuickSwitch = (role: 'system_admin' | 'viewer') => {
  switchQuickUser(role);
  emit('success');
  emit('close');
};

const handleLogoutToLoginScreen = () => {
  emit('logout');
  emit('close');
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
    <div class="bg-[#050b18] border border-cyan-500/40 rounded-2xl w-full max-w-md shadow-[0_0_60px_rgba(0,242,255,0.25)] flex flex-col overflow-hidden font-sans">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/70">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-base font-bold text-white tracking-wide">SCADA 用户身份认证</h2>
            <p class="text-xs text-slate-400 mt-0.5">切换用户权限与操作角色</p>
          </div>
        </div>

        <button
          @click="emit('close')"
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Notice Alert if triggered by permission failure -->
      <div v-if="notice" class="mx-6 mt-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2 text-xs text-amber-200">
        <ShieldAlert class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>{{ notice }}</div>
      </div>

      <!-- Quick Fast Switch Cards -->
      <div class="p-6 pb-2 space-y-3">
        <div class="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
          <span>快捷切换预设角色</span>
          <span class="text-[10px] text-slate-500">一键即时登录</span>
        </div>

        <div class="grid grid-cols-1 gap-2.5">
          <!-- 1. System Admin Card -->
          <div
            @click="handleQuickSwitch('system_admin')"
            class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group"
            :class="currentUser.role === 'system_admin' 
              ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.2)]' 
              : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                <KeyRound class="w-4 h-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-100 text-xs">系统用户 (admin)</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono font-bold">
                    全权限
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  进大屏模式、画布编辑模式、图元工坊、测点管理
                </div>
              </div>
            </div>
            <div v-if="currentUser.role === 'system_admin'" class="text-cyan-400 shrink-0">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div v-else class="text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0">
              <ArrowRight class="w-4 h-4" />
            </div>
          </div>

          <!-- 2. Viewer / Operator Card -->
          <div
            @click="handleQuickSwitch('viewer')"
            class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group"
            :class="currentUser.role === 'viewer' 
              ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900'"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                <UserCheck class="w-4 h-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-100 text-xs">普通用户 (operator)</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 font-mono font-bold">
                    仅看大屏
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  全屏大屏实时监视、遥控置数调阅、禁止画布设计与编辑
                </div>
              </div>
            </div>
            <div v-if="currentUser.role === 'viewer'" class="text-emerald-400 shrink-0">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <div v-else class="text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0">
              <ArrowRight class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="px-6 py-2 flex items-center gap-3">
        <div class="h-px bg-slate-800 flex-1" />
        <span class="text-[11px] text-slate-500 font-mono">或账号密码登录</span>
        <div class="h-px bg-slate-800 flex-1" />
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleLogin" class="px-6 pb-6 space-y-3.5">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">登录账号</label>
          <div class="relative">
            <User class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="username"
              type="text"
              placeholder="请输入 admin 或 operator"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">登录密码</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="password"
              type="password"
              placeholder="admin888 或 123456"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-hidden"
            />
          </div>
        </div>

        <div v-if="errorMessage" class="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2 rounded-lg font-medium">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
        >
          {{ isSubmitting ? '正在验证身份...' : '登录 SCADA 控制台' }}
        </button>

        <button
          type="button"
          @click="handleLogoutToLoginScreen"
          class="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 hover:bg-amber-950/20 text-amber-300 text-xs font-mono transition-all cursor-pointer"
        >
          注销当前账号 / 返回光伏登录界面
        </button>
      </form>
    </div>
  </div>
</template>
