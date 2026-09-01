import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string
    /** 是否不缓存该路由组件 */
    noCache?: boolean
    /** 顶栏是否隐藏导航栏与底部标签栏 */
    hideBar?: boolean
    /** 顶栏右侧是否显示新增按钮 */
    showAdd?: boolean
  }
}
