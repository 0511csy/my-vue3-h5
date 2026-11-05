import { http } from '@/utils/http'

// 会话凭据存于 localStorage（key 与 utils/http 中读取的保持一致）
export const useAuthStore = defineStore('auth', () => {
  const token = useStorage('focus_jwt', '')
  const username = useStorage('focus_username', '')
  const isLoggedIn = computed(() => !!token.value)

  async function login(name: string, password: string) {
    const r = await http.post<{ token: string, username: string }>('/auth/login', { username: name, password })
    token.value = r.token
    username.value = r.username
  }

  async function register(name: string, password: string) {
    const r = await http.post<{ token: string, username: string }>('/auth/register', { username: name, password })
    token.value = r.token
    username.value = r.username
  }

  function logout() {
    token.value = ''
    username.value = ''
  }

  return { token, username, isLoggedIn, login, register, logout }
})
