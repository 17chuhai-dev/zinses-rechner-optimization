<template>
  <div class="mobile-expandable-card bg-white rounded-lg border border-gray-200 overflow-hidden">
    <!-- 卡片头部（可点击展开/收起） -->
    <div
      class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      @click="toggleExpanded"
    >
      <div class="flex items-center space-x-3">
        <BaseIcon :name="icon" class="text-blue-600" size="sm" />
        <h3 class="text-md font-semibold text-gray-900">{{ title }}</h3>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- 状态指示器 -->
        <div v-if="badge" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          {{ badge }}
        </div>
        
        <!-- 展开/收起图标 -->
        <BaseIcon
          :name="isExpanded ? 'chevron-up' : 'chevron-down'"
          size="sm"
          class="text-gray-400 transition-transform duration-200"
          :class="{ 'transform rotate-180': isExpanded }"
        />
      </div>
    </div>

    <!-- 卡片内容（可展开） -->
    <div
      v-if="isExpanded"
      class="border-t border-gray-200 p-4 bg-gray-50"
      :class="{ 'animate-expand': isExpanded }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseIcon from '../ui/BaseIcon.vue'

interface Props {
  title: string
  icon: string
  badge?: string
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false
})

// 状态管理
const isExpanded = ref(props.defaultExpanded)

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// 生命周期
onMounted(() => {
  isExpanded.value = props.defaultExpanded
})
</script>

<style scoped>
.mobile-expandable-card {
  @apply transition-all duration-200;
}

/* 展开动画 */
@keyframes expand {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 500px;
    transform: translateY(0);
  }
}

.animate-expand {
  animation: expand 0.3s ease-out;
}

/* 触摸反馈 */
@media (hover: none) and (pointer: coarse) {
  .mobile-expandable-card .cursor-pointer:active {
    @apply bg-gray-100;
  }
}

/* 无障碍支持 */
.mobile-expandable-card .cursor-pointer {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset;
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .animate-expand {
    animation: none;
  }
  
  .mobile-expandable-card .transition-transform {
    transition: none;
  }
}
</style>
