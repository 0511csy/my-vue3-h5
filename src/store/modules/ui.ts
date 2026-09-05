export const useUiStore = defineStore('ui', () => {
  // 顶栏加号点击计数，各页面监听后打开自己的新增弹窗
  const addTrigger = ref(0)
  // 顶栏「回到今天」按钮点击计数，习惯页监听后将日历回到今天
  const todayTrigger = ref(0)
  // 顶栏「回到今天」按钮是否可见（仅选中非今天日期时显示）
  const backToTodayVisible = ref(false)

  function triggerAdd() {
    addTrigger.value += 1
  }
  function triggerToday() {
    todayTrigger.value += 1
  }
  function setBackToTodayVisible(visible: boolean) {
    backToTodayVisible.value = visible
  }

  return { addTrigger, triggerAdd, todayTrigger, triggerToday, backToTodayVisible, setBackToTodayVisible }
})
