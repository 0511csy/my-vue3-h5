<script setup lang="ts">
import { showConfirmDialog, showToast } from 'vant'
import { useFocusAppStore } from '@/store/modules/focus-app'
import { useUiStore } from '@/store/modules/ui'

defineOptions({ name: 'Memo' })

const router = useRouter()
const route = useRoute()
const store = useFocusAppStore()
const uiStore = useUiStore()

const sortedMemos = computed(() =>
  [...store.memos].sort((a, b) => b.updatedAt - a.updatedAt),
)

// keep-alive 页面的监听器常驻，需路由守卫防止其他页误触
watch(() => uiStore.addTrigger, () => {
  if (route.name === 'Memo')
    openMemo()
})

function fmtTime(ts: number) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const h = `${d.getHours()}`.padStart(2, '0')
  const min = `${d.getMinutes()}`.padStart(2, '0')
  const today = new Date()
  const isToday = y === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  return isToday ? `今天 ${h}:${min}` : `${y}-${m}-${day} ${h}:${min}`
}

function openMemo(id?: string) {
  router.push({ name: 'MemoEdit', query: id ? { id } : undefined })
}
function remove(id: string) {
  showConfirmDialog({
    title: '删除备忘录',
    message: '确定删除这条备忘录吗？',
    className: 'dialog-danger',
  }).then(() => {
    store.removeMemo(id)
    showToast('已删除')
  }).catch(() => {})
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background-2)] pb-[20px]">
    <van-empty v-if="sortedMemos.length === 0" description="暂无备忘录，点击右上角新增" />

    <div class="px-[12px] pt-[12px]">
      <van-swipe-cell v-for="item in sortedMemos" :key="item.id" class="mb-[12px] rounded-[12px]">
        <div
          class="bg-[var(--color-block-background)] rounded-[12px] px-[16px] py-[14px]"
          @click="openMemo(item.id)"
        >
          <div class="truncate text-[15px] font-medium">
            {{ item.title || '无标题' }}
          </div>
          <div class="mt-[4px] text-[12px] text-[var(--van-text-color-2)]">
            {{ fmtTime(item.updatedAt) }}
          </div>
        </div>
        <template #right>
          <van-button square type="danger" text="删除" class="!h-full" @click="remove(item.id)" />
        </template>
      </van-swipe-cell>
    </div>
  </div>
</template>
