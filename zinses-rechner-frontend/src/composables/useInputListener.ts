/**
 * 输入监听器系统
 * 提供全面的用户输入监听和变化检测功能
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { debounce, throttle } from 'lodash-es'

// 输入字段类型定义
export interface InputField {
  key: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio' | 'range' | 'date'
  element?: HTMLElement
  validator?: (value: any) => boolean
  formatter?: (value: any) => any
  debounceMs?: number
  throttleMs?: number
  immediate?: boolean
}

// 输入变化事件
export interface InputChangeEvent {
  field: string
  value: any
  previousValue: any
  timestamp: number
  source: 'user' | 'programmatic'
  isValid: boolean
}

// 输入监听器选项
export interface InputListenerOptions {
  debounceMs?: number
  throttleMs?: number
  validateOnChange?: boolean
  formatOnChange?: boolean
  trackHistory?: boolean
  maxHistorySize?: number
  enableSmartDetection?: boolean
}

// 输入历史记录
export interface InputHistory {
  field: string
  value: any
  timestamp: number
  source: 'user' | 'programmatic'
}

export function useInputListener(options: InputListenerOptions = {}) {
  const {
    debounceMs = 300,
    throttleMs = 100,
    validateOnChange = true,
    formatOnChange = true,
    trackHistory = true,
    maxHistorySize = 50,
    enableSmartDetection = true
  } = options

  // 状态管理
  const fields = ref<Map<string, InputField>>(new Map())
  const values = ref<Record<string, any>>({})
  const previousValues = ref<Record<string, any>>({})
  const validationStates = ref<Record<string, boolean>>({})
  const changeHistory = ref<InputHistory[]>([])
  const isListening = ref(false)

  // 监听器映射
  const listeners = new Map<string, Function>()
  const debouncedListeners = new Map<string, Function>()
  const throttledListeners = new Map<string, Function>()

  // 变化检测
  const hasChanges = computed(() => {
    return Object.keys(values.value).some(key => 
      values.value[key] !== previousValues.value[key]
    )
  })

  const changedFields = computed(() => {
    return Object.keys(values.value).filter(key => 
      values.value[key] !== previousValues.value[key]
    )
  })

  const isAllValid = computed(() => {
    return Object.values(validationStates.value).every(isValid => isValid)
  })

  // 注册输入字段
  const registerField = (field: InputField) => {
    fields.value.set(field.key, field)
    
    // 初始化值和验证状态
    if (!(field.key in values.value)) {
      values.value[field.key] = getDefaultValue(field.type)
      previousValues.value[field.key] = values.value[field.key]
    }
    
    // 初始验证
    if (validateOnChange && field.validator) {
      validationStates.value[field.key] = field.validator(values.value[field.key])
    } else {
      validationStates.value[field.key] = true
    }

    // 创建监听器
    createFieldListener(field)
  }

  // 注销输入字段
  const unregisterField = (fieldKey: string) => {
    fields.value.delete(fieldKey)
    delete values.value[fieldKey]
    delete previousValues.value[fieldKey]
    delete validationStates.value[fieldKey]
    
    // 清理监听器
    const listener = listeners.get(fieldKey)
    if (listener && fields.value.get(fieldKey)?.element) {
      removeEventListeners(fields.value.get(fieldKey)!.element!, listener)
    }
    
    listeners.delete(fieldKey)
    debouncedListeners.delete(fieldKey)
    throttledListeners.delete(fieldKey)
  }

  // 创建字段监听器
  const createFieldListener = (field: InputField) => {
    const baseListener = (event: Event) => {
      handleInputChange(field.key, event, 'user')
    }

    // 创建防抖和节流版本
    const fieldDebounceMs = field.debounceMs ?? debounceMs
    const fieldThrottleMs = field.throttleMs ?? throttleMs

    const debouncedListener = debounce(baseListener, fieldDebounceMs)
    const throttledListener = throttle(baseListener, fieldThrottleMs)

    listeners.set(field.key, baseListener)
    debouncedListeners.set(field.key, debouncedListener)
    throttledListeners.set(field.key, throttledListener)

    // 如果元素已存在，立即绑定事件
    if (field.element) {
      bindEventListeners(field.element, field, baseListener, debouncedListener, throttledListener)
    }
  }

  // 绑定事件监听器
  const bindEventListeners = (
    element: HTMLElement,
    field: InputField,
    baseListener: Function,
    debouncedListener: Function,
    throttledListener: Function
  ) => {
    const eventType = getEventType(field.type)
    
    // 立即响应事件（用于UI反馈）
    if (field.immediate) {
      element.addEventListener(eventType, baseListener as EventListener)
    }
    
    // 防抖事件（用于计算触发）
    element.addEventListener(eventType, debouncedListener as EventListener)
    
    // 节流事件（用于实时预览）
    if (enableSmartDetection) {
      element.addEventListener('input', throttledListener as EventListener)
    }

    // 特殊事件处理
    if (field.type === 'number' || field.type === 'range') {
      element.addEventListener('wheel', (e) => {
        if (document.activeElement === element) {
          e.preventDefault()
        }
      })
    }
  }

  // 移除事件监听器
  const removeEventListeners = (element: HTMLElement, listener: Function) => {
    const eventTypes = ['input', 'change', 'blur', 'wheel']
    eventTypes.forEach(eventType => {
      element.removeEventListener(eventType, listener as EventListener)
    })
  }

  // 处理输入变化
  const handleInputChange = (fieldKey: string, event: Event, source: 'user' | 'programmatic') => {
    const field = fields.value.get(fieldKey)
    if (!field) return

    const target = event.target as HTMLInputElement
    let newValue = extractValue(target, field.type)

    // 格式化值
    if (formatOnChange && field.formatter) {
      newValue = field.formatter(newValue)
    }

    // 验证值
    let isValid = true
    if (validateOnChange && field.validator) {
      isValid = field.validator(newValue)
    }

    // 更新状态
    const previousValue = values.value[fieldKey]
    previousValues.value[fieldKey] = previousValue
    values.value[fieldKey] = newValue
    validationStates.value[fieldKey] = isValid

    // 记录历史
    if (trackHistory && newValue !== previousValue) {
      addToHistory(fieldKey, newValue, source)
    }

    // 触发变化事件
    const changeEvent: InputChangeEvent = {
      field: fieldKey,
      value: newValue,
      previousValue,
      timestamp: Date.now(),
      source,
      isValid
    }

    emitChange(changeEvent)
  }

  // 添加到历史记录
  const addToHistory = (field: string, value: any, source: 'user' | 'programmatic') => {
    changeHistory.value.push({
      field,
      value,
      timestamp: Date.now(),
      source
    })

    // 限制历史记录大小
    if (changeHistory.value.length > maxHistorySize) {
      changeHistory.value.shift()
    }
  }

  // 获取事件类型
  const getEventType = (fieldType: string): string => {
    switch (fieldType) {
      case 'checkbox':
      case 'radio':
      case 'select':
        return 'change'
      case 'range':
        return 'input'
      default:
        return 'input'
    }
  }

  // 提取值
  const extractValue = (element: HTMLInputElement, fieldType: string): any => {
    switch (fieldType) {
      case 'checkbox':
        return element.checked
      case 'number':
      case 'range':
        return parseFloat(element.value) || 0
      case 'date':
        return element.value ? new Date(element.value) : null
      default:
        return element.value
    }
  }

  // 获取默认值
  const getDefaultValue = (fieldType: string): any => {
    switch (fieldType) {
      case 'checkbox':
        return false
      case 'number':
      case 'range':
        return 0
      case 'date':
        return null
      default:
        return ''
    }
  }

  // 事件发射器
  const changeCallbacks = new Set<(event: InputChangeEvent) => void>()

  const emitChange = (event: InputChangeEvent) => {
    changeCallbacks.forEach(callback => callback(event))
  }

  const onInputChange = (callback: (event: InputChangeEvent) => void) => {
    changeCallbacks.add(callback)
    return () => changeCallbacks.delete(callback)
  }

  // 程序化更新值
  const updateValue = (fieldKey: string, value: any, triggerChange = true) => {
    const field = fields.value.get(fieldKey)
    if (!field) return

    const previousValue = values.value[fieldKey]
    previousValues.value[fieldKey] = previousValue
    values.value[fieldKey] = value

    // 验证
    if (validateOnChange && field.validator) {
      validationStates.value[fieldKey] = field.validator(value)
    }

    // 记录历史
    if (trackHistory && value !== previousValue) {
      addToHistory(fieldKey, value, 'programmatic')
    }

    // 触发变化事件
    if (triggerChange) {
      const changeEvent: InputChangeEvent = {
        field: fieldKey,
        value,
        previousValue,
        timestamp: Date.now(),
        source: 'programmatic',
        isValid: validationStates.value[fieldKey]
      }
      emitChange(changeEvent)
    }
  }

  // 批量更新值
  const updateValues = (newValues: Record<string, any>, triggerChange = true) => {
    Object.entries(newValues).forEach(([key, value]) => {
      updateValue(key, value, false)
    })

    if (triggerChange) {
      // 触发批量变化事件
      Object.entries(newValues).forEach(([key, value]) => {
        const changeEvent: InputChangeEvent = {
          field: key,
          value,
          previousValue: previousValues.value[key],
          timestamp: Date.now(),
          source: 'programmatic',
          isValid: validationStates.value[key]
        }
        emitChange(changeEvent)
      })
    }
  }

  // 重置所有值
  const resetValues = () => {
    fields.value.forEach((field, key) => {
      const defaultValue = getDefaultValue(field.type)
      updateValue(key, defaultValue, false)
    })
    changeHistory.value = []
  }

  // 开始监听
  const startListening = () => {
    isListening.value = true
  }

  // 停止监听
  const stopListening = () => {
    isListening.value = false
  }

  // 获取字段统计
  const getFieldStats = () => {
    return {
      totalFields: fields.value.size,
      validFields: Object.values(validationStates.value).filter(Boolean).length,
      changedFields: changedFields.value.length,
      historySize: changeHistory.value.length
    }
  }

  // 清理
  const cleanup = () => {
    fields.value.forEach((field, key) => {
      unregisterField(key)
    })
    changeCallbacks.clear()
    changeHistory.value = []
  }

  // 生命周期
  onMounted(() => {
    startListening()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    fields: readonly(fields),
    values,
    previousValues: readonly(previousValues),
    validationStates: readonly(validationStates),
    changeHistory: readonly(changeHistory),
    isListening: readonly(isListening),

    // 计算属性
    hasChanges,
    changedFields,
    isAllValid,

    // 方法
    registerField,
    unregisterField,
    updateValue,
    updateValues,
    resetValues,
    startListening,
    stopListening,
    onInputChange,
    getFieldStats,
    cleanup
  }
}
