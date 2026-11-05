import {
  createRouter,
  createWebHashHistory,
} from 'vue-router'
import { useAuthStore } from '@/store/modules/auth'
import { useCachedViewStore } from '@/store/modules/cached-view'
import setPageTitle from '@/utils/set-page-title'
import routes from './routes'

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  // 路由缓存
  useCachedViewStore().addCachedView(to)
  // 页面 title
  setPageTitle(to.meta.title)
  // 登录守卫：未登录一律去登录页，已登录访问登录页则回首页
  const auth = useAuthStore()
  if (to.name !== 'Login' && !auth.isLoggedIn)
    next({ name: 'Login' })
  else if (to.name === 'Login' && auth.isLoggedIn)
    next({ name: 'Focus' })
  else
    next()
})

export default router
