<script setup lang="ts">
import { showToast } from 'vant'
import { useAuthStore } from '@/store/modules/auth'

defineOptions({ name: 'Reset' })

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)

async function submit() {
  if (!form.oldPassword) {
    showToast('请输入原密码')
    return
  }
  if (form.newPassword.length < 6) {
    showToast('新密码至少 6 位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    showToast('两次输入的新密码不一致')
    return
  }
  if (form.newPassword === form.oldPassword) {
    showToast('新密码不能与原密码相同')
    return
  }
  loading.value = true
  try {
    // 改密成功后服务端会使所有旧会话失效，需用新密码重新登录
    await auth.changePassword(form.oldPassword, form.newPassword)
    showToast('密码已修改，请重新登录')
    auth.logout()
    location.hash = '#/login'
    location.reload()
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
  <van-nav-bar
    title="重置密码"
    left-arrow
    fixed
    placeholder
    @click-left="router.back()"
  />
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
      <van-cell-group :border="false" class="mt-[20px]">
        <van-field
          v-model="form.oldPassword"
          label="原密码"
          type="password"
          placeholder="请输入当前密码"
          maxlength="64"
        />
        <van-field
          v-model="form.newPassword"
          label="新密码"
          type="password"
          placeholder="至少 6 位"
          maxlength="64"
        />
        <van-field
          v-model="form.confirmPassword"
          label="确认新密码"
          type="password"
          placeholder="再次输入新密码"
          maxlength="64"
          @keyup.enter="submit"
        />
      </van-cell-group>

      <div class="px-[16px] pt-[16px] pb-[8px]">
        <van-button block round type="primary" :loading="loading" loading-text="请稍候…" @click="submit">
          提交
        </van-button>
      </div>
    </div>

    <div class="mt-[16px] text-center text-[12px] leading-[20px] text-[var(--van-text-color-3)]">
      修改成功后所有登录会话将失效，需使用新密码重新登录
    </div>
  </div>
</template>
