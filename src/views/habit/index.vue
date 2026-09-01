<script setup lang="ts">
import type { Habit } from '@/store/modules/focus-app'
import { showConfirmDialog, showToast } from 'vant'
import { todayStr, uid, useFocusAppStore } from '@/store/modules/focus-app'
import { useUiStore } from '@/store/modules/ui'

defineOptions({ name: 'Habit' })

const store = useFocusAppStore()
const uiStore = useUiStore()
const { habits } = storeToRefs(store)

const freqOptions = ['每天', '工作日', '周末', '每周一', '每周二', '每周三', '每周四', '每周五', '每周六', '每周日']

// 习惯标签色板：按习惯在列表中的顺序取色，日历圆点与列表标签共用
const habitColors = ['#ee0a24', '#ff976a', '#ffc300', '#1989fa', '#07c160', '#7232dd']
const colorById = computed(() => {
  const map = new Map<string, string>()
  habits.value.forEach((h, i) => map.set(h.id, habitColors[i % habitColors.length]))
  return map
})
function habitColor(h: Habit) {
  return colorById.value.get(h.id) ?? habitColors[0]
}

// ---- 自定义月历 ----
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth()) // 0-11
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const monthTitle = computed(() => `${year.value}年${month.value + 1}月`)

// 当月日期 -> 当日已打卡的习惯（用于日历圆点着色）
const checkedHabitsByDate = computed(() => {
  const prefix = `${year.value}-${`${month.value + 1}`.padStart(2, '0')}`
  const map = new Map<string, Habit[]>()
  habits.value.forEach((h) => {
    h.records.forEach((d) => {
      if (!d.startsWith(prefix))
        return
      if (!map.has(d))
        map.set(d, [])
      map.get(d)!.push(h)
    })
  })
  return map
})

function cellColors(cell: string | null) {
  if (!cell)
    return []
  return (checkedHabitsByDate.value.get(cell) ?? []).map(habitColor)
}

const calendarCells = computed(() => {
  const firstDay = new Date(year.value, month.value, 1).getDay()
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  const cells: (string | null)[] = Array.from({ length: firstDay }, () => null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year.value}-${`${month.value + 1}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`)
  }
  return cells
})

function prevMonth() {
  if (month.value === 0) {
    year.value -= 1
    month.value = 11
  }
  else {
    month.value -= 1
  }
}
function nextMonth() {
  if (month.value === 11) {
    year.value += 1
    month.value = 0
  }
  else {
    month.value += 1
  }
}
function cellDay(cell: string | null) {
  return cell ? Number(cell.slice(8)) : ''
}

// ---- 点击日期：查看当日打卡习惯 ----
const showDay = ref(false)
const selectedDate = ref('')
const dayTitle = computed(() => {
  if (!selectedDate.value)
    return ''
  const [, m, d] = selectedDate.value.split('-')
  return `${Number(m)}月${Number(d)}日`
})
const dayHabits = computed(() =>
  habits.value.filter(h => h.records.includes(selectedDate.value)),
)
function openDay(cell: string | null) {
  if (!cell)
    return
  selectedDate.value = cell
  showDay.value = true
}

// ---- 打卡列表 ----
const today = todayStr()
function isChecked(h: Habit) {
  return h.records.includes(today)
}

// 日期数字样式：今天实心、选中外圈描边、有打卡记录的文字标色
function cellNumClass(cell: string) {
  if (cell === today)
    return 'font-bold bg-[var(--van-primary-color)] text-white'
  if (cell === selectedDate.value)
    return 'font-semibold text-[var(--van-primary-color)] ring-[1.5px] ring-[var(--van-primary-color)]'
  if (checkedHabitsByDate.value.has(cell))
    return 'text-[var(--van-primary-color)]'
  return ''
}

// ---- 新增 / 编辑 ----
const showEdit = ref(false)
const editing = ref<Habit>({ id: '', name: '', freq: '每天', records: [] })
const showFreqPicker = ref(false)
const freqColumns = freqOptions.map(f => ({ text: f, value: f }))

watch(() => uiStore.addTrigger, () => openNew())

