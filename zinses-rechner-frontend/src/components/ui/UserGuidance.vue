<template>
  <div class="user-guidance">
    <!-- 交互式引导覆盖层 -->
    <div
      v-if="guidanceState.isActive && guidanceState.overlay"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity"
      @click="handleOverlayClick"
    >
      <!-- 引导步骤弹窗 -->
      <div
        v-if="currentStep"
        :class="[
          'absolute bg-white rounded-lg shadow-xl p-6 max-w-md',
          getStepPositionClass()
        ]"
        :style="getStepPositionStyle()"
      >
        <!-- 步骤头部 -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
              {{ guidanceState.currentStep + 1 }}
            </div>
            <span class="text-sm text-gray-500">
              Schritt {{ guidanceState.currentStep + 1 }} von {{ guidanceState.totalSteps }}
            </span>
          </div>
          <button
            @click="skipTour"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            title="Überspringen"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- 步骤内容 -->
        <div class="mb-6">
          <h3 v-if="currentStep.title" class="text-lg font-semibold text-gray-900 mb-2">
            {{ currentStep.title }}
          </h3>
          <p class="text-gray-700 leading-relaxed">
            {{ currentStep.content }}
          </p>
        </div>

        <!-- 进度条 -->
        <div class="mb-6">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${((guidanceState.currentStep + 1) / guidanceState.totalSteps) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-between items-center">
          <button
            v-if="guidanceState.currentStep > 0"
            @click="prevStep"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Zurück
          </button>
          <div v-else></div>

          <div class="flex gap-2">
            <button
              v-if="currentStep.skipable"
              @click="skipStep"
              class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Überspringen
            </button>
            <button
              @click="nextStep"
              class="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ isLastStep ? 'Fertig' : 'Weiter' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具提示 -->
    <Tooltip
      v-if="type === 'tooltip'"
      :content="content"
      :position="position"
      :trigger="trigger"
      :delay="delay"
      :disabled="disabled"
    >
      <slot />
    </Tooltip>

    <!-- 帮助气泡 -->
    <HelpBubble
      v-else-if="type === 'help'"
      :title="title"
      :content="content"
      :icon="icon"
      :color="color"
      :size="size"
    />

    <!-- 引导步骤 -->
    <GuidanceStep
      v-else-if="type === 'step'"
      :step="step"
      :total="total"
      :title="title"
      :content="content"
      :position="position"
      :highlight="highlight"
      @next="$emit('next')"
      @prev="$emit('prev')"
      @skip="$emit('skip')"
      @complete="$emit('complete')"
    />

    <!-- 内联帮助 -->
    <InlineHelp
      v-else-if="type === 'inline'"
      :content="content"
      :expandable="expandable"
      :icon="icon"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, ref, h, onMounted, onUnmounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useUserGuidance } from '@/services/UserGuidanceService'

interface Props {
  type: 'tooltip' | 'help' | 'step' | 'inline'
  content: string
  title?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'hover' | 'click' | 'focus'
  delay?: number
  disabled?: boolean
  icon?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  size?: 'sm' | 'md' | 'lg'
  step?: number
  total?: number
  highlight?: boolean
  expandable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  trigger: 'hover',
  delay: 200,
  disabled: false,
  color: 'blue',
  size: 'md',
  highlight: false,
  expandable: false
})

const emit = defineEmits<{
  'next': []
  'prev': []
  'skip': []
  'complete': []
}>()

// 使用用户引导服务
const {
  state: guidanceState,
  nextStep,
  prevStep,
  skipStep,
  skipTour,
  endTour,
  getCurrentStep
} = useUserGuidance()

// 计算属性
const currentStep = computed(() => getCurrentStep())
const isLastStep = computed(() =>
  guidanceState.currentStep === guidanceState.totalSteps - 1
)

// 方法
const handleOverlayClick = (event: MouseEvent) => {
  // 只有点击遮罩层本身才关闭，不包括弹窗内容
  if (event.target === event.currentTarget) {
    skipTour()
  }
}

