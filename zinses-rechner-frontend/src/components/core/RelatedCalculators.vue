<template>
  <BaseCard title="Ähnliche Rechner" padding="lg">
    <div class="space-y-4">
      <p class="text-sm text-gray-600 mb-4">
        Entdecken Sie weitere nützliche Finanzrechner:
      </p>
      
      <div class="grid grid-cols-1 gap-3">
        <router-link
          v-for="calculator in calculators"
          :key="calculator.id"
          :to="`/rechner/${calculator.id}`"
          class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
          :class="{ 'pointer-events-none opacity-50': calculator.id === currentCalculatorId }"
        >
          <div class="flex items-center space-x-3">
            <BaseIcon 
              v-if="calculator.icon"
              :name="calculator.icon" 
              size="lg"
              class="text-blue-600 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900 truncate">
                {{ calculator.name }}
              </h3>
              <p class="text-sm text-gray-600 truncate">
                {{ calculator.description }}
              </p>
            </div>
            <BaseIcon 
              name="arrow-right" 
              size="sm"
              class="text-gray-400 flex-shrink-0"
            />
          </div>
        </router-link>
      </div>

      <!-- 查看所有计算器链接 -->
      <div class="pt-4 border-t border-gray-200">
        <router-link
          to="/"
          class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Alle Rechner anzeigen
          <BaseIcon name="arrow-right" size="sm" class="ml-1" />
        </router-link>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import type { BaseCalculator } from '@/types/calculator'
import BaseCard from '../ui/BaseCard.vue'
import BaseIcon from '../ui/BaseIcon.vue'

interface Props {
  calculators: BaseCalculator[]
  currentCalculatorId?: string
}

const props = defineProps<Props>()
</script>

<style scoped>
/* 组件样式 */
</style>
