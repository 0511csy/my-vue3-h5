<script setup lang="ts">
import type { Todo } from '@/store/modules/focus-app'
import { showConfirmDialog, showToast } from 'vant'
import { todayStr, uid, useFocusAppStore } from '@/store/modules/focus-app'

defineOptions({ name: 'Todo' })

const store = useFocusAppStore()
const { todos } = storeToRefs(store)

const priorityOptions = [
  { text: '无', value: 0 },
  { text: '低', value: 1 },
  { text: '中', value: 2 },
  { text: '高', value: 3 },
]
const priorityTag: Record<number, { type: 'default' | 'primary' | 'warning' | 'danger', text: string }> = {
  0: { type: 'default', text: '无' },
  1: { type: 'primary', text: '低' },
  2: { type: 'warning', text: '中' },
  3: { type: 'danger', text: '高' },
}

// 未完成在前（按优先级、日期），已完成置底变灰
const sortedTodos = computed(() => {
  const undone = todos.value.filter(t => !t.done)
    .sort((a, b) => b.priority - a.priority || a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const done = todos.value.filter(t => t.done)
  return [...undone, ...done]
})

const newName = ref('')

function addTodo() {
  const name = newName.value.trim()
  if (!name)
    return
  store.saveTodo({
    id: uid(),
    name,
    date: todayStr(),
    time: '09:00',
    priority: 0,
    done: false,
  })
  newName.value = ''
}

const showEdit = ref(false)
const editing = ref<Todo>({ id: '', name: '', date: todayStr(), time: '09:00', priority: 0, done: false })

const showPriorityPicker = ref(false)
const priorityColumns = priorityOptions.map(o => ({ text: o.text, value: o.value }))

// 弹窗模式：edit 编辑任务 / pomodoro 转为番茄闹钟
const popupMode = ref<'edit' | 'pomodoro'>('edit')
const convert = ref({ date: todayStr(), minutes: 25 })
const showConvertCalendar = ref(false)

const popupTitle = computed(() => {
  if (popupMode.value === 'pomodoro')
    return '转为番茄闹钟'
  return editing.value.id ? '编辑任务' : '新增任务'
})

function openEdit(t: Todo) {
  editing.value = { ...t }
  popupMode.value = 'edit'
  convert.value = { date: todayStr(), minutes: 25 }
  showEdit.value = true
}
function onPriorityConfirm({ selectedOptions }: { selectedOptions: { text: string, value: number }[] }) {
  editing.value.priority = selectedOptions[0].value as Todo['priority']
  showPriorityPicker.value = false
}
function onConvertCalendarConfirm(date: Date) {
  convert.value.date = todayStr(date)
  showConvertCalendar.value = false
}
function confirmEdit() {
  if (!editing.value.name.trim()) {
    showToast('请输入任务名称')
    return
  }
  const t = { ...editing.value, name: editing.value.name.trim() }
  if (!t.id)
    t.id = uid()
  store.saveTodo(t)
  showEdit.value = false
}
function remove(t: Todo) {
  showConfirmDialog({
    title: '删除任务',
    message: `确定删除「${t.name}」吗？`,
    className: 'dialog-danger',
  }).then(() => {
    store.removeTodo(t.id)
    showToast('已删除')
  }).catch(() => {})
}
function toPomodoro() {
  const name = editing.value.name.trim()
  if (!name) {
    showToast('请先输入任务名称')
    return
  }
  popupMode.value = 'pomodoro'
}
function confirmPomodoro() {
  if (!editing.value.name.trim()) {
    showToast('请先输入任务名称')
    return
  }
  store.savePomodoro({ id: uid(), name: editing.value.name.trim(), minutes: convert.value.minutes })
  showToast('已转为番茄闹钟')
  showEdit.value = false
}
function toHabit() {
  const name = editing.value.name.trim()
  if (!name) {
    showToast('请先输入任务名称')
    return
  }
  store.saveHabit({ id: uid(), name, freq: '每天', records: [] })
  showToast('已转为习惯打卡')
  showEdit.value = false
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background-2)] pb-[20px]">
    <van-empty v-if="todos.length === 0" description="暂无任务，在下方输入即可新增" />

    <div class="px-[12px] pt-[12px]">
      <van-swipe-cell v-for="item in sortedTodos" :key="item.id" class="mb-[12px] rounded-[12px]">
        <div
          class="flex items-center gap-[10px] bg-[var(--color-block-background)] rounded-[12px] px-[14px] py-[14px]"
          :class="item.done ? 'opacity-50' : ''"
          @click="store.toggleTodo(item.id)"
        >
          <van-checkbox :model-value="item.done" @click.stop="store.toggleTodo(item.id)" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-[15px]" :class="item.done ? 'line-through text-[var(--van-text-color-3)]' : 'font-medium'">
              {{ item.name }}
            </div>
            <div class="mt-[4px] flex items-center gap-[6px] text-[12px] text-[var(--van-text-color-2)]">
              <van-tag v-if="item.priority > 0" :type="priorityTag[item.priority].type">
                {{ priorityTag[item.priority].text }}
              </van-tag>
              <span>{{ item.date }} {{ item.time }}</span>
            </div>
          </div>
        </div>
        <template #right>
          <van-button square type="primary" text="编辑" class="!h-full" @click="openEdit(item)" />
          <van-button square type="danger" text="删除" class="!h-full" @click="remove(item)" />
        </template>
      </van-swipe-cell>

      <!-- 最后一项：直接新增 -->
      <div class="flex items-center gap-[10px] bg-[var(--color-block-background)] rounded-[12px] px-[14px] py-[12px]">
        <van-icon name="plus" class="text-[var(--van-primary-color)]" />
        <input
          v-model="newName"
          class="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--van-text-color-3)]"
          placeholder="新增任务，回车确认"
          @keyup.enter="addTodo"
        >
      </div>
    </div>

    <van-popup v-model:show="showEdit" position="bottom" round class="!pb-[24px]">
      <div class="pl-[24px] pt-[24px] pb-[8px] text-left text-[16px] font-bold">
        {{ popupTitle }}
      </div>

      <!-- 编辑任务 -->
      <template v-if="popupMode === 'edit'">
        <van-cell-group inset class="!my-[12px]">
          <van-field v-model="editing.name" label="任务名称" placeholder="请输入任务名称" maxlength="30" />
          <van-field
            :model-value="priorityTag[editing.priority].text"
            label="优先级"
            placeholder="选择优先级"
            readonly
            is-link
            @click="showPriorityPicker = true"
          />
        </van-cell-group>
        <div class="flex gap-[16px] px-[20px] pt-[16px]">
          <van-button block round plain type="primary" @click="toPomodoro">
            转为番茄闹钟
          </van-button>
          <van-button block round plain type="primary" @click="toHabit">
            转为习惯打卡
          </van-button>
        </div>
        <div class="flex gap-[16px] px-[20px] pt-[16px]">
          <van-button block round @click="showEdit = false">
            取消
          </van-button>
          <van-button block round type="primary" @click="confirmEdit">
            确定
          </van-button>
        </div>
      </template>

      <!-- 转为番茄闹钟：任务名称、优先级、日期、时长 -->
      <template v-else>
        <van-cell-group inset class="!my-[12px]">
          <van-field v-model="editing.name" label="任务名称" placeholder="请输入任务名称" maxlength="30" />
          <van-field
            :model-value="priorityTag[editing.priority].text"
            label="优先级"
            placeholder="选择优先级"
            readonly
            is-link
            @click="showPriorityPicker = true"
          />
          <van-field
            v-model="convert.date"
            label="日期"
            placeholder="选择日期"
            readonly
            is-link
            @click="showConvertCalendar = true"
          />
          <van-field label="时长（分钟）">
            <template #input>
              <van-stepper v-model="convert.minutes" min="1" max="120" integer />
            </template>
          </van-field>
        </van-cell-group>
        <div class="flex gap-[16px] px-[20px] pt-[16px]">
          <van-button block round @click="popupMode = 'edit'">
            取消
          </van-button>
          <van-button block round type="primary" @click="confirmPomodoro">
            确定
          </van-button>
        </div>
      </template>
    </van-popup>

    <van-popup v-model:show="showPriorityPicker" position="bottom" round>
      <van-picker
        title="优先级"
        :columns="priorityColumns"
        :model-value="[editing.priority]"
        @confirm="onPriorityConfirm"
        @cancel="showPriorityPicker = false"
      />
    </van-popup>

    <van-calendar
      v-model:show="showConvertCalendar"
      :show-confirm="false"
      @confirm="onConvertCalendarConfirm"
    />
  </div>
</template>
