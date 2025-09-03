<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app" class="min-h-screen">
    <nav class="bg-blue-600 text-white p-4">
      <div class="container mx-auto">
        <h1 class="text-2xl font-bold">Zinses Rechner</h1>
      </div>
    </nav>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="bg-gray-800 text-white p-4 text-center">
      <p>&copy; 2024 Zinses Rechner. Alle Rechte vorbehalten.</p>
    </footer>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
