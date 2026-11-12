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

  // 改密成功后服务端会使所有旧会话失效，调用方需引导重新登录
  async function changePassword(oldPassword: string, newPassword: string) {
    await http.post('/account/change-password', { oldPassword, newPassword })
  }

  return { token, username, isLoggedIn, login, register, logout, changePassword }
})
