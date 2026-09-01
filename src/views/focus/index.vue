<script setup lang="ts">
import type { Pomodoro } from '@/store/modules/focus-app'
import { showConfirmDialog, showToast } from 'vant'
import { uid, useFocusAppStore } from '@/store/modules/focus-app'
import { useUiStore } from '@/store/modules/ui'

defineOptions({ name: 'Focus' })

const router = useRouter()
const store = useFocusAppStore()
const uiStore = useUiStore()
const { pomodoros, todayFocusCount, todayFocusMinutes } = storeToRefs(store)

const showEdit = ref(false)
const editing = ref<Pomodoro>({ id: '', name: '', minutes: 25 })

watch(() => uiStore.addTrigger, () => openNew())

function openNew() {
  editing.value = { id: '', name: '', minutes: 25 }
  showEdit.value = true
}
function openEdit(p: Pomodoro) {
  editing.value = { ...p }
  showEdit.value = true
}
function confirmEdit() {
  if (!editing.value.name.trim()) {
    showToast('请输入事项名称')
    return
  }
  const p = { ...editing.value, name: editing.value.name.trim() }
  if (!p.id)
    p.id = uid()
  store.savePomodoro(p)
  showEdit.value = false
}
function remove(p: Pomodoro) {
  showConfirmDialog({
    title: '删除番茄闹钟',
    message: `确定删除「${p.name}」吗？`,
    className: 'dialog-danger',
  }).then(() => {
    store.removePomodoro(p.id)
    showToast('已删除')
  }).catch(() => {})
}
function start(p: Pomodoro) {
  router.push({ name: 'FocusTimer', query: { id: p.id } })
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background-2)] pb-[20px]">
    <!-- 今日专注统计 -->
    <div class="mx-[12px] mt-[12px] mb-[16px] flex items-center gap-[14px] bg-[var(--color-block-background)] rounded-[16px] px-[20px] py-[16px]">
      <div class="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[var(--van-primary-color)]/12">
        <van-icon name="fire-o" size="24" class="text-[var(--van-primary-color)]" />
      </div>
      <div class="min-w-0">
        <div class="text-[15px] font-semibold">
          今日已完成 {{ todayFocusCount }} 次专注
        </div>
        <div class="mt-[2px] text-[12px] text-[var(--van-text-color-2)]">
          累计专注 {{ todayFocusMinutes }} 分钟
        </div>
      </div>
    </div>

    <van-empty v-if="pomodoros.length === 0" description="暂无番茄闹钟，点击右上角新增" />

    <div class="px-[12px]">
      <van-swipe-cell v-for="item in pomodoros" :key="item.id" class="mb-[12px] rounded-[12px]">
        <div class="flex items-center justify-between bg-[var(--color-block-background)] rounded-[12px] px-[16px] py-[14px]">
          <div>
            <div class="text-[15px] font-medium">
              {{ item.name }}
            </div>
            <div class="mt-[4px] text-[13px] text-[var(--van-text-color-2)]">
              {{ item.minutes }} 分钟
            </div>
          </div>
          <van-button type="primary" size="small" round @click="start(item)">
            开始
          </van-button>
        </div>
        <template #right>
          <van-button square type="primary" text="编辑" class="!h-full" @click="openEdit(item)" />
          <van-button square type="danger" text="删除" class="!h-full" @click="remove(item)" />
        </template>
      </van-swipe-cell>
    </div>

    <van-popup v-model:show="showEdit" position="bottom" round class="!pb-[24px]">
      <div class="pl-[24px] pt-[24px] pb-[8px] text-left text-[16px] font-bold">
        {{ editing.id ? '编辑番茄闹钟' : '新增番茄闹钟' }}
      </div>
      <van-cell-group inset class="!my-[12px]">
        <van-field v-model="editing.name" label="事项名称" placeholder="请输入事项名称" maxlength="20" />
        <van-field label="时长（分钟）">
          <template #input>
            <van-stepper v-model="editing.minutes" min="1" max="120" integer />
          </template>
        </van-field>
      </van-cell-group>
      <div class="flex gap-[16px] px-[20px] pt-[16px]">
        <van-button block round @click="showEdit = false">
          取消
        </van-button>
        <van-button block round type="primary" @click="confirmEdit">
          确定
        </van-button>
      </div>
    </van-popup>
  </div>
</template>
