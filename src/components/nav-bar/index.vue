<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useDarkModeStore } from '@/store/modules/dark-mode'
import { useUiStore } from '@/store/modules/ui'

const route = useRoute()

const darkModeStore = useDarkModeStore()
const { isDark } = storeToRefs(darkModeStore)
const uiStore = useUiStore()

const iconName = computed(() => isDark.value ? 'light' : 'dark')
const title = computed(() => (route.meta.title as string) ?? '')
const showAdd = computed(() => route.meta.showAdd === true)
const showBackToToday = computed(() => route.meta.showToday === true && uiStore.backToTodayVisible)

function onClickRight(event: TouchEvent | MouseEvent) {
  darkModeStore.toggleDarkMode(event)
}
</script>

<template>
  <van-nav-bar :title="title" fixed placeholder @click-right="onClickRight">
    <template #right>
      <span
        v-if="showBackToToday"
        class="mr-[14px] cursor-pointer rounded-full bg-[var(--van-primary-color)]/10 px-[10px] py-[3px] text-[13px] text-[var(--van-primary-color)]"
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
      <svg-icon class="text-[18px]" :name="iconName" />
    </template>
  </van-nav-bar>
</template>

<style scoped></style>
