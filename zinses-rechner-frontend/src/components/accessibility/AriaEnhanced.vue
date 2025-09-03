<!--
  ARIA增强组件
  为任何元素添加完整的ARIA支持和屏幕阅读器优化
-->

<template>
  <component
    :is="tag"
    :ref="elementRef"
    v-bind="computedAttributes"
    :class="computedClasses"
    @focus="handleFocus"
    @blur="handleBlur"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- 描述性文本（屏幕阅读器专用） -->
    <span
      v-if="description && !hideDescription"
      :id="descriptionId"
      class="sr-only"
    >
      {{ description }}
    </span>
    
    <!-- 错误消息 -->
    <span
      v-if="errorMessage && showError"
      :id="errorId"
      class="sr-only"
      role="alert"
      aria-live="assertive"
    >
      {{ errorMessage }}
    </span>
    
    <!-- 帮助文本 -->
    <span
      v-if="helpText && showHelp"
      :id="helpId"
      class="sr-only"
    >
      {{ helpText }}
    </span>
    
    <!-- 状态信息 -->
    <span
      v-if="statusText"
      :id="statusId"
      class="sr-only"
      role="status"
      aria-live="polite"
    >
      {{ statusText }}
    </span>
    
    <!-- 主要内容插槽 -->
    <slot />
    
    <!-- 额外的屏幕阅读器内容 -->
    <span
      v-if="srOnlyContent"
      class="sr-only"
    >
      {{ srOnlyContent }}
    </span>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useScreenReader } from '@/services/ScreenReaderService'
import type { AriaAttributes } from '@/services/ScreenReaderService'

// Props
interface Props {
  // 基础属性
  tag?: string
  role?: string
  
  // ARIA标签
  label?: string
  labelledby?: string
  describedby?: string
  
  // 状态属性
  expanded?: boolean
  selected?: boolean
  checked?: boolean
  disabled?: boolean
  hidden?: boolean
  busy?: boolean
  
  // 实时区域属性
  live?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
  relevant?: string
  
  // 关系属性
  controls?: string
  owns?: string
  flowto?: string
  
  // 层级属性
  level?: number
  setsize?: number
  posinset?: number
  
  // 内容属性
  description?: string
  helpText?: string
  errorMessage?: string
  statusText?: string
  srOnlyContent?: string
  
  // 显示控制
  hideDescription?: boolean
  showError?: boolean
  showHelp?: boolean
  
  // 交互属性
  focusable?: boolean
  clickable?: boolean
  
  // 验证属性
  required?: boolean
  invalid?: boolean
  
  // 自定义类
  customClasses?: string | string[]
  
  // 公告选项
  announceOnFocus?: boolean
  announceOnClick?: boolean
  announceOnChange?: boolean
  
  // 键盘导航
  keyboardShortcuts?: Record<string, () => void>
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  focusable: false,
  clickable: false,
  announceOnFocus: false,
  announceOnClick: false,
  announceOnChange: false,
  showError: true,
  showHelp: true,
  hideDescription: false
})

// Emits
interface Emits {
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  click: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
  ariaChange: [attribute: string, value: any]
}

const emit = defineEmits<Emits>()

// 使用屏幕阅读器服务
const { 
  announce, 
  announceNavigation, 
  setAriaAttributes, 
  createDescription 
} = useScreenReader()

// 响应式引用
const elementRef = ref<HTMLElement>()

// 生成唯一ID
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const descriptionId = ref(generateId('desc'))
const errorId = ref(generateId('error'))
const helpId = ref(generateId('help'))
const statusId = ref(generateId('status'))

