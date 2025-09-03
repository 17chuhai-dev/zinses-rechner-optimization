<!--
  焦点陷阱组件
  确保焦点在指定容器内循环，用于模态框和下拉菜单等
-->

<template>
  <div
    ref="containerRef"
    :class="containerClass"
    @keydown="handleKeydown"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <!-- 焦点守卫 - 开始 -->
    <div
      v-if="active"
      tabindex="0"
      class="focus-guard focus-guard-start sr-only"
      @focus="focusLastElement"
      aria-hidden="true"
    />
    
    <!-- 内容插槽 -->
    <slot />
    
    <!-- 焦点守卫 - 结束 -->
    <div
      v-if="active"
      tabindex="0"
      class="focus-guard focus-guard-end sr-only"
      @focus="focusFirstElement"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useKeyboardNavigation } from '@/services/KeyboardNavigationService'

// Props
interface Props {
  active?: boolean
  initialFocus?: string | HTMLElement
  returnFocus?: HTMLElement
  allowOutsideClick?: boolean
  escapeDeactivates?: boolean
  containerClass?: string
  includeContainer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  allowOutsideClick: false,
  escapeDeactivates: true,
  containerClass: '',
  includeContainer: false
})

// Emits
interface Emits {
  activate: []
  deactivate: []
  focusIn: [element: HTMLElement]
  focusOut: [element: HTMLElement]
  escapePressed: []
}

const emit = defineEmits<Emits>()

// 使用键盘导航服务
const { createFocusTrap, releaseFocusTrap } = useKeyboardNavigation()

// 响应式引用
const containerRef = ref<HTMLElement>()
const previouslyFocusedElement = ref<HTMLElement | null>(null)
const isActive = ref(false)

// 焦点元素选择器
const focusableSelectors = [
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'a[href]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
  'details summary:not([tabindex="-1"])',
  'audio[controls]:not([tabindex="-1"])',
  'video[controls]:not([tabindex="-1"])'
].join(', ')

// 计算属性
const focusableElements = computed(() => {
  if (!containerRef.value) return []
  
  const elements = Array.from(
    containerRef.value.querySelectorAll(focusableSelectors)
  ) as HTMLElement[]
  
  return elements.filter(el => isElementVisible(el) && isElementFocusable(el))
})

const firstFocusableElement = computed(() => {
  return focusableElements.value[0] || null
})

const lastFocusableElement = computed(() => {
  const elements = focusableElements.value
  return elements[elements.length - 1] || null
})

// 监听器
watch(() => props.active, (newValue) => {
  if (newValue) {
    activate()
  } else {
    deactivate()
  }
}, { immediate: true })

// 方法
const activate = async () => {
  if (isActive.value) return
  
  // 保存当前焦点元素
  previouslyFocusedElement.value = document.activeElement as HTMLElement
  
  isActive.value = true
  emit('activate')
  
  await nextTick()
  
  if (containerRef.value) {
    // 创建焦点陷阱
    createFocusTrap({
      container: containerRef.value,
      initialFocus: getInitialFocusElement(),
      returnFocus: props.returnFocus || previouslyFocusedElement.value,
      allowOutsideClick: props.allowOutsideClick,
      escapeDeactivates: props.escapeDeactivates
    })
    
    // 设置初始焦点
    setInitialFocus()
  }
}

const deactivate = () => {
  if (!isActive.value) return
  
  isActive.value = false
  emit('deactivate')
  
  // 释放焦点陷阱
  releaseFocusTrap()
  
  // 恢复之前的焦点
  if (props.returnFocus) {
    props.returnFocus.focus()
  } else if (previouslyFocusedElement.value) {
    previouslyFocusedElement.value.focus()
  }
}

const getInitialFocusElement = (): HTMLElement | string | undefined => {
  if (typeof props.initialFocus === 'string') {
    return props.initialFocus
  } else if (props.initialFocus instanceof HTMLElement) {
    return props.initialFocus
  }
  return undefined
}

