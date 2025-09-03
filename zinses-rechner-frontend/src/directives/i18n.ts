/**
 * 德语本地化指令
 * 提供v-t指令用于模板中的德语文本处理
 * 专注于德语用户体验优化
 */

import type { Directive, DirectiveBinding } from 'vue'
import { i18nService } from '@/services/I18nService'
import type { TranslationKey, TranslationParams } from '@/services/I18nService'

// 指令绑定值类型
interface I18nDirectiveValue {
  key: TranslationKey
  params?: TranslationParams
  tag?: string
  html?: boolean
}

// 指令参数类型
type I18nDirectiveBinding = DirectiveBinding<TranslationKey | I18nDirectiveValue>

/**
 * 解析指令绑定值
 */
function parseBinding(binding: I18nDirectiveBinding): I18nDirectiveValue {
  if (typeof binding.value === 'string') {
    return {
      key: binding.value,
      params: binding.arg ? { [binding.arg]: binding.arg } : undefined,
      tag: binding.modifiers.tag ? 'span' : undefined,
      html: binding.modifiers.html || false
    }
  }

  return {
    key: binding.value.key,
    params: binding.value.params,
    tag: binding.value.tag,
    html: binding.value.html || binding.modifiers.html || false
  }
}

/**
 * 更新元素内容
 */
function updateElement(el: HTMLElement, config: I18nDirectiveValue): void {
  const translation = i18nService.t(config.key, config.params)

  if (config.html) {
    el.innerHTML = translation
  } else {
    el.textContent = translation
  }

  // 设置语言属性
  el.setAttribute('lang', i18nService.getCurrentLocale())

  // 设置翻译键属性（开发模式）
  if (import.meta.env.DEV) {
    el.setAttribute('data-i18n-key', config.key)
  }
}

/**
 * 创建翻译元素
 */
function createTranslationElement(config: I18nDirectiveValue): HTMLElement {
  const tag = config.tag || 'span'
  const element = document.createElement(tag)

  updateElement(element, config)

  return element
}

/**
 * v-t指令实现
 */
export const vT: Directive<HTMLElement, TranslationKey | I18nDirectiveValue> = {
  // 元素挂载时
  mounted(el: HTMLElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)

    // 如果指定了标签，创建新元素
    if (config.tag && el.tagName.toLowerCase() !== config.tag.toLowerCase()) {
      const newElement = createTranslationElement(config)
      el.parentNode?.replaceChild(newElement, el)
      return
    }

    updateElement(el, config)

    // 存储配置用于更新
    ;(el as any).__i18nConfig = config
  },

  // 元素更新时
  updated(el: HTMLElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)
    const oldConfig = (el as any).__i18nConfig

    // 检查是否需要更新
    if (
      !oldConfig ||
      oldConfig.key !== config.key ||
      JSON.stringify(oldConfig.params) !== JSON.stringify(config.params)
    ) {
      updateElement(el, config)
      ;(el as any).__i18nConfig = config
    }
  },

  // 元素卸载时
  unmounted(el: HTMLElement) {
    delete (el as any).__i18nConfig
  }
}

/**
 * v-t-html指令实现（HTML内容翻译）
 */
export const vTHtml: Directive<HTMLElement, TranslationKey | I18nDirectiveValue> = {
  mounted(el: HTMLElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)
    config.html = true

    updateElement(el, config)
    ;(el as any).__i18nConfig = config
  },

  updated(el: HTMLElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)
    config.html = true
    const oldConfig = (el as any).__i18nConfig

    if (
      !oldConfig ||
      oldConfig.key !== config.key ||
      JSON.stringify(oldConfig.params) !== JSON.stringify(config.params)
    ) {
      updateElement(el, config)
      ;(el as any).__i18nConfig = config
    }
  },

  unmounted(el: HTMLElement) {
    delete (el as any).__i18nConfig
  }
}

/**
 * v-t-attr指令实现（属性翻译）
 */
export const vTAttr: Directive<HTMLElement, Record<string, TranslationKey | I18nDirectiveValue>> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<Record<string, TranslationKey | I18nDirectiveValue>>) {
    const attributes = binding.value

    Object.entries(attributes).forEach(([attr, value]) => {
      const config = typeof value === 'string' ? { key: value } : value
      const translation = i18nService.t(config.key, config.params)

      el.setAttribute(attr, translation)
    })

    ;(el as any).__i18nAttrConfig = attributes
  },

  updated(el: HTMLElement, binding: DirectiveBinding<Record<string, TranslationKey | I18nDirectiveValue>>) {
    const attributes = binding.value
    const oldConfig = (el as any).__i18nAttrConfig

    if (!oldConfig || JSON.stringify(oldConfig) !== JSON.stringify(attributes)) {
      Object.entries(attributes).forEach(([attr, value]) => {
        const config = typeof value === 'string' ? { key: value } : value
        const translation = i18nService.t(config.key, config.params)

        el.setAttribute(attr, translation)
      })

      ;(el as any).__i18nAttrConfig = attributes
    }
  },

  unmounted(el: HTMLElement) {
    delete (el as any).__i18nAttrConfig
  }
}

/**
 * v-t-placeholder指令实现（占位符翻译）
 */
