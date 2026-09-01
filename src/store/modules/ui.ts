export const useUiStore = defineStore('ui', () => {
  // 顶栏加号点击计数，各页面监听后打开自己的新增弹窗
  const addTrigger = ref(0)

  function triggerAdd() {
    addTrigger.value += 1
  }

  return { addTrigger, triggerAdd }
})