// 计算属性
const computedAttributes = computed(() => {
  const attributes: Record<string, any> = {}
  
  // 基础ARIA属性
  if (props.role) attributes.role = props.role
  if (props.label) attributes['aria-label'] = props.label
  if (props.labelledby) attributes['aria-labelledby'] = props.labelledby
  
  // 描述属性
  const describedbyIds = []
  if (props.describedby) describedbyIds.push(props.describedby)
  if (props.description && !props.hideDescription) describedbyIds.push(descriptionId.value)
  if (props.helpText && props.showHelp) describedbyIds.push(helpId.value)
  if (props.errorMessage && props.showError) describedbyIds.push(errorId.value)
  if (describedbyIds.length > 0) {
    attributes['aria-describedby'] = describedbyIds.join(' ')
  }
  
  // 状态属性
  if (props.expanded !== undefined) attributes['aria-expanded'] = props.expanded
  if (props.selected !== undefined) attributes['aria-selected'] = props.selected
  if (props.checked !== undefined) attributes['aria-checked'] = props.checked
  if (props.disabled !== undefined) attributes['aria-disabled'] = props.disabled
  if (props.hidden !== undefined) attributes['aria-hidden'] = props.hidden
  if (props.busy !== undefined) attributes['aria-busy'] = props.busy
  
  // 实时区域属性
  if (props.live) attributes['aria-live'] = props.live
  if (props.atomic !== undefined) attributes['aria-atomic'] = props.atomic
  if (props.relevant) attributes['aria-relevant'] = props.relevant
  
  // 关系属性
  if (props.controls) attributes['aria-controls'] = props.controls
  if (props.owns) attributes['aria-owns'] = props.owns
  if (props.flowto) attributes['aria-flowto'] = props.flowto
  
  // 层级属性
  if (props.level !== undefined) attributes['aria-level'] = props.level
  if (props.setsize !== undefined) attributes['aria-setsize'] = props.setsize
  if (props.posinset !== undefined) attributes['aria-posinset'] = props.posinset
  
  // 验证属性
  if (props.required) attributes['aria-required'] = true
  if (props.invalid) attributes['aria-invalid'] = true
  
  // 焦点属性
  if (props.focusable) {
    attributes.tabindex = 0
  } else if (props.focusable === false && props.tag !== 'div') {
    attributes.tabindex = -1
  }
  
  return attributes
})

const computedClasses = computed(() => {
  const classes = []
  
  // 自定义类
  if (props.customClasses) {
    if (Array.isArray(props.customClasses)) {
      classes.push(...props.customClasses)
    } else {
      classes.push(props.customClasses)
    }
  }
  
  // 状态类
  if (props.disabled) classes.push('aria-disabled')
  if (props.invalid) classes.push('aria-invalid')
  if (props.selected) classes.push('aria-selected')
  if (props.expanded) classes.push('aria-expanded')
  
  // 交互类
  if (props.focusable) classes.push('focusable')
  if (props.clickable) classes.push('clickable')
  
  return classes
})

