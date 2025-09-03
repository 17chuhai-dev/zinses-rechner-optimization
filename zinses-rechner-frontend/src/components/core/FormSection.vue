<template>
  <div class="form-section">
    <!-- 可折叠的部分标题 -->
    <div 
      v-if="collapsible"
      class="flex items-center justify-between cursor-pointer py-3 border-b border-gray-200"
      @click="toggleExpanded"
    >
      <div>
        <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
        <p v-if="description" class="text-sm text-gray-600 mt-1">{{ description }}</p>
      </div>
      <BaseIcon 
        :name="isExpanded ? 'chevron-up' : 'chevron-down'" 
        class="text-gray-400 transition-transform duration-200"
      />
    </div>

    <!-- 固定的部分标题 -->
    <div v-else-if="title" class="mb-4">
      <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
      <p v-if="description" class="text-sm text-gray-600 mt-1">{{ description }}</p>
    </div>

    <!-- 部分内容 -->
    <div 
      v-show="!collapsible || isExpanded"
      class="transition-all duration-300 ease-in-out"
      :class="{ 'mt-4': title }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseIcon from '../ui/BaseIcon.vue'

interface Props {
  title?: string
  description?: string
  collapsible?: boolean
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: false,
  defaultExpanded: true
})

const isExpanded = ref(props.defaultExpanded)

const toggleExpanded = () => {
  if (props.collapsible) {
    isExpanded.value = !isExpanded.value
  }
}

onMounted(() => {
  isExpanded.value = props.defaultExpanded
})
</script>

<style scoped>
.form-section {
  @apply w-full;
}
</style>
