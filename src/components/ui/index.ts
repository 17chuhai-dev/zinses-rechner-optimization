// UI组件统一导出
export { default as BaseButton } from './BaseButton.vue'
export { default as BaseInput } from './BaseInput.vue'
export { default as BaseCard } from './BaseCard.vue'
export { default as BaseIcon } from './BaseIcon.vue'

// 类型导出
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'currency' | 'percentage'
export type CardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
