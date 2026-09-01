<script setup lang="ts">
import { reactive, ref } from 'vue'

const active = ref(0)
const tabbarData = reactive([
  {
    icon: 'clock-o',
    title: '专注',
    to: {
      name: 'Focus',
    },
  },
  {
    icon: 'todo-list-o',
    title: '待办',
    to: {
      name: 'Todo',
    },
  },
  {
    icon: 'calendar-o',
    title: '习惯',
    to: {
      name: 'Habit',
    },
  },
  {
    icon: 'notes-o',
    title: '备忘录',
    to: {
      name: 'Memo',
    },
  },
])
</script>

<template>
  <van-tabbar v-model="active" :placeholder="true" :route="true" fixed>
    <van-tabbar-item
      v-for="(item, index) in tabbarData"
      :key="index"
      :icon="item.icon"
      :to="item.to"
    >
      {{ item.title }}
    </van-tabbar-item>
  </van-tabbar>
</template>
