import type { RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'root',
    component: Layout,
    redirect: { name: 'Focus' },
    children: [
      {
        path: 'focus',
        name: 'Focus',
        component: () => import('@/views/focus/index.vue'),
        meta: {
          title: '专注',
          showAdd: true,
        },
      },
      {
        path: 'focus/timer',
        name: 'FocusTimer',
        component: () => import('@/views/focus/timer.vue'),
        meta: {
          title: '专注中',
          noCache: true,
          hideBar: true,
        },
      },
      {
        path: 'todo',
        name: 'Todo',
        component: () => import('@/views/todo/index.vue'),
        meta: {
          title: '待办',
        },
      },
      {
        path: 'habit',
        name: 'Habit',
        component: () => import('@/views/habit/index.vue'),
        meta: {
          title: '习惯',
          showAdd: true,
          showToday: true,
        },
      },
      {
        path: 'memo',
        name: 'Memo',
        component: () => import('@/views/memo/index.vue'),
        meta: {
          title: '备忘录',
          showAdd: true,
        },
      },
      {
        path: 'memo/edit',
        name: 'MemoEdit',
        component: () => import('@/views/memo/edit.vue'),
        meta: {
          title: '编辑备忘录',
          noCache: true,
          hideBar: true,
        },
      },
    ],
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: {
      title: '页面未找到',
      noCache: true,
    },
  },
]

export default routes