const setInitialFocus = () => {
  let elementToFocus: HTMLElement | null = null
  
  if (typeof props.initialFocus === 'string') {
    elementToFocus = containerRef.value?.querySelector(props.initialFocus) as HTMLElement
  } else if (props.initialFocus instanceof HTMLElement) {
    elementToFocus = props.initialFocus
  } else {
    elementToFocus = firstFocusableElement.value
  }
  
  if (elementToFocus && isElementFocusable(elementToFocus)) {
    elementToFocus.focus()
  }
}

const focusFirstElement = () => {
  if (firstFocusableElement.value) {
    firstFocusableElement.value.focus()
  }
}

const focusLastElement = () => {
  if (lastFocusableElement.value) {
    lastFocusableElement.value.focus()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isActive.value) return
  
  switch (e.key) {
    case 'Tab':
      handleTabKey(e)
      break
    case 'Escape':
      if (props.escapeDeactivates) {
        e.preventDefault()
        emit('escapePressed')
        deactivate()
      }
      break
  }
}

const handleTabKey = (e: KeyboardEvent) => {
  const elements = focusableElements.value
  if (elements.length === 0) return
  
  const currentIndex = elements.indexOf(document.activeElement as HTMLElement)
  
  if (e.shiftKey) {
    // Shift + Tab - 向前导航
    if (currentIndex <= 0) {
      e.preventDefault()
      focusLastElement()
    }
  } else {
    // Tab - 向后导航
    if (currentIndex >= elements.length - 1) {
      e.preventDefault()
      focusFirstElement()
    }
  }
}

const handleFocusIn = (e: FocusEvent) => {
  const target = e.target as HTMLElement
  
  if (!isActive.value || !containerRef.value) return
  
  // 检查焦点是否在容器内
  if (!containerRef.value.contains(target)) {
    // 焦点在容器外，重定向到第一个可聚焦元素
    e.preventDefault()
    focusFirstElement()
    return
  }
  
  emit('focusIn', target)
}

const handleFocusOut = (e: FocusEvent) => {
  const target = e.target as HTMLElement
  
  if (!isActive.value) return
  
  emit('focusOut', target)
  
  // 延迟检查，确保新焦点已设置
  setTimeout(() => {
    if (!containerRef.value || !isActive.value) return
    
    const newFocusedElement = document.activeElement as HTMLElement
    
    // 如果新焦点不在容器内且不允许外部点击，重定向焦点
    if (!props.allowOutsideClick && 
        newFocusedElement && 
        !containerRef.value.contains(newFocusedElement)) {
      focusFirstElement()
    }
  }, 0)
}

const isElementVisible = (element: HTMLElement): boolean => {
  if (!element) return false
  
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 && 
         element.offsetHeight > 0
}

const isElementFocusable = (element: HTMLElement): boolean => {
  if (!element || element.disabled) return false
  
  const tabIndex = element.tabIndex
  if (tabIndex < 0) return false
  
  return isElementVisible(element)
}

// 暴露方法给父组件
defineExpose({
  activate,
  deactivate,
  focusFirstElement,
  focusLastElement,
  focusableElements: focusableElements,
  isActive: computed(() => isActive.value)
})

// 生命周期
onMounted(() => {
  if (props.active) {
    activate()
  }
})

onUnmounted(() => {
  if (isActive.value) {
    deactivate()
  }
})
</script>

<style scoped>
.focus-guard {
  position: fixed;
  top: -1px;
  left: -1px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* 确保焦点守卫不可见但可聚焦 */
.focus-guard:focus {
  outline: none;
}

/* 屏幕阅读器专用类 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 焦点可见性增强 */
:global(.focus-visible) *:focus {
  outline: 2px solid var(--color-border-focus, #3b82f6);
  outline-offset: 2px;
}

/* 高对比度模式支持 */
:global(.high-contrast) *:focus {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

/* 减少动画模式支持 */
:global(.reduced-motion) * {
  transition: none !important;
  animation: none !important;
}
</style>