// 事件处理
const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
  
  if (props.announceOnFocus) {
    const element = event.target as HTMLElement
    const label = props.label || element.textContent || '元素'
    announceNavigation('formFieldFocused', label)
  }
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleClick = (event: MouseEvent) => {
  emit('click', event)
  
  if (props.announceOnClick) {
    const element = event.target as HTMLElement
    const label = props.label || element.textContent || '按钮'
    announceNavigation('buttonActivated', label)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
  
  // 处理自定义键盘快捷键
  if (props.keyboardShortcuts) {
    const shortcut = props.keyboardShortcuts[event.key]
    if (shortcut) {
      event.preventDefault()
      shortcut()
    }
  }
  
  // 处理标准键盘交互
  if (props.clickable && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    ;(event.target as HTMLElement).click()
  }
}

// 监听属性变化
watch(() => props.expanded, (newValue, oldValue) => {
  if (newValue !== oldValue && props.announceOnChange) {
    const message = newValue ? 'erweitert' : 'eingeklappt'
    announce(message, 'polite')
  }
  emit('ariaChange', 'expanded', newValue)
})

watch(() => props.selected, (newValue, oldValue) => {
  if (newValue !== oldValue && props.announceOnChange) {
    const message = newValue ? 'ausgewählt' : 'nicht ausgewählt'
    announce(message, 'polite')
  }
  emit('ariaChange', 'selected', newValue)
})

watch(() => props.checked, (newValue, oldValue) => {
  if (newValue !== oldValue && props.announceOnChange) {
    const message = newValue ? 'aktiviert' : 'deaktiviert'
    announce(message, 'polite')
  }
  emit('ariaChange', 'checked', newValue)
})

watch(() => props.errorMessage, (newValue) => {
  if (newValue && props.showError) {
    announce(`Fehler: ${newValue}`, 'assertive')
  }
})

watch(() => props.statusText, (newValue) => {
  if (newValue) {
    announce(newValue, 'polite')
  }
})

// 暴露方法
const updateAriaAttribute = (attribute: string, value: any) => {
  if (elementRef.value) {
    if (value !== undefined && value !== null) {
      elementRef.value.setAttribute(`aria-${attribute}`, value.toString())
    } else {
      elementRef.value.removeAttribute(`aria-${attribute}`)
    }
  }
}

const focus = () => {
  if (elementRef.value) {
    elementRef.value.focus()
  }
}

const blur = () => {
  if (elementRef.value) {
    elementRef.value.blur()
  }
}

const announceContent = (message: string, type: 'polite' | 'assertive' = 'polite') => {
  announce(message, type)
}

// 暴露给父组件
defineExpose({
  element: elementRef,
  updateAriaAttribute,
  focus,
  blur,
  announceContent
})

// 生命周期
onMounted(() => {
  // 设置初始ARIA属性
  if (elementRef.value) {
    const ariaAttributes: AriaAttributes = {
      role: props.role,
      label: props.label,
      labelledby: props.labelledby,
      expanded: props.expanded,
      selected: props.selected,
      checked: props.checked,
      disabled: props.disabled,
      hidden: props.hidden,
      busy: props.busy,
      live: props.live,
      atomic: props.atomic,
      relevant: props.relevant,
      controls: props.controls,
      owns: props.owns,
      flowto: props.flowto,
      level: props.level,
      setsize: props.setsize,
      posinset: props.posinset
    }
    
    setAriaAttributes(elementRef.value, ariaAttributes)
  }
})
</script>

<style scoped>
/* 屏幕阅读器专用内容 */
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

/* 焦点增强 */
.focusable:focus {
  outline: 2px solid var(--color-border-focus, #3b82f6);
  outline-offset: 2px;
}

/* 可点击元素样式 */
.clickable {
  cursor: pointer;
}

.clickable:hover {
  opacity: 0.8;
}

/* 状态样式 */
.aria-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.aria-invalid {
  border-color: var(--color-status-error, #ef4444);
}

.aria-selected {
  background-color: var(--color-brand-primary, #3b82f6);
  color: var(--color-text-inverse, #ffffff);
}

.aria-expanded {
  /* 展开状态的样式 */
}

/* 高对比度模式支持 */
:global(.high-contrast) .focusable:focus {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}

:global(.high-contrast) .aria-invalid {
  border: 3px solid currentColor;
}

/* 大字体模式支持 */
:global(.large-text) .sr-only {
  /* 保持隐藏但确保屏幕阅读器可访问 */
}

/* 减少动画模式支持 */
:global(.reduced-motion) * {
  transition: none !important;
  animation: none !important;
}

/* 暗色模式支持 */
:global(.theme-dark) .aria-selected {
  background-color: var(--color-brand-primary, #60a5fa);
  color: var(--color-text-inverse, #0f172a);
}

/* 打印样式 */
@media print {
  .sr-only {
    position: static;
    width: auto;
    height: auto;
    padding: 0;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
    border: 0;
    font-size: 0.8em;
    color: #666;
  }
}

/* 键盘导航增强 */
.focusable[tabindex="0"]:focus-visible {
  outline: 2px solid var(--color-border-focus, #3b82f6);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .clickable {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 动画效果 */
.focusable {
  transition: outline-color 0.2s ease, box-shadow 0.2s ease;
}

.clickable {
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.clickable:active {
  transform: scale(0.98);
}

/* 无障碍增强 */
@media (prefers-reduced-motion: reduce) {
  .focusable,
  .clickable {
    transition: none;
  }
  
  .clickable:active {
    transform: none;
  }
}
</style>
