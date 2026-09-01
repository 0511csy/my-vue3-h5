<script setup lang="ts">
import { showToast } from 'vant'
import { uid, useFocusAppStore } from '@/store/modules/focus-app'

defineOptions({ name: 'MemoEdit' })

const route = useRoute()
const router = useRouter()
const store = useFocusAppStore()

const existing = store.memos.find(m => m.id === route.query.id)
const title = ref(existing?.title ?? '')
let content = existing?.content ?? ''

const editorRef = ref<HTMLElement>()

// Vant 图标库没有斜体/下划线图标，工具按钮统一用文字样式呈现
// formatBlock 的标签值需要尖括号包裹，Firefox 下不带括号不生效
const tools = [
  { key: 'bold', cmd: 'bold', label: 'B', class: 'font-bold text-[17px]' },
  { key: 'italic', cmd: 'italic', label: 'I', class: 'font-serif italic text-[17px]' },
  { key: 'underline', cmd: 'underline', label: 'U', class: 'underline text-[16px]' },
  { key: 'list', cmd: 'insertUnorderedList', icon: 'bars' },
  { key: 'h2', cmd: 'formatBlock', value: '<h2>', label: 'H2', class: 'text-[13px] font-bold' },
  { key: 'p', cmd: 'formatBlock', value: '<p>', label: '正文', class: 'text-[12px]' },
]
const toolTitles: Record<string, string> = {
  bold: '加粗',
  italic: '斜体',
  underline: '下划线',
  list: '列表',
  h2: '标题',
  p: '正文',
}

// 与浏览器选区同步的激活状态
const activeStates = ref<Record<string, boolean>>({})
function refreshActive() {
  try {
    const block = `${document.queryCommandValue('formatBlock')}`.toLowerCase()
    activeStates.value = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      list: document.queryCommandState('insertUnorderedList'),
      h2: block === 'h2',
      p: block === 'p' || block === '',
    }
  }
  catch {
    // 选区不在可编辑区域时忽略
  }
}

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = content
    refreshActive()
  }
})

function exec(tool: (typeof tools)[number]) {
  editorRef.value?.focus()
  if (tool.key === 'p')
    document.execCommand('defaultParagraphSeparator', false, 'p')
  if (tool.key === 'h2' || tool.key === 'p')
    applyBlock(tool.key)
  else
    document.execCommand(tool.cmd, false, tool.value)
  refreshActive()
}

const BLOCK_RE = /^(?:H[1-6]|P|DIV)$/i

// 从光标位置向上找最近的块级元素（不含编辑器本身）
function findBlock(node: Node | null): HTMLElement | null {
  const editor = editorRef.value
  while (node && node !== editor) {
    if (node instanceof HTMLElement && BLOCK_RE.test(node.tagName))
      return node
    node = node.parentNode
  }
  return null
}

// 把块级元素整体替换为目标标签，保留内部内容
function swapTag(block: HTMLElement, tag: string) {
  const next = document.createElement(tag)
  while (block.firstChild)
    next.appendChild(block.firstChild)
  block.replaceWith(next)
  const sel = window.getSelection()
  if (sel) {
    const range = document.createRange()
    range.selectNodeContents(next)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

// execCommand('formatBlock') 在光标位于 h2 等标题内时无法降级回 p，
// 这里手动替换块级标签，光标 collapsed 与划选多个块都支持
function applyBlock(tag: 'h2' | 'p') {
  const editor = editorRef.value
  const sel = window.getSelection()
  if (!editor || !sel || !sel.rangeCount)
    return
  const range = sel.getRangeAt(0)

  // 列表内容不做块级格式化，避免破坏 ul/li 结构
  let node: Node | null = range.startContainer
  while (node) {
    if (node instanceof HTMLElement && ['LI', 'UL', 'OL'].includes(node.tagName))
      return
    node = node.parentNode
  }

  if (range.collapsed) {
    const block = findBlock(range.startContainer)
    // 没有块级父元素（编辑器里的裸文本）时走 execCommand 包一层
    if (!block) {
      document.execCommand('formatBlock', false, `<${tag}>`)
      return
    }
    if (block.tagName.toLowerCase() !== tag)
      swapTag(block, tag)
    return
  }

  Array.from(editor.children).forEach((child) => {
    if (
      range.intersectsNode(child)
      && child instanceof HTMLElement
      && BLOCK_RE.test(child.tagName)
      && child.tagName.toLowerCase() !== tag
    ) {
      swapTag(child, tag)
    }
  })
}

function done() {
  content = editorRef.value?.innerHTML ?? ''
  store.saveMemo({
    id: (existing?.id) || uid(),
    title: title.value.trim(),
    content,
    updatedAt: Date.now(),
  })
  showToast('已保存')
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[var(--color-background-2)]">
    <van-nav-bar
      title="备忘录"
      left-arrow
      fixed
      placeholder
      @click-left="router.back()"
    >
      <template #right>
        <span class="text-[15px] font-medium text-[var(--van-primary-color)]" @click="done">完成</span>
      </template>
    </van-nav-bar>

    <van-field
      v-model="title"
      placeholder="标题"
      class="!bg-transparent !pt-[8px]"
      :border="false"
    />

    <div
      ref="editorRef"
      contenteditable="true"
      class="memo-editor mx-[12px] min-h-[300px] flex-1 bg-[var(--color-block-background)] rounded-[12px] px-[16px] py-[12px] text-[15px] leading-[24px] outline-none"
      @keyup="refreshActive"
      @mouseup="refreshActive"
      @focus="refreshActive"
    />

    <!-- mousedown.prevent 阻止编辑器失焦，保证选区不丢失，工具栏才能生效 -->
    <div class="flex items-center justify-around bg-[var(--color-block-background)] px-[12px] py-[6px]">
      <button
        v-for="t in tools"
        :key="t.key"
        type="button"
        :title="toolTitles[t.key]"
        class="flex h-[38px] w-[44px] cursor-pointer items-center justify-center rounded-[8px] transition-colors"
        :class="activeStates[t.key] ? 'bg-[var(--van-primary-color)]/12 text-[var(--van-primary-color)]' : 'text-[var(--van-text-color)]'"
        @mousedown.prevent
        @click="exec(t)"
      >
        <van-icon v-if="t.icon" :name="t.icon" size="20" />
        <span v-else :class="t.class">{{ t.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
// Tailwind preflight 会抹平 h2/ul 的默认样式，编辑器内需手动恢复，
// 否则「标题 / 正文 / 列表」按钮执行了命令却看不出变化
.memo-editor :deep(h2) {
  font-size: 18px;
  font-weight: 600;
  margin: 8px 0 4px;
}

.memo-editor :deep(ul) {
  list-style: disc;
  padding-left: 20px;
  margin: 4px 0;
}
</style>
