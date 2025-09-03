<template>
  <div class="yearly-breakdown-table">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-800 mb-2">
        Jährliche Aufschlüsselung
      </h3>
      <p class="text-sm text-gray-600">
        Detaillierte Übersicht der Kapitalentwicklung pro Jahr
      </p>
    </div>

    <!-- 移动端卡片视图 -->
    <div class="md:hidden space-y-4">
      <div
        v-for="(year, index) in yearlyData"
        :key="year.year"
        class="bg-white border border-gray-200 rounded-lg p-4"
      >
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-semibold text-gray-800">Jahr {{ year.year }}</h4>
          <span class="text-sm text-gray-500">
            {{ formatPercentage(year.growth_rate) }} Rendite
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-600">Startkapital:</span>
            <p class="font-medium">{{ formatCurrency(year.start_amount) }}</p>
          </div>
          <div>
            <span class="text-gray-600">Einzahlungen:</span>
            <p class="font-medium">{{ formatCurrency(year.contributions) }}</p>
          </div>
          <div>
            <span class="text-gray-600">Zinserträge:</span>
            <p class="font-medium text-green-600">{{ formatCurrency(year.interest) }}</p>
          </div>
          <div>
            <span class="text-gray-600">Endkapital:</span>
            <p class="font-bold text-blue-600">{{ formatCurrency(year.end_amount) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 桌面端表格视图 -->
    <div class="hidden md:block overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jahr
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Startkapital
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Einzahlungen
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Zinserträge
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Endkapital
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rendite
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="(year, index) in yearlyData"
            :key="year.year"
            :class="[
              'hover:bg-gray-50 transition-colors',
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            ]"
          >
            <td class="px-4 py-3 text-sm font-medium text-gray-900">
              {{ year.year }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-right font-mono">
              {{ formatCurrency(year.start_amount) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-right font-mono">
              {{ formatCurrency(year.contributions) }}
            </td>
            <td class="px-4 py-3 text-sm text-green-600 text-right font-mono font-medium">
              {{ formatCurrency(year.interest) }}
            </td>
            <td class="px-4 py-3 text-sm text-blue-600 text-right font-mono font-bold">
              {{ formatCurrency(year.end_amount) }}
            </td>
            <td class="px-4 py-3 text-sm text-purple-600 text-right font-medium">
              {{ formatPercentage(year.growth_rate) }}
            </td>
          </tr>
        </tbody>

        <!-- 总计行 -->
        <tfoot class="bg-gray-100 border-t-2 border-gray-300">
          <tr class="font-bold">
            <td class="px-4 py-3 text-sm text-gray-900">
              Gesamt
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-right">
              {{ formatCurrency(principal) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 text-right">
              {{ formatCurrency(totalContributions - principal) }}
            </td>
            <td class="px-4 py-3 text-sm text-green-600 text-right">
              {{ formatCurrency(finalAmount - totalContributions) }}
            </td>
            <td class="px-4 py-3 text-sm text-blue-600 text-right">
              {{ formatCurrency(finalAmount) }}
            </td>
            <td class="px-4 py-3 text-sm text-purple-600 text-right">
              {{ formatPercentage(calculateTotalReturn()) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- 表格操作 -->
    <div class="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="text-sm text-gray-600">
        <span class="font-medium">{{ yearlyData.length }}</span> Jahre angezeigt
      </div>

      <div class="flex space-x-2">
        <button
          @click="exportTableData"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV Export
        </button>

        <button
          @click="printTable"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Drucken
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

interface YearlyData {
  year: number
  start_amount: number
  contributions: number
  interest: number
  end_amount: number
  growth_rate: number
}

interface Props {
  yearlyData: YearlyData[]
  principal: number
  totalContributions: number
  finalAmount: number
}

const props = defineProps<Props>()

// 计算总收益率
const calculateTotalReturn = () => {
  if (props.totalContributions <= 0 || props.yearlyData.length === 0) return 0

  const totalGain = props.finalAmount - props.totalContributions
  return (totalGain / props.totalContributions) * 100
}

// 导出CSV数据
const exportTableData = () => {
  const headers = ['Jahr', 'Startkapital', 'Einzahlungen', 'Zinserträge', 'Endkapital', 'Rendite']
  const csvContent = [
    headers.join(','),
    ...props.yearlyData.map(year => [
      year.year,
      year.start_amount.toFixed(2),
      year.contributions.toFixed(2),
      year.interest.toFixed(2),
      year.end_amount.toFixed(2),
      year.growth_rate.toFixed(2) + '%'
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `zinses-rechner-aufschluesselung-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 打印表格
const printTable = () => {
  const printContent = `
    <html>
      <head>
        <title>Zinses-Rechner Aufschlüsselung</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header { text-align: center; margin-bottom: 20px; }
          .currency { font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Zinses-Rechner - Jährliche Aufschlüsselung</h1>
          <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Jahr</th>
              <th>Startkapital</th>
              <th>Einzahlungen</th>
              <th>Zinserträge</th>
              <th>Endkapital</th>
              <th>Rendite</th>
            </tr>
          </thead>
          <tbody>
            ${props.yearlyData.map(year => `
              <tr>
                <td style="text-align: center;">${year.year}</td>
                <td class="currency">${formatCurrency(year.start_amount)}</td>
                <td class="currency">${formatCurrency(year.contributions)}</td>
                <td class="currency">${formatCurrency(year.interest)}</td>
                <td class="currency"><strong>${formatCurrency(year.end_amount)}</strong></td>
                <td>${formatPercentage(year.growth_rate)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }
}
</script>

<style scoped>
.yearly-breakdown-table {
  @apply w-full;
}

/* 表格样式优化 */
table {
  @apply shadow-sm;
}

tbody tr:nth-child(even) {
  @apply bg-gray-50;
}

tbody tr:hover {
  @apply bg-blue-50;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .yearly-breakdown-table {
    @apply text-sm;
  }
}

/* 打印样式 */
@media print {
  .yearly-breakdown-table {
    @apply text-black bg-white;
  }

  button {
    @apply hidden;
  }
}
</style>
