import type { FocusSession, Habit, Memo, Pomodoro, Todo } from '@/store/modules/focus-app'
import { http } from '@/utils/http'

// 所有接口统一走 src/utils/http 的 axios 封装（含错误 toast、NProgress）
export const focusApi = {
  // ---- 番茄闹钟 ----
  listPomodoros: () => http.get<Pomodoro[]>('/pomodoros'),
  savePomodoro: (p: Pomodoro) => http.post<unknown>('/pomodoros', p),
  removePomodoro: (id: string) => http.delete<unknown>(`/pomodoros/${id}`),

  // ---- 待办 ----
  listTodos: () => http.get<Todo[]>('/todos'),
  saveTodo: (t: Todo) => http.post<unknown>('/todos', t),
  removeTodo: (id: string) => http.delete<unknown>(`/todos/${id}`),

  // ---- 习惯 ----
  listHabits: () => http.get<Habit[]>('/habits'),
  saveHabit: (h: Habit) => http.post<unknown>('/habits', h),
  removeHabit: (id: string) => http.delete<unknown>(`/habits/${id}`),

  // ---- 备忘录 ----
  listMemos: () => http.get<Memo[]>('/memos'),
  saveMemo: (m: Memo) => http.post<unknown>('/memos', m),
  removeMemo: (id: string) => http.delete<unknown>(`/memos/${id}`),

  // ---- 专注记录 ----
  listFocusSessions: () => http.get<FocusSession[]>('/focus-sessions'),
  addFocusSession: (s: FocusSession) => http.post<unknown>('/focus-sessions', s),
}
