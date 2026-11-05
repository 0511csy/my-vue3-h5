<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { showConfirmDialog } from 'vant'
import { computed } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { useDarkModeStore } from '@/store/modules/dark-mode'
import { useUiStore } from '@/store/modules/ui'

const route = useRoute()

const darkModeStore = useDarkModeStore()
const { isDark } = storeToRefs(darkModeStore)
const authStore = useAuthStore()
const uiStore = useUiStore()

const iconName = computed(() => isDark.value ? 'light' : 'dark')
const title = computed(() => (route.meta.title as string) ?? '')
const showAdd = computed(() => route.meta.showAdd === true)
const showBackToToday = computed(() => route.meta.showToday === true && uiStore.backToTodayVisible)

function onClickRight(event: TouchEvent | MouseEvent) {
  darkModeStore.toggleDarkMode(event)
}

function onClickLogout() {
  showConfirmDialog({
    title: '退出登录',
    message: `确定退出账号 ${authStore.username} 吗？`,
  }).then(() => {
    authStore.logout()
    // 整页刷新以清空所有内存态业务数据
    location.hash = '#/login'
    location.reload()
  }).catch(() => {})
}
</script>

<template>
  <van-nav-bar :title="title" fixed placeholder @click-right="onClickRight">
    <template #right>
      <span
        v-if="showBackToToday"
        class="mr-[14px] flex h-[28px] cursor-pointer items-center rounded-full bg-[var(--van-primary-color)]/10 px-[12px] text-[13px] leading-none text-[var(--van-primary-color)]"
        @click.stop="uiStore.triggerToday()"
      >
        回到今天
      </span>
      <van-icon
        v-if="showAdd"
        name="plus"
        size="19"
        class="mr-[14px]"
        @click.stop="uiStore.triggerAdd()"
      />
      <span
        class="mr-[10px] max-w-[72px] cursor-pointer truncate text-[13px] text-[var(--van-text-color-2)]"
        title="退出登录"
        @click.stop="onClickLogout"
      >
        {{ authStore.username }}
      </span>
      <svg-icon class="text-[18px]" :name="iconName" />
    </template>
  </van-nav-bar>
</template>

<style scoped></style>
