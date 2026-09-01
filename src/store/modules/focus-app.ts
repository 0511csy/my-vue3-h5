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

export const useFocusAppStore = defineStore('focus-app', () => {
  const pomodoros = useStorage<Pomodoro[]>('focus_pomodoros', defaultPomodoros)
  const todos = useStorage<Todo[]>('focus_todos', [])
  const habits = useStorage<Habit[]>('focus_habits', defaultHabits)
  const memos = useStorage<Memo[]>('focus_memos', [])
  const focusSessions = useStorage<FocusSession[]>('focus_sessions', [])

  const todayFocusCount = computed(() =>
    focusSessions.value.filter(s => s.date === todayStr()).length,
  )
  const todayFocusMinutes = computed(() =>
    focusSessions.value
      .filter(s => s.date === todayStr())
      .reduce((sum, s) => sum + s.minutes, 0),
  )

  function addFocusSession(name: string, minutes: number) {
    focusSessions.value.push({ id: uid(), name, minutes, date: todayStr(), at: Date.now() })
  }

  function savePomodoro(p: Pomodoro) {
    const index = pomodoros.value.findIndex(item => item.id === p.id)
    if (index > -1)
      pomodoros.value.splice(index, 1, p)
    else
      pomodoros.value.push(p)
  }
  function removePomodoro(id: string) {
    pomodoros.value = pomodoros.value.filter(item => item.id !== id)
  }

  function saveTodo(t: Todo) {
    const index = todos.value.findIndex(item => item.id === t.id)
    if (index > -1)
      todos.value.splice(index, 1, t)
    else
      todos.value.push(t)
  }
  function removeTodo(id: string) {
    todos.value = todos.value.filter(item => item.id !== id)
  }
  function toggleTodo(id: string) {
    const todo = todos.value.find(item => item.id === id)
    if (todo)
      todo.done = !todo.done
  }

  function saveHabit(h: Habit) {
    const index = habits.value.findIndex(item => item.id === h.id)
    if (index > -1)
      habits.value.splice(index, 1, h)
    else
      habits.value.push(h)
  }
  function removeHabit(id: string) {
    habits.value = habits.value.filter(item => item.id !== id)
  }
  function toggleHabitCheck(id: string, date = todayStr()) {
    const habit = habits.value.find(item => item.id === id)
    if (!habit)
      return
    const index = habit.records.indexOf(date)
    if (index > -1)
      habit.records.splice(index, 1)
    else
      habit.records.push(date)
  }

  function saveMemo(m: Memo) {
    const index = memos.value.findIndex(item => item.id === m.id)
    m.updatedAt = Date.now()
    if (index > -1)
      memos.value.splice(index, 1, m)
    else
      memos.value.push(m)
  }
  function removeMemo(id: string) {
    memos.value = memos.value.filter(item => item.id !== id)
  }

  return {
    pomodoros,
    todos,
    habits,
    memos,
    focusSessions,
    todayFocusCount,
    todayFocusMinutes,
    addFocusSession,
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
  }
})
