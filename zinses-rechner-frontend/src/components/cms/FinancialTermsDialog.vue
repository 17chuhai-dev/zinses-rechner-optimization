<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
      <!-- 对话框头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold">Finanzbegriff einfügen</h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <!-- 搜索和筛选 -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center space-x-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              @input="filterTerms"
              placeholder="Begriff suchen..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            v-model="selectedCategory"
            @change="filterTerms"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Kategorien</option>
            <option value="grundlagen">Grundlagen</option>
            <option value="zinsen">Zinsen & Rendite</option>
            <option value="investition">Investition</option>
            <option value="steuer">Steuer</option>
            <option value="versicherung">Versicherung</option>
            <option value="kredit">Kredit & Finanzierung</option>
          </select>
        </div>
      </div>

      <!-- 术语列表 -->
      <div class="flex h-96">
        <!-- 左侧：术语列表 -->
        <div class="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div class="p-4">
            <div
              v-for="term in filteredTerms"
              :key="term.id"
              @click="selectTerm(term)"
              :class="[
                'p-3 rounded-lg cursor-pointer transition-colors',
                selectedTerm?.id === term.id
                  ? 'bg-blue-100 border-blue-300'
                  : 'hover:bg-gray-50 border-transparent'
              ]"
              class="border mb-2"
            >
              <div class="flex items-center justify-between">
                <h3 class="font-medium text-gray-900">{{ term.name }}</h3>
                <span
                  :class="getCategoryColor(term.category)"
                  class="px-2 py-1 text-xs rounded-full"
                >
                  {{ getCategoryName(term.category) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ term.shortDescription }}</p>
            </div>
          </div>
        </div>

        <!-- 右侧：术语详情 -->
        <div class="w-1/2 overflow-y-auto">
          <div v-if="selectedTerm" class="p-4">
            <h3 class="text-lg font-semibold mb-2">{{ selectedTerm.name }}</h3>
            
            <div class="mb-4">
              <span
                :class="getCategoryColor(selectedTerm.category)"
                class="px-2 py-1 text-xs rounded-full"
              >
                {{ getCategoryName(selectedTerm.category) }}
              </span>
            </div>

            <div class="mb-4">
              <h4 class="font-medium mb-2">Definition</h4>
              <p class="text-gray-700">{{ selectedTerm.definition }}</p>
            </div>

            <div v-if="selectedTerm.formula" class="mb-4">
              <h4 class="font-medium mb-2">Formel</h4>
              <div class="bg-gray-100 p-3 rounded font-mono text-sm">
                {{ selectedTerm.formula }}
              </div>
            </div>

            <div v-if="selectedTerm.example" class="mb-4">
              <h4 class="font-medium mb-2">Beispiel</h4>
              <p class="text-gray-700">{{ selectedTerm.example }}</p>
            </div>

            <div v-if="selectedTerm.relatedTerms?.length" class="mb-4">
              <h4 class="font-medium mb-2">Verwandte Begriffe</h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="related in selectedTerm.relatedTerms"
                  :key="related"
                  class="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                >
                  {{ related }}
                </span>
              </div>
            </div>

            <!-- 插入选项 -->
            <div class="border-t pt-4">
              <h4 class="font-medium mb-3">Einfügen als:</h4>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="insertType"
                    type="radio"
                    value="definition"
                    class="mr-2"
                  />
                  <span class="text-sm">Definition mit Erklärung</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="insertType"
                    type="radio"
                    value="tooltip"
                    class="mr-2"
                  />
                  <span class="text-sm">Begriff mit Tooltip</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="insertType"
                    type="radio"
                    value="link"
                    class="mr-2"
                  />
                  <span class="text-sm">Link zu Begriffserklärung</span>
                </label>
              </div>
            </div>
          </div>
          
          <div v-else class="p-4 text-center text-gray-500">
            <p>Wählen Sie einen Begriff aus der Liste</p>
          </div>
        </div>
      </div>

      <!-- 对话框底部 -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          @click="insertTerm"
          :disabled="!selectedTerm"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Einfügen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 财务术语接口
interface FinancialTerm {
  id: string
  name: string
  shortDescription: string
  definition: string
  category: string
  formula?: string
  example?: string
  relatedTerms?: string[]
  keywords: string[]
}

// 事件定义
const emit = defineEmits<{
  close: []
  insert: [term: FinancialTerm, type: string]
}>()

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedTerm = ref<FinancialTerm | null>(null)
const insertType = ref('definition')