export const vTPlaceholder: Directive<HTMLInputElement | HTMLTextAreaElement, TranslationKey | I18nDirectiveValue> = {
  mounted(el: HTMLInputElement | HTMLTextAreaElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)
    const translation = i18nService.t(config.key, config.params)

    el.placeholder = translation
    ;(el as any).__i18nPlaceholderConfig = config
  },

  updated(el: HTMLInputElement | HTMLTextAreaElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)
    const oldConfig = (el as any).__i18nPlaceholderConfig

    if (
      !oldConfig ||
      oldConfig.key !== config.key ||
      JSON.stringify(oldConfig.params) !== JSON.stringify(config.params)
    ) {
      const translation = i18nService.t(config.key, config.params)
      el.placeholder = translation
      ;(el as any).__i18nPlaceholderConfig = config
    }
  },

  unmounted(el: HTMLInputElement | HTMLTextAreaElement) {
    delete (el as any).__i18nPlaceholderConfig
  }
}

/**
 * v-t-title指令实现（标题翻译）
 */
export const vTTitle: Directive<HTMLElement, TranslationKey | I18nDirectiveValue> = {
  mounted(el: HTMLElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)
    const translation = i18nService.t(config.key, config.params)

    el.title = translation
    ;(el as any).__i18nTitleConfig = config
  },

  updated(el: HTMLElement, binding: I18nDirectiveBinding) {
    const config = parseBinding(binding)
    const oldConfig = (el as any).__i18nTitleConfig

    if (
      !oldConfig ||
      oldConfig.key !== config.key ||
      JSON.stringify(oldConfig.params) !== JSON.stringify(config.params)
    ) {
      const translation = i18nService.t(config.key, config.params)
      el.title = translation
      ;(el as any).__i18nTitleConfig = config
    }
  },

  unmounted(el: HTMLElement) {
    delete (el as any).__i18nTitleConfig
  }
}

/**
 * 数字格式化指令
 */
export const vNumber: Directive<HTMLElement, number | { value: number; options?: Intl.NumberFormatOptions }> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<number | { value: number; options?: Intl.NumberFormatOptions }>) {
    const { value, options } = typeof binding.value === 'number'
      ? { value: binding.value, options: undefined }
      : binding.value

    const formatted = i18nService.formatNumber(value, options)
    el.textContent = formatted

    ;(el as any).__numberConfig = { value, options }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<number | { value: number; options?: Intl.NumberFormatOptions }>) {
    const { value, options } = typeof binding.value === 'number'
      ? { value: binding.value, options: undefined }
      : binding.value

    const oldConfig = (el as any).__numberConfig

    if (
      !oldConfig ||
      oldConfig.value !== value ||
      JSON.stringify(oldConfig.options) !== JSON.stringify(options)
    ) {
      const formatted = i18nService.formatNumber(value, options)
      el.textContent = formatted

      ;(el as any).__numberConfig = { value, options }
    }
  },

  unmounted(el: HTMLElement) {
    delete (el as any).__numberConfig
  }
}

/**
 * 货币格式化指令
 */
export const vCurrency: Directive<HTMLElement, number | { value: number; options?: Intl.NumberFormatOptions }> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<number | { value: number; options?: Intl.NumberFormatOptions }>) {
    const { value, options } = typeof binding.value === 'number'
      ? { value: binding.value, options: undefined }
      : binding.value

    const formatted = i18nService.formatCurrency(value, options)
    el.textContent = formatted

    ;(el as any).__currencyConfig = { value, options }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<number | { value: number; options?: Intl.NumberFormatOptions }>) {
    const { value, options } = typeof binding.value === 'number'
      ? { value: binding.value, options: undefined }
      : binding.value

    const oldConfig = (el as any).__currencyConfig

    if (
      !oldConfig ||
      oldConfig.value !== value ||
      JSON.stringify(oldConfig.options) !== JSON.stringify(options)
    ) {
      const formatted = i18nService.formatCurrency(value, options)
      el.textContent = formatted

      ;(el as any).__currencyConfig = { value, options }
    }
  },

  unmounted(el: HTMLElement) {
    delete (el as any).__currencyConfig
  }
}

/**
 * 日期格式化指令
 */
export const vDate: Directive<HTMLElement, Date | { value: Date; options?: Intl.DateTimeFormatOptions }> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<Date | { value: Date; options?: Intl.DateTimeFormatOptions }>) {
    const { value, options } = binding.value instanceof Date
      ? { value: binding.value, options: undefined }
      : binding.value

    const formatted = i18nService.formatDate(value, options)
    el.textContent = formatted

    ;(el as any).__dateConfig = { value, options }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<Date | { value: Date; options?: Intl.DateTimeFormatOptions }>) {
    const { value, options } = binding.value instanceof Date
      ? { value: binding.value, options: undefined }
      : binding.value

    const oldConfig = (el as any).__dateConfig

    if (
      !oldConfig ||
      oldConfig.value.getTime() !== value.getTime() ||
      JSON.stringify(oldConfig.options) !== JSON.stringify(options)
    ) {
      const formatted = i18nService.formatDate(value, options)
      el.textContent = formatted

      ;(el as any).__dateConfig = { value, options }
    }
  },

  unmounted(el: HTMLElement) {
    delete (el as any).__dateConfig
  }
}

/**
 * 注册所有i18n指令
 */
export function registerI18nDirectives(app: any): void {
  app.directive('t', vT)
  app.directive('t-html', vTHtml)
  app.directive('t-attr', vTAttr)
  app.directive('t-placeholder', vTPlaceholder)
  app.directive('t-title', vTTitle)
  app.directive('number', vNumber)
  app.directive('currency', vCurrency)
  app.directive('date', vDate)
}

// 默认导出
export default {
  vT,
  vTHtml,
  vTAttr,
  vTPlaceholder,
  vTTitle,
  vNumber,
  vCurrency,
  vDate,
  registerI18nDirectives
}
