<script setup lang="ts">
import { showToast } from 'vant'
import { useAuthStore } from '@/store/modules/auth'

defineOptions({ name: 'Login' })

const auth = useAuthStore()
const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const form = reactive({ username: '', password: '' })
const loading = ref(false)

function switchMode(m: 'login' | 'register') {
  mode.value = m
}

async function submit() {
  if (!/^\w{3,20}$/.test(form.username)) {
    showToast('用户名需为 3-20 位字母、数字或下划线')
    return
  }
  if (form.password.length < 6) {
    showToast('密码至少 6 位')
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login')
      await auth.login(form.username, form.password)
    else
      await auth.register(form.username, form.password)
    router.replace({ name: 'Focus' })
  }
  catch (e: any) {
    showToast(e?.message || '操作失败，请稍后重试')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[var(--color-background-2)] px-[24px]">
    <div class="mt-[80px] text-center">
      <div class="text-[28px] font-bold">
        专注番茄钟
      </div>
      <div class="mt-[8px] text-[13px] text-[var(--van-text-color-2)]">
        番茄钟 · 待办 · 习惯打卡 · 备忘录
      </div>
    </div>

    <div class="mt-[40px] bg-[var(--color-block-background)] rounded-[16px] px-[4px] py-[4px]">
      <div class="flex rounded-[12px] bg-[var(--color-background-2)] p-[4px]">
        <button
          type="button"
          class="h-[36px] flex-1 rounded-[10px] text-[15px] transition-colors"
          :class="mode === 'login' ? 'bg-[var(--van-primary-color)] font-medium text-white' : 'text-[var(--van-text-color-2)]'"
          @click="switchMode('login')"
        >
          登录
        </button>
        <!-- <button
          type="button"
          class="h-[36px] flex-1 rounded-[10px] text-[15px] transition-colors"
          :class="mode === 'register' ? 'bg-[var(--van-primary-color)] font-medium text-white' : 'text-[var(--van-text-color-2)]'"
          @click="switchMode('register')"
        >
          注册
        </button> -->
      </div>

      <van-cell-group :border="false" class="mt-[8px]">
        <van-field v-model="form.username" label="用户名" placeholder="3-20 位字母、数字或下划线" maxlength="20" clearable />
        <van-field
          v-model="form.password"
          label="密码"
          type="password"
          placeholder="至少 6 位"
          maxlength="64"
          @keyup.enter="submit"
        />
      </van-cell-group>

      <div class="px-[16px] pt-[16px] pb-[8px]">
        <van-button block round type="primary" :loading="loading" loading-text="请稍候…" @click="submit">
          {{ mode === 'login' ? '登录' : '注册并登录' }}
        </van-button>
      </div>
    </div>

    <!-- <div class="mt-[16px] text-center text-[12px] leading-[20px] text-[var(--van-text-color-3)]">
      数据按账号隔离存储于云端<br>
      新注册账号可自由使用，与其他账号互不可见
    </div> -->
  </div>
</template>