function openNew() {
  editing.value = { id: '', name: '', freq: '每天', records: [] }
  showEdit.value = true
}
function openEdit(h: Habit) {
  editing.value = { ...h, records: [...h.records] }
  showEdit.value = true
}
function onFreqConfirm({ selectedOptions }: { selectedOptions: { text: string }[] }) {
  editing.value.freq = selectedOptions[0].text
  showFreqPicker.value = false
}
function confirmEdit() {
  if (!editing.value.name.trim()) {
    showToast('请输入习惯名称')
    return
  }
  const h = { ...editing.value, name: editing.value.name.trim() }
  if (!h.id)
    h.id = uid()
  store.saveHabit(h)
  showEdit.value = false
}
function remove(h: Habit) {
  showConfirmDialog({
    title: '删除习惯',
    message: `确定删除「${h.name}」吗？`,
    className: 'dialog-danger',
  }).then(() => {
    store.removeHabit(h.id)
    showToast('已删除')
  }).catch(() => {})
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background-2)] pb-[20px]">
    <!-- 日历 -->
    <div class="mx-[12px] mt-[12px] mb-[16px] bg-[var(--color-block-background)] rounded-[12px] px-[12px] py-[12px]">
      <div class="mb-[8px] flex items-center justify-between">
        <van-icon name="arrow-left" size="18" @click="prevMonth" />
        <span class="text-[15px] font-medium">{{ monthTitle }}</span>
        <van-icon name="arrow" size="18" @click="nextMonth" />
      </div>
      <div class="grid grid-cols-7 text-center text-[12px] text-[var(--van-text-color-3)]">
        <span v-for="w in weekdays" :key="w" class="py-[4px]">{{ w }}</span>
      </div>
      <div class="grid grid-cols-7 text-center">
        <div v-for="(cell, i) in calendarCells" :key="i" class="flex h-[38px] items-center justify-center">
          <template v-if="cell">
            <button type="button" class="flex cursor-pointer flex-col items-center" @click="openDay(cell)">
              <span
                class="flex h-[26px] min-w-[26px] items-center justify-center rounded-full px-[4px] text-[13px] transition-colors"
                :class="cellNumClass(cell)"
              >
                {{ cellDay(cell) }}
              </span>
              <!-- 有打卡记录：显示各习惯颜色圆点，超过 4 个显示图标 -->
              <span class="mt-[2px] flex h-[6px] items-center justify-center gap-[2px]">
                <template v-if="cellColors(cell).length > 0 && cellColors(cell).length <= 4">
                  <span
                    v-for="(c, j) in cellColors(cell)"
                    :key="j"
                    class="h-[4px] w-[4px] rounded-full"
                    :style="{ background: c }"
                  />
                </template>
                <span v-else-if="cellColors(cell).length > 4" class="flex items-center gap-[2px]">
                  <span v-for="j in 3" :key="j" class="h-[3px] w-[3px] rounded-full bg-[var(--van-text-color-3)]" />
                </span>
              </span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 打卡列表 -->
    <van-empty v-if="habits.length === 0" description="暂无习惯，点击右上角新增" />

    <div class="px-[12px]">
      <van-swipe-cell v-for="item in habits" :key="item.id" class="mb-[12px] rounded-[12px]">
        <div class="flex items-center justify-between bg-[var(--color-block-background)] rounded-[12px] px-[16px] py-[14px]">
          <div>
            <div class="flex items-center">
              <span
                class="mr-[8px] h-[14px] w-[4px] shrink-0 rounded-full"
                :style="{ background: habitColor(item) }"
              />
              <span class="text-[15px] font-medium">{{ item.name }}</span>
            </div>
            <div class="mt-[4px] text-[12px] text-[var(--van-text-color-2)]">
              {{ item.freq }} · 已打卡 {{ item.records.length }} 天
            </div>
          </div>
          <van-button
            :type="isChecked(item) ? 'success' : 'primary'"
            :plain="isChecked(item)"
            size="small"
            round
            @click="store.toggleHabitCheck(item.id)"
          >
            {{ isChecked(item) ? '已打卡' : '打卡' }}
          </van-button>
        </div>
        <template #right>
          <van-button square type="primary" text="编辑" class="!h-full" @click="openEdit(item)" />
          <van-button square type="danger" text="删除" class="!h-full" @click="remove(item)" />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 某日打卡记录 -->
    <van-popup v-model:show="showDay" position="bottom" round class="!pb-[24px]">
      <div class="pl-[24px] pt-[24px] pb-[4px] text-left text-[16px] font-bold">
        {{ dayTitle }} 打卡记录
      </div>
      <div class="px-[20px] pb-[8px] pt-[8px]">
        <template v-if="dayHabits.length > 0">
          <div
            v-for="h in dayHabits"
            :key="h.id"
            class="mt-[10px] flex items-center justify-between rounded-[12px] bg-[var(--color-background-2)] px-[16px] py-[12px]"
          >
            <span class="flex items-center text-[15px]">
              <span
                class="mr-[8px] h-[14px] w-[4px] rounded-full"
                :style="{ background: habitColor(h) }"
              />
              {{ h.name }}
            </span>
            <van-icon name="checked" size="18" class="text-[var(--van-success-color)]" />
          </div>
        </template>
        <van-empty v-else description="当天暂无打卡记录" image-size="64" />
      </div>
    </van-popup>

    <van-popup v-model:show="showEdit" position="bottom" round class="!pb-[24px]">
      <div class="pl-[24px] pt-[24px] pb-[8px] text-left text-[16px] font-bold">
        {{ editing.id ? '编辑习惯' : '新增习惯' }}
      </div>
      <van-cell-group inset class="!my-[12px]">
        <van-field v-model="editing.name" label="习惯名称" placeholder="请输入习惯名称" maxlength="20" />
        <van-field
          v-model="editing.freq"
          label="频率"
          placeholder="选择频率"
          readonly
          is-link
          @click="showFreqPicker = true"
        />
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

    <van-popup v-model:show="showFreqPicker" position="bottom" round>
      <van-picker
        title="频率"
        :columns="freqColumns"
        @confirm="onFreqConfirm"
        @cancel="showFreqPicker = false"
      />
    </van-popup>
  </div>
</template>
