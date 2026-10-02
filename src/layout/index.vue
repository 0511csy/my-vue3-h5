<script setup lang="ts">
import NavBar from '@/components/nav-bar/index.vue'
import tabbar from '@/components/tabbar/index.vue'
import { useCachedViewStore } from '@/store/modules/cached-view'
import { useDarkModeStore } from '@/store/modules/dark-mode'
import { useFocusAppStore } from '@/store/modules/focus-app'

const cachedViewStore = useCachedViewStore()
const { cachedViewList } = storeToRefs(cachedViewStore)

const darkModeStore = useDarkModeStore()
const { theme } = storeToRefs(darkModeStore)

const route = useRoute()
const hideBar = computed(() => route.meta.hideBar === true)

// 启动时从后端拉取全部业务数据
const focusAppStore = useFocusAppStore()
onMounted(() => {
  focusAppStore.init()
})
</script>

<template>
  <div class="app-wrapper">
    <van-config-provider :theme="theme">
      <NavBar v-if="!hideBar" />
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedViewList">
          <component :is="Component" />
        </keep-alive>
      </router-view>
      <tabbar v-if="!hideBar" />
    </van-config-provider>
  </div>
</template>

<style lang="less" scoped>
@import "@/styles/mixin.less";

.app-wrapper {
  .clearfix();
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
