<template>
  <div class="calculator-view">
    <CalculatorPage :calculator-id="calculatorId" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

// 懒加载CalculatorPage以避免循环依赖
const CalculatorPage = defineAsyncComponent(() => import('@/components/core/CalculatorPage.vue'))

interface Props {
  calculatorId?: string
}

const props = defineProps<Props>()
const route = useRoute()

// 计算属性
const calculatorId = computed(() => {
  return props.calculatorId || route.params.calculatorId as string
})
</script>

<style scoped>
.calculator-view {
  @apply min-h-screen bg-gray-50;
}
</style>
