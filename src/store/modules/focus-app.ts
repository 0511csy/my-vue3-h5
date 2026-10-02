import { focusApi } from '@/api/focus'

export interface Pomodoro {
  id: string
  name: string
  minutes: number
}

export interface Todo {
  id: string
  name: string
  date: string // yyyy-MM-dd
  time: string // HH:mm
  priority: 0 | 1 | 2 | 3 // 0 无 1 低 2 中 3 高
  done: boolean
}

export interface Habit {
  id: string
  name: string
  freq: string // 每天 / 工作日 / 周末 / 每周一 ...
  records: string[] // 打卡日期 yyyy-MM-dd
}

export interface Memo {
  id: string
  title: string
  content: string
  updatedAt: number
}

export interface FocusSession {
  id: string
  name: string
  minutes: number
  date: string // yyyy-MM-dd
  at: number
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

const defaultPomodoros: Pomodoro[] = [
  { id: uid(), name: '专注', minutes: 25 },
  { id: uid(), name: '休息', minutes: 15 },
  { id: uid(), name: '小憩', minutes: 10 },
]

const defaultHabits: Habit[] = [
  { id: uid(), name: '喝水', freq: '每天', records: [] },
  { id: uid(), name: '阅读', freq: '每天', records: [] },
]

// 数据现在存云端 D1；首次接入时把旧版 localStorage 数据迁移上去
function readLegacy<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
}

export const useFocusAppStore = defineStore('focus-app', () => {
  const pomodoros = ref<Pomodoro[]>([])
  const todos = ref<Todo[]>([])
  const habits = ref<Habit[]>([])
  const memos = ref<Memo[]>([])
  const focusSessions = ref<FocusSession[]>([])

  const loaded = ref(false)

  const todayFocusCount = computed(() =>
    focusSessions.value.filter(s => s.date === todayStr()).length,
  )
  const todayFocusMinutes = computed(() =>
    focusSessions.value
      .filter(s => s.date === todayStr())
      .reduce((sum, s) => sum + s.minutes, 0),
  )

  // 应用启动时调用一次：拉取全部数据，必要时迁移/播种
  async function init() {
    if (loaded.value)
      return
    loaded.value = true

    const [p, t, h, m, s] = await Promise.all([
      focusApi.listPomodoros(),
      focusApi.listTodos(),
      focusApi.listHabits(),
      focusApi.listMemos(),
      focusApi.listFocusSessions(),
    ])
    pomodoros.value = p
    todos.value = t
    habits.value = h
    memos.value = m
    focusSessions.value = s

    await migrateOrSeed(p, h)
  }

  async function migrateOrSeed(serverPomodoros: Pomodoro[], serverHabits: Habit[]) {
    const legacyPomodoros = readLegacy<Pomodoro>('focus_pomodoros')
    const legacyTodos = readLegacy<Todo>('focus_todos')
    const legacyHabits = readLegacy<Habit>('focus_habits')
    const legacyMemos = readLegacy<Memo>('focus_memos')
    const hasLegacy = legacyPomodoros.length + legacyTodos.length + legacyHabits.length + legacyMemos.length > 0

    if (hasLegacy) {
      // 旧版本地数据上传云端，完成后清掉本地键避免重复迁移
      await Promise.all([
        ...legacyPomodoros.map(savePomodoro),
        ...legacyTodos.map(saveTodo),
        ...legacyHabits.map(saveHabit),
        ...legacyMemos.map(saveMemo),
      ])
      ;['focus_pomodoros', 'focus_todos', 'focus_habits', 'focus_memos', 'focus_sessions'].forEach(k => localStorage.removeItem(k))
      pomodoros.value = [...legacyPomodoros, ...pomodoros.value.filter(np => !legacyPomodoros.some(lp => lp.id === np.id))]
      todos.value = [...legacyTodos, ...todos.value.filter(nt => !legacyTodos.some(lt => lt.id === nt.id))]
      habits.value = [...legacyHabits, ...habits.value.filter(nh => !legacyHabits.some(lh => lh.id === nh.id))]
      memos.value = [...legacyMemos, ...memos.value.filter(nm => !legacyMemos.some(lm => lm.id === nm.id))]
      return
    }

    // 首次使用：云端为空且从未播种过时写入默认项
    if (localStorage.getItem('focus_seeded'))
      return
    localStorage.setItem('focus_seeded', '1')
    if (serverPomodoros.length === 0) {
      for (const p of defaultPomodoros)
        await savePomodoro(p)
      pomodoros.value = defaultPomodoros
    }
    if (serverHabits.length === 0) {
      for (const h of defaultHabits)
        await saveHabit(h)
      habits.value = defaultHabits
    }
  }

  async function savePomodoro(p: Pomodoro) {
    const index = pomodoros.value.findIndex(item => item.id === p.id)
    if (index > -1)
      pomodoros.value.splice(index, 1, p)
    else
      pomodoros.value.push(p)
    await focusApi.savePomodoro(p)
  }
  async function removePomodoro(id: string) {
    pomodoros.value = pomodoros.value.filter(item => item.id !== id)
    await focusApi.removePomodoro(id)
  }

  async function saveTodo(t: Todo) {
    const index = todos.value.findIndex(item => item.id === t.id)
    if (index > -1)
      todos.value.splice(index, 1, t)
    else
      todos.value.push(t)
    await focusApi.saveTodo(t)
  }
  async function removeTodo(id: string) {
    todos.value = todos.value.filter(item => item.id !== id)
    await focusApi.removeTodo(id)
  }
  // 乐观更新：先改本地状态，接口失败不回滚（个人应用可接受，下次进入页面以服务端为准）
  async function toggleTodo(id: string) {
    const todo = todos.value.find(item => item.id === id)
    if (!todo)
      return
    todo.done = !todo.done
    await focusApi.saveTodo(todo)
  }

  async function saveHabit(h: Habit) {
    const index = habits.value.findIndex(item => item.id === h.id)
    if (index > -1)
      habits.value.splice(index, 1, h)
    else
      habits.value.push(h)
    await focusApi.saveHabit(h)
  }
  async function removeHabit(id: string) {
    habits.value = habits.value.filter(item => item.id !== id)
    await focusApi.removeHabit(id)
  }
  async function toggleHabitCheck(id: string, date = todayStr()) {
    const habit = habits.value.find(item => item.id === id)
    if (!habit)
      return
    const index = habit.records.indexOf(date)
    if (index > -1)
      habit.records.splice(index, 1)
    else
      habit.records.push(date)
    await focusApi.saveHabit(habit)
  }

  async function saveMemo(m: Memo) {
    m.updatedAt = Date.now()
    const index = memos.value.findIndex(item => item.id === m.id)
    if (index > -1)
      memos.value.splice(index, 1, m)
    else
      memos.value.push(m)
    await focusApi.saveMemo(m)
  }
  async function removeMemo(id: string) {
    memos.value = memos.value.filter(item => item.id !== id)
    await focusApi.removeMemo(id)
  }

  async function addFocusSession(name: string, minutes: number) {
    const session: FocusSession = { id: uid(), name, minutes, date: todayStr(), at: Date.now() }
    focusSessions.value.push(session)
    await focusApi.addFocusSession(session)
  }

  return {
    pomodoros,
    todos,
    habits,
    memos,
    focusSessions,
    loaded,
    todayFocusCount,
    todayFocusMinutes,
    init,
    savePomodoro,
    removePomodoro,
    saveTodo,
    removeTodo,
    toggleTodo,
    saveHabit,
    removeHabit,
    toggleHabitCheck,
    saveMemo,
    removeMemo,
    addFocusSession,
  }
})