// 财务术语数据
const financialTerms = ref<FinancialTerm[]>([
  {
    id: 'zinseszins',
    name: 'Zinseszins',
    shortDescription: 'Zinsen, die auf bereits erhaltene Zinsen berechnet werden',
    definition: 'Der Zinseszins ist ein Zins, der nicht nur auf das ursprünglich angelegte Kapital (Grundkapital), sondern auch auf die bereits gutgeschriebenen Zinsen berechnet wird. Dadurch entsteht ein exponentielles Wachstum des Kapitals.',
    category: 'zinsen',
    formula: 'K_n = K_0 × (1 + p)^n',
    example: 'Bei 1.000€ Startkapital, 5% Zinsen und 10 Jahren: 1.000€ × (1,05)^10 = 1.628,89€',
    relatedTerms: ['Zinssatz', 'Kapitalwachstum', 'Rendite'],
    keywords: ['compound interest', 'zinsen', 'kapitalwachstum']
  },
  {
    id: 'zinssatz',
    name: 'Zinssatz',
    shortDescription: 'Prozentsatz, zu dem Kapital verzinst wird',
    definition: 'Der Zinssatz gibt an, wie viel Prozent des angelegten Kapitals als Zinsen pro Jahr gezahlt werden. Er ist ein wichtiger Faktor für die Berechnung von Zinserträgen und Kreditkosten.',
    category: 'zinsen',
    example: 'Ein Zinssatz von 3% bedeutet, dass für 1.000€ jährlich 30€ Zinsen gezahlt werden.',
    relatedTerms: ['Zinseszins', 'Nominalzins', 'Realzins'],
    keywords: ['interest rate', 'prozent', 'verzinsung']
  },
  {
    id: 'inflation',
    name: 'Inflation',
    shortDescription: 'Allgemeiner Anstieg des Preisniveaus',
    definition: 'Inflation bezeichnet den anhaltenden Anstieg des allgemeinen Preisniveaus von Gütern und Dienstleistungen in einer Volkswirtschaft. Sie führt zu einer Verringerung der Kaufkraft des Geldes.',
    category: 'grundlagen',
    example: 'Bei 2% Inflation kostet ein Produkt für 100€ nach einem Jahr 102€.',
    relatedTerms: ['Kaufkraft', 'Realzins', 'Deflation'],
    keywords: ['preissteigerung', 'kaufkraft', 'geldwert']
  },
  {
    id: 'rendite',
    name: 'Rendite',
    shortDescription: 'Ertrag einer Kapitalanlage in Prozent',
    definition: 'Die Rendite gibt den Ertrag einer Kapitalanlage in Prozent des eingesetzten Kapitals an. Sie berücksichtigt alle Erträge wie Zinsen, Dividenden und Kursgewinne.',
    category: 'investition',
    formula: 'Rendite = (Endwert - Anfangswert + Erträge) / Anfangswert × 100',
    example: 'Aktie für 100€ gekauft, für 110€ verkauft, 2€ Dividende: (110-100+2)/100 = 12% Rendite',
    relatedTerms: ['Zinssatz', 'Dividende', 'Kursgewinn'],
    keywords: ['return', 'ertrag', 'gewinn']
  },
  {
    id: 'abgeltungssteuer',
    name: 'Abgeltungssteuer',
    shortDescription: 'Steuer auf Kapitalerträge in Deutschland',
    definition: 'Die Abgeltungssteuer ist eine Quellensteuer auf Kapitalerträge wie Zinsen, Dividenden und Kursgewinne. Sie beträgt 25% plus Solidaritätszuschlag und ggf. Kirchensteuer.',
    category: 'steuer',
    example: 'Bei 1.000€ Zinserträgen fallen 250€ Abgeltungssteuer an (ohne Freibetrag).',
    relatedTerms: ['Sparerpauschbetrag', 'Kapitalerträge', 'Freistellungsauftrag'],
    keywords: ['capital gains tax', 'steuer', 'kapitalerträge']
  },
  {
    id: 'sparerpauschbetrag',
    name: 'Sparerpauschbetrag',
    shortDescription: 'Steuerfreier Betrag für Kapitalerträge',
    definition: 'Der Sparerpauschbetrag ist ein jährlicher Freibetrag für Kapitalerträge. Seit 2023 beträgt er 1.000€ für Alleinstehende und 2.000€ für Verheiratete.',
    category: 'steuer',
    example: 'Alleinstehende zahlen erst ab 1.001€ Kapitalerträgen Abgeltungssteuer.',
    relatedTerms: ['Abgeltungssteuer', 'Freistellungsauftrag', 'Kapitalerträge'],
    keywords: ['tax allowance', 'freibetrag', 'steuerfrei']
  }
])

// 计算属性
const filteredTerms = computed(() => {
  let terms = financialTerms.value

  // 按类别筛选
  if (selectedCategory.value) {
    terms = terms.filter(term => term.category === selectedCategory.value)
  }

  // 按搜索查询筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    terms = terms.filter(term =>
      term.name.toLowerCase().includes(query) ||
      term.shortDescription.toLowerCase().includes(query) ||
      term.definition.toLowerCase().includes(query) ||
      term.keywords.some(keyword => keyword.toLowerCase().includes(query))
    )
  }

  return terms
})

// 方法
const selectTerm = (term: FinancialTerm) => {
  selectedTerm.value = term
}

const filterTerms = () => {
  // 筛选逻辑已在计算属性中处理
}

const getCategoryName = (category: string) => {
  const categoryNames: Record<string, string> = {
    grundlagen: 'Grundlagen',
    zinsen: 'Zinsen & Rendite',
    investition: 'Investition',
    steuer: 'Steuer',
    versicherung: 'Versicherung',
    kredit: 'Kredit & Finanzierung'
  }
  return categoryNames[category] || category
}

const getCategoryColor = (category: string) => {
  const categoryColors: Record<string, string> = {
    grundlagen: 'bg-blue-100 text-blue-800',
    zinsen: 'bg-green-100 text-green-800',
    investition: 'bg-purple-100 text-purple-800',
    steuer: 'bg-red-100 text-red-800',
    versicherung: 'bg-yellow-100 text-yellow-800',
    kredit: 'bg-orange-100 text-orange-800'
  }
  return categoryColors[category] || 'bg-gray-100 text-gray-800'
}

const insertTerm = () => {
  if (selectedTerm.value) {
    emit('insert', selectedTerm.value, insertType.value)
  }
}

onMounted(() => {
  // 默认选择第一个术语
  if (filteredTerms.value.length > 0) {
    selectedTerm.value = filteredTerms.value[0]
  }
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
