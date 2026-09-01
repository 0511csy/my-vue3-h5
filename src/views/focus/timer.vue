<script setup lang="ts">
import { showConfirmDialog, showDialog } from 'vant'
import { useFocusAppStore } from '@/store/modules/focus-app'

defineOptions({ name: 'FocusTimer' })

const route = useRoute()
const router = useRouter()
const store = useFocusAppStore()

const pomodoro = store.pomodoros.find(p => p.id === route.query.id)
const name = pomodoro?.name ?? '专注'
const totalMs = (pomodoro?.minutes ?? 25) * 60 * 1000

const remainingMs = ref(totalMs)
const running = ref(true)
const finished = ref(false)
let timerId: ReturnType<typeof setInterval> | null = null
let lastTick = 0

// 100ms 步进，进度圆环平滑移动
const progress = computed(() => ((totalMs - remainingMs.value) / totalMs) * 100)
const display = computed(() => {
  const total = Math.max(0, Math.ceil(remainingMs.value / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${`${m}`.padStart(2, '0')}:${`${s}`.padStart(2, '0')}`
})

function step() {
  const now = performance.now()
  remainingMs.value = Math.max(0, remainingMs.value - (now - lastTick))
  lastTick = now
  if (remainingMs.value <= 0) {
    stopTimer()
    finished.value = true
    store.addFocusSession(name, pomodoro?.minutes ?? 25)
    remind()
  }
}
function startTimer() {
  if (timerId)
    return
  lastTick = performance.now()
  timerId = setInterval(step, 100)
  running.value = true
}
function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  running.value = false
}
function toggle() {
  running.value ? stopTimer() : startTimer()
}
function remind() {
  if ('vibrate' in navigator)
    navigator.vibrate([300, 150, 300, 150, 600])
  showDialog({
    title: '时间到',
    message: `「${name}」已完成\n今日已完成 ${store.todayFocusCount} 次专注`,
  }).then(() => router.back())
}
function quit() {
  showConfirmDialog({
    title: '放弃专注',
    message: '确定要结束本次专注吗？',
    className: 'dialog-danger',
  }).then(() => router.back()).catch(() => {})
}

onMounted(startTimer)
onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background-2)] px-[24px]">
    <div class="mb-[16px] text-[16px] text-[var(--van-text-color-2)]">
      {{ name }}
    </div>

    <div class="relative flex items-center justify-center">
      <van-circle
        :current-rate="progress"
        :rate="progress"
        :speed="50"
        :stroke-width="120"
        layer-color="var(--color-border)"
        color="var(--van-primary-color)"
        size="240px"
      />
      <div class="absolute inset-0 flex items-center justify-center">
        <span class="text-[40px] font-bold tabular-nums">{{ display }}</span>
      </div>
    </div>

    <div class="mt-[20px] text-[13px] text-[var(--van-text-color-3)]">
      {{ finished ? '已完成' : running ? '专注中…' : '已暂停' }}
    </div>

    <div class="mt-[64px] flex items-center gap-[56px]">
      <button
        type="button"
        class="flex h-[72px] w-[72px] items-center justify-center transition-transform active:scale-90"
        title="停止"
        @click="quit"
      >
        <van-icon name="stop-circle-o" size="56" class="text-[var(--van-danger-color)]" />
      </button>
      <button
        type="button"
        class="flex h-[72px] w-[72px] items-center justify-center transition-transform active:scale-90"
        title="暂停/继续"
        @click="toggle"
      >
        <van-icon :name="running ? 'pause-circle-o' : 'play-circle-o'" size="56" class="text-[var(--van-primary-color)]" />
      </button>
    </div>
  </div>
</template>
