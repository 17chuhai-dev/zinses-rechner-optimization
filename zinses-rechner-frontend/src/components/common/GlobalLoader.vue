<!--
  全局加载指示器组件
  显示应用级别的加载状态
-->

<template>
  <div class="global-loader" :class="{ 'visible': visible }">
    <div class="loader-backdrop" @click="handleBackdropClick"></div>
    
    <div class="loader-content">
      <div class="loader-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      
      <div v-if="message" class="loader-message">
        {{ message }}
      </div>
      
      <div v-if="progress !== undefined" class="loader-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>
      
      <button 
        v-if="cancellable && onCancel" 
        @click="handleCancel"
        class="loader-cancel"
      >
        {{ t('loader.cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/services/I18nService'

// Props
interface Props {
  visible?: boolean
  message?: string
  progress?: number
  cancellable?: boolean
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  cancellable: false
})

// Emits
interface Emits {
  'backdrop-click': []
  'cancel': []
}

const emit = defineEmits<Emits>()

// 使用服务
const { t } = useI18n()

// 响应式状态
const isVisible = ref(props.visible)

// 方法
const handleBackdropClick = (): void => {
  if (props.cancellable) {
    emit('backdrop-click')
  }
}

const handleCancel = (): void => {
  if (props.onCancel) {
    props.onCancel()
  }
  emit('cancel')
}

// 监听器
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && props.cancellable && isVisible.value) {
    handleCancel()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.global-loader.visible {
  opacity: 1;
  visibility: visible;
}

.loader-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.loader-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 20rem;
  text-align: center;
}

.dark .loader-content {
  background: #1f2937;
  color: #f9fafb;
}

.loader-spinner {
  position: relative;
  width: 4rem;
  height: 4rem;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
  border-top-color: #10b981;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.6s;
  border-top-color: #f59e0b;
}

.spinner-ring:nth-child(4) {
  animation-delay: -0.9s;
  border-top-color: #ef4444;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loader-message {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  max-width: 16rem;
}

.dark .loader-message {
  color: #d1d5db;
}

.loader-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.dark .progress-bar {
  background: #374151;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 0.25rem;
  transition: width 0.3s ease;
  animation: progress-shimmer 2s infinite;
}

@keyframes progress-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
}

.dark .progress-text {
  color: #9ca3af;
}

.loader-cancel {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.loader-cancel:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.dark .loader-cancel {
  background: #374151;
  color: #d1d5db;
  border-color: #4b5563;
}

.dark .loader-cancel:hover {
  background: #4b5563;
  border-color: #6b7280;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .loader-content {
    margin: 1rem;
    padding: 1.5rem;
    max-width: calc(100vw - 2rem);
  }
  
  .loader-spinner {
    width: 3rem;
    height: 3rem;
  }
  
  .loader-message {
    font-size: 0.875rem;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .loader-backdrop {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .loader-content {
    border: 2px solid #000;
  }
  
  .dark .loader-content {
    border-color: #fff;
  }
  
  .spinner-ring {
    border-width: 4px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .global-loader {
    transition: none;
  }
  
  .spinner-ring {
    animation: none;
    border-top-color: #3b82f6;
  }
  
  .progress-fill {
    animation: none;
  }
}

/* 无障碍支持 */
.global-loader[aria-hidden="true"] {
  display: none;
}

/* 打印时隐藏 */
@media print {
  .global-loader {
    display: none !important;
  }
}
</style>
