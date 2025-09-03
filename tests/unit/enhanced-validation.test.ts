/**
 * 增强表单验证功能测试
 * 测试实时验证、错误提示、警告和建议功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useEnhancedValidation, businessRules } from '@/composables/useValidation'
import EnhancedFormField from '@/components/ui/EnhancedFormField.vue'

describe('增强表单验证', () => {
  let validation: ReturnType<typeof useEnhancedValidation>

  beforeEach(() => {
    validation = useEnhancedValidation()
  })

  describe('useEnhancedValidation', () => {
    it('应该正确初始化验证状态', () => {
      expect(validation.validationState.value).toEqual({})
    })

    it('应该为起始资本生成正确的警告', () => {
      const warnings = validation.generateWarnings('principal', 500)
      expect(warnings).toContain('Ein höheres Startkapital führt zu besseren Ergebnissen')

      const highAmountWarnings = validation.generateWarnings('principal', 600000)
      expect(highAmountWarnings).toContain('Bei hohen Beträgen sollten Sie eine professionelle Beratung in Anspruch nehmen')
    })

    it('应该为年利率生成正确的警告', () => {
      const highRateWarnings = validation.generateWarnings('annualRate', 15)
      expect(highRateWarnings).toContain('Sehr hohe Renditen sind oft mit höheren Risiken verbunden')

      const lowRateWarnings = validation.generateWarnings('annualRate', 1)
      expect(lowRateWarnings).toContain('Niedrige Zinssätze können die Inflation nicht ausgleichen')
    })

    it('应该为投资年限生成正确的警告', () => {
      const shortTermWarnings = validation.generateWarnings('years', 3)
      expect(shortTermWarnings).toContain('Langfristige Anlagen haben oft bessere Renditen')

      const longTermWarnings = validation.generateWarnings('years', 35)
      expect(longTermWarnings).toContain('Sehr lange Anlagezeiträume erhöhen das Unsicherheitsrisiko')
    })

    it('应该为月度储蓄生成正确的建议', () => {
      const zeroSuggestions = validation.generateSuggestions('monthlyPayment', 0)
      expect(zeroSuggestions).toContain('Regelmäßige Sparbeiträge verstärken den Zinseszinseffekt erheblich')

      const lowAmountSuggestions = validation.generateSuggestions('monthlyPayment', 50)
      expect(lowAmountSuggestions).toContain('Bereits kleine Erhöhungen der Sparrate haben große Auswirkungen')
    })

    it('应该为起始资本生成正确的建议', () => {
      const suggestions = validation.generateSuggestions('principal', 0)
      expect(suggestions).toContain('Ein Startkapital beschleunigt den Vermögensaufbau')
    })

    it('应该正确获取字段状态', () => {
      const fieldName = 'testField'
      const defaultState = validation.getFieldState(fieldName)
      
      expect(defaultState).toEqual({
        isValid: false,
        errors: [],
        warnings: [],
        suggestions: [],
        lastValidated: null
      })
    })

    it('应该正确清除字段状态', () => {
      const fieldName = 'testField'
      validation.validationState.value[fieldName] = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [],
        lastValidated: new Date()
      }

      validation.clearFieldState(fieldName)
      expect(validation.validationState.value[fieldName]).toBeUndefined()
    })
  })

  describe('EnhancedFormField 组件', () => {
    it('应该正确渲染货币输入字段', () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: 1000,
          type: 'currency',
          label: 'Startkapital',
          placeholder: '0,00'
        }
      })

      expect(wrapper.find('label').text()).toContain('Startkapital')
      expect(wrapper.find('input').attributes('inputmode')).toBe('decimal')
      expect(wrapper.find('.absolute span').text()).toBe('€')
    })

    it('应该正确渲染百分比输入字段', () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: 5,
          type: 'percentage',
          label: 'Zinssatz',
          placeholder: '0,00'
        }
      })

      expect(wrapper.find('label').text()).toContain('Zinssatz')
      expect(wrapper.find('input').attributes('inputmode')).toBe('decimal')
      expect(wrapper.find('.absolute span').text()).toBe('%')
    })

    it('应该正确渲染选择框', () => {
      const options = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' }
      ]

      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '1',
          type: 'select',
          label: 'Auswahl',
          options
        }
      })

      expect(wrapper.find('select').exists()).toBe(true)
      expect(wrapper.findAll('option')).toHaveLength(2)
    })

    it('应该显示必填标记', () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          label: 'Pflichtfeld',
          required: true
        }
      })

      expect(wrapper.find('label .text-red-500').text()).toBe('*')
    })

    it('应该显示可选标记', () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          label: 'Optionales Feld',
          optional: true
        }
      })

      expect(wrapper.find('label .text-gray-500').text()).toBe('(optional)')
    })

    it('应该显示帮助文本', () => {
      const helpText = 'Dies ist ein Hilfetext'
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          helpText
        }
      })

      expect(wrapper.find('.text-gray-600').text()).toBe(helpText)
    })

    it('应该在有错误时显示错误消息', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          validationRules: businessRules.principal
        }
      })

      // 模拟输入无效值
      await wrapper.find('input').setValue('')
      await wrapper.find('input').trigger('blur')
      await nextTick()

      // 检查是否显示错误消息
      expect(wrapper.find('.text-red-600').exists()).toBe(true)
    })

    it('应该显示快捷输入按钮', async () => {
      const quickValues = [
        { value: 1000, label: '1.000€' },
        { value: 5000, label: '5.000€' }
      ]

      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: 0,
          type: 'currency',
          quickValues
        }
      })

      // 聚焦输入字段以显示快捷按钮
      await wrapper.find('input').trigger('focus')
      await nextTick()

      const quickButtons = wrapper.findAll('button')
      expect(quickButtons).toHaveLength(2)
      expect(quickButtons[0].text()).toBe('1.000€')
      expect(quickButtons[1].text()).toBe('5.000€')
    })

    it('应该在点击快捷按钮时设置值', async () => {
      const quickValues = [
        { value: 1000, label: '1.000€' }
      ]

      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: 0,
          type: 'currency',
          quickValues
        }
      })

      await wrapper.find('input').trigger('focus')
      await nextTick()

      const quickButton = wrapper.find('button')
      await quickButton.trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1000])
    })

    it('应该在禁用时正确显示', () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          disabled: true
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeDefined()
      expect(input.classes()).toContain('bg-gray-50')
      expect(input.classes()).toContain('cursor-not-allowed')
    })

    it('应该正确处理输入事件', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          type: 'currency'
        }
      })

      const input = wrapper.find('input')
      await input.setValue('1000')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('应该正确处理焦点事件', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: ''
        }
      })

      const input = wrapper.find('input')
      await input.trigger('focus')

      expect(wrapper.emitted('focus')).toBeTruthy()
    })

    it('应该正确处理失焦事件', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: ''
        }
      })

      const input = wrapper.find('input')
      await input.trigger('blur')

      expect(wrapper.emitted('blur')).toBeTruthy()
    })
  })

  describe('实时验证功能', () => {
    it('应该在输入时触发实时验证', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          validationRules: businessRules.principal,
          realtimeValidation: true,
          debounceMs: 100
        }
      })

      const input = wrapper.find('input')
      await input.setValue('500')

      // 等待防抖延迟
      await new Promise(resolve => setTimeout(resolve, 150))
      await nextTick()

      expect(wrapper.emitted('validate')).toBeTruthy()
    })

    it('应该显示验证状态图标', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: 1000,
          validationRules: businessRules.principal,
          showValidationIcon: true
        }
      })

      // 触发验证
      await wrapper.find('input').trigger('blur')
      await nextTick()

      // 应该显示验证图标
      const icon = wrapper.find('.absolute svg')
      expect(icon.exists()).toBe(true)
    })
  })

  describe('德语格式化', () => {
    it('应该正确格式化货币输入', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: 0,
          type: 'currency'
        }
      })

      const input = wrapper.find('input')
      await input.setValue('1234.56')
      await input.trigger('blur')
      await nextTick()

      // 应该格式化为德语货币格式
      expect(input.element.value).toMatch(/1\.234,56/)
    })

    it('应该正确处理百分比输入', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: 0,
          type: 'percentage'
        }
      })

      const input = wrapper.find('input')
      await input.setValue('5.5')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([5.5])
    })
  })

  describe('可访问性', () => {
    it('应该正确关联标签和输入字段', () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          label: 'Test Label'
        }
      })

      const label = wrapper.find('label')
      const input = wrapper.find('input')
      
      expect(label.attributes('for')).toBe(input.attributes('id'))
    })

    it('应该在错误时设置正确的ARIA属性', async () => {
      const wrapper = mount(EnhancedFormField, {
        props: {
          modelValue: '',
          validationRules: businessRules.principal
        }
      })

      await wrapper.find('input').trigger('blur')
      await nextTick()

      const input = wrapper.find('input')
      expect(input.attributes('aria-invalid')).toBe('true')
    })
  })
})
