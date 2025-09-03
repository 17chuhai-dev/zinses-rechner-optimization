<template>
  <div class="not-found-view">
    <div class="max-w-md mx-auto text-center">
      <div class="mb-8">
        <BaseIcon name="exclamation-triangle" size="3xl" class="mx-auto text-gray-400 mb-4" />
        <h1 class="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 class="text-xl font-semibold text-gray-700 mb-4">
          Seite nicht gefunden
        </h2>
        <p class="text-gray-600 mb-8">
          Die angeforderte Seite konnte nicht gefunden werden.
        </p>
      </div>
      
      <div class="space-y-4">
        <BaseButton
          variant="primary"
          size="lg"
          @click="$router.push('/')"
        >
          Zur Startseite
        </BaseButton>
        
        <BaseButton
          variant="secondary"
          @click="$router.back()"
        >
          Zurück
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '@/components/ui/BaseIcon.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<style scoped>
.not-found-view {
  @apply min-h-screen bg-gray-50 flex items-center justify-center px-4;
}
</style>
