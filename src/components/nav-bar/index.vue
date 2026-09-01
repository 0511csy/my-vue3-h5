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

function onClickRight(event: TouchEvent | MouseEvent) {
  darkModeStore.toggleDarkMode(event)
}
</script>

<template>
  <van-nav-bar :title="title" fixed placeholder @click-right="onClickRight">
    <template #right>
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