const getStepPositionClass = () => {
  if (!currentStep.value?.target) {
    return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }

  const position = currentStep.value.position || 'center'
  const classes = {
    top: 'bottom-full mb-4',
    bottom: 'top-full mt-4',
    left: 'right-full mr-4',
    right: 'left-full ml-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }

  return classes[position] || classes.center
}

const getStepPositionStyle = () => {
  if (!currentStep.value?.target) {
    return {}
  }

  const targetElement = document.querySelector(currentStep.value.target)
  if (!targetElement) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const rect = targetElement.getBoundingClientRect()
  const position = currentStep.value.position || 'center'

  switch (position) {
    case 'top':
      return {
        top: `${rect.top - 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translate(-50%, -100%)'
      }
    case 'bottom':
      return {
        top: `${rect.bottom + 20}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)'
      }
    case 'left':
      return {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.left - 20}px`,
        transform: 'translate(-100%, -50%)'
      }
    case 'right':
      return {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + 20}px`,
        transform: 'translateY(-50%)'
      }
    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
  }
}

// 简化的组件实现 - 使用基础HTML而不是复杂的子组件
const Tooltip = defineComponent({
  props: {
    content: String,
    position: String,
    trigger: String,
    delay: Number,
    disabled: Boolean
  },
  setup(props, { slots }) {
    const showTooltip = ref(false)

    return () => h('div', {
      class: 'relative inline-block',
      onMouseenter: () => !props.disabled && (showTooltip.value = true),
      onMouseleave: () => showTooltip.value = false
    }, [
      slots.default?.(),
      showTooltip.value && h('div', {
        class: 'absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-sm tooltip'
      }, props.content)
    ])
  }
})

const HelpBubble = defineComponent({
  props: {
    title: String,
    content: String,
    icon: String,
    color: String,
    size: String
  },
  setup(props) {
    return () => h('div', { class: 'help-bubble p-4 bg-blue-50 rounded-lg' }, [
      props.title && h('h4', { class: 'font-medium text-blue-900 mb-2' }, props.title),
      h('p', { class: 'text-blue-800 text-sm' }, props.content)
    ])
  }
})

const GuidanceStep = defineComponent({
  props: {
    step: Number,
    total: Number,
    title: String,
    content: String,
    position: String,
    highlight: Boolean
  },
  emits: ['next', 'prev', 'skip', 'complete'],
  setup(props, { emit }) {
    return () => h('div', { class: 'guidance-step p-4 bg-white border rounded-lg shadow-lg' }, [
      h('div', { class: 'flex justify-between items-center mb-3' }, [
        h('span', { class: 'text-sm text-gray-500' }, `Schritt ${props.step} von ${props.total}`),
        h('button', {
          class: 'text-gray-400 hover:text-gray-600',
          onClick: () => emit('skip')
        }, '×')
      ]),
      props.title && h('h3', { class: 'font-medium text-gray-900 mb-2' }, props.title),
      h('p', { class: 'text-gray-700 text-sm mb-4' }, props.content),
      h('div', { class: 'flex justify-between' }, [
        h('button', {
          class: 'px-3 py-1 text-sm text-gray-600 hover:text-gray-800',
          onClick: () => emit('prev'),
          disabled: props.step === 1
        }, 'Zurück'),
        h('button', {
          class: 'px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700',
          onClick: () => props.step === props.total ? emit('complete') : emit('next')
        }, props.step === props.total ? 'Fertig' : 'Weiter')
      ])
    ])
  }
})

const InlineHelp = defineComponent({
  props: {
    content: String,
    expandable: Boolean,
    icon: String
  },
  setup(props) {
    const expanded = ref(false)

    return () => h('div', { class: 'inline-help' }, [
      h('button', {
        class: 'text-blue-600 hover:text-blue-800 text-sm',
        onClick: () => expanded.value = !expanded.value
      }, '?'),
      expanded.value && h('div', {
        class: 'mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700'
      }, props.content)
    ])
  }
})
</script>

<style scoped>
/* 工具提示样式 */
.tooltip-top {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
}

.tooltip-bottom {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
}

.tooltip-left {
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: 8px;
}

.tooltip-right {
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

.tooltip-top .tooltip-arrow {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1f2937;
}

.tooltip-bottom .tooltip-arrow {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #1f2937;
}

/* 动画 */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) scale(0.95);
}

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 引导高亮样式 */
:deep(.guidance-highlight) {
  position: relative;
  z-index: 1001;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  animation: guidance-pulse 2s infinite;
}

@keyframes guidance-pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.7), 0 0 0 12px rgba(59, 130, 246, 0.3);
  }
}

/* 引导弹窗动画 */
.guidance-popup-enter-active,
.guidance-popup-leave-active {
  transition: all 0.3s ease;
}

.guidance-popup-enter-from,
.guidance-popup-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .guidance-step {
    min-width: 280px;
    max-width: calc(100vw - 32px);
    margin: 16px;
  }
}
</style>
