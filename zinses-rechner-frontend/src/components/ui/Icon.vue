<!--
  Icon组件 - 基于BaseIcon的简化版本
  为了兼容TaxSettings组件的导入
-->
<template>
  <BaseIcon :name="name" :size="size" :color="color" />
</template>

<script setup lang="ts">
import BaseIcon from './BaseIcon.vue'

interface Props {
  name: string
  size?: string | number
  color?: string
}

defineProps<Props>()
</script>
