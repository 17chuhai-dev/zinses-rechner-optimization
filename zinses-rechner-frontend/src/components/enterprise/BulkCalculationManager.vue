<!--
  企业级批量计算管理器
  提供批量计算作业的创建、监控、管理功能
-->

<template>
  <div class="bulk-calculation-manager">
    <!-- 管理器头部 -->
    <div class="manager-header">
      <div class="header-content">
        <h2 class="manager-title">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Batch-Berechnungen
        </h2>
        
        <div class="header-actions">
          <button
            type="button"
            class="action-btn secondary"
            @click="showTemplatesDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Vorlagen
          </button>
          
          <button
            type="button"
            class="action-btn primary"
            @click="showCreateJobDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Neuer Batch-Job
          </button>
        </div>
      </div>
      
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon running">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ runningJobs }}</div>
            <div class="stat-label">Laufende Jobs</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon completed">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ completedJobs }}</div>
            <div class="stat-label">Abgeschlossen</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon failed">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ failedJobs }}</div>
            <div class="stat-label">Fehlgeschlagen</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon total">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCalculations }}</div>
            <div class="stat-label">Berechnungen</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 过滤和搜索 -->
    <div class="filters-section">
      <div class="search-box">
        <svg class="w-4 h-4 search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Jobs suchen..."
          class="search-input"
        />
      </div>
      
      <div class="filter-controls">
        <select v-model="statusFilter" class="filter-select">
          <option value="">Alle Status</option>
          <option value="pending">Wartend</option>
          <option value="queued">In Warteschlange</option>
          <option value="running">Laufend</option>
          <option value="completed">Abgeschlossen</option>
          <option value="failed">Fehlgeschlagen</option>
          <option value="cancelled">Abgebrochen</option>
        </select>
        
        <select v-model="calculatorTypeFilter" class="filter-select">
          <option value="">Alle Rechner</option>
          <option value="compound-interest">Zinseszins</option>
          <option value="mortgage">Hypothek</option>
          <option value="loan">Kredit</option>
          <option value="investment">Investment</option>
        </select>
        
        <button
          type="button"
          class="filter-btn"
          @click="refreshJobs"
          :disabled="isLoading"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 作业列表 -->
    <div class="jobs-section">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Lade Batch-Jobs...</span>
      </div>
      
      <div v-else-if="filteredJobs.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 class="empty-title">Keine Batch-Jobs gefunden</h3>
        <p class="empty-description">
          Erstellen Sie Ihren ersten Batch-Job, um große Mengen von Berechnungen zu verarbeiten.
        </p>
        <button
          type="button"
          class="action-btn primary"
          @click="showCreateJobDialog = true"
        >
          Ersten Job erstellen
        </button>
      </div>
      
      <div v-else class="jobs-list">
        <div
          v-for="job in filteredJobs"
          :key="job.id"
          class="job-card"
          :class="{ 'job-running': job.status === 'running' }"
        >
          <div class="job-header">
            <div class="job-info">
              <h3 class="job-name">{{ job.name }}</h3>
              <p v-if="job.description" class="job-description">{{ job.description }}</p>
              <div class="job-meta">
                <span class="job-type">{{ getCalculatorTypeLabel(job.calculatorType) }}</span>
                <span class="job-created">{{ formatRelativeTime(job.createdAt) }}</span>
              </div>
            </div>
            
            <div class="job-status">
              <span class="status-badge" :class="job.status">
                {{ getStatusLabel(job.status) }}
              </span>
            </div>
          </div>
          
          <!-- 进度条 -->
          <div v-if="job.status === 'running' || job.status === 'completed'" class="job-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${job.progress.percentage}%` }"
                :class="job.status"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-text">
                {{ job.progress.completed }} / {{ job.progress.total }} 
                ({{ job.progress.percentage.toFixed(1) }}%)
              </span>
              <span v-if="job.progress.estimatedTimeRemaining" class="time-remaining">
                {{ formatDuration(job.progress.estimatedTimeRemaining) }} verbleibend
              </span>
            </div>
          </div>
          
          <!-- 作业统计 -->
          <div class="job-stats">
            <div class="stat-item">
              <span class="stat-label">Eingaben:</span>
              <span class="stat-value">{{ job.inputData.length }}</span>
            </div>
            <div v-if="job.results.length > 0" class="stat-item">
              <span class="stat-label">Ergebnisse:</span>
              <span class="stat-value">{{ job.results.length }}</span>
            </div>
            <div v-if="job.actualDuration" class="stat-item">
              <span class="stat-label">Dauer:</span>
              <span class="stat-value">{{ formatDuration(job.actualDuration) }}</span>
            </div>
            <div v-if="job.progress.throughputPerSecond" class="stat-item">
              <span class="stat-label">Durchsatz:</span>
              <span class="stat-value">{{ job.progress.throughputPerSecond.toFixed(1) }}/s</span>
            </div>
          </div>
          
          <!-- 作业操作 -->
          <div class="job-actions">
            <button
              v-if="job.status === 'pending' || job.status === 'queued'"
              type="button"
              class="job-action-btn primary"
              @click="startJob(job)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
              </svg>
              Starten
            </button>
            
            <button
              v-if="job.status === 'running'"
              type="button"
              class="job-action-btn secondary"
              @click="pauseJob(job)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pausieren
            </button>
            
            <button
              v-if="job.status === 'paused'"
              type="button"
              class="job-action-btn primary"
              @click="resumeJob(job)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
              </svg>
              Fortsetzen
            </button>
            
            <button
              v-if="job.status === 'completed'"
              type="button"
              class="job-action-btn secondary"
              @click="viewResults(job)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ergebnisse
            </button>
            
            <button
              v-if="job.status === 'completed'"
              type="button"
              class="job-action-btn secondary"
              @click="exportResults(job)"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            
            <div class="dropdown">
              <button
                type="button"
                class="job-action-btn secondary dropdown-trigger"
                @click="toggleJobDropdown(job.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              <div
                v-if="activeJobDropdown === job.id"
                class="dropdown-menu"
              >
                <button
                  type="button"
                  class="dropdown-item"
                  @click="duplicateJob(job)"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Duplizieren
                </button>
                
                <button
                  type="button"
                  class="dropdown-item"
                  @click="createTemplate(job)"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Als Vorlage speichern
                </button>
                
                <button
                  v-if="canCancelJob(job)"
                  type="button"
                  class="dropdown-item danger"
                  @click="cancelJob(job)"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Abbrechen
                </button>
                
                <button
                  v-if="canDeleteJob(job)"
                  type="button"
                  class="dropdown-item danger"
                  @click="deleteJob(job)"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建作业对话框 -->
    <CreateBulkJobDialog
      v-if="showCreateJobDialog"
      :organization-id="organizationId"
      @close="showCreateJobDialog = false"
      @created="handleJobCreated"
    />

    <!-- 模板管理对话框 -->
    <BulkJobTemplatesDialog
      v-if="showTemplatesDialog"
      :organization-id="organizationId"
      @close="showTemplatesDialog = false"
      @template-selected="handleTemplateSelected"
    />

    <!-- 结果查看对话框 -->
    <JobResultsDialog
      v-if="showResultsDialog"
      :job="selectedJob"
      @close="showResultsDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { bulkCalculationService } from '@/services/BulkCalculationService'
import type { BulkCalculationJob, JobStatus } from '@/services/BulkCalculationService'
import CreateBulkJobDialog from './CreateBulkJobDialog.vue'
import BulkJobTemplatesDialog from './BulkJobTemplatesDialog.vue'
import JobResultsDialog from './JobResultsDialog.vue'

interface Props {
  organizationId: string
}

const props = defineProps<Props>()

// 响应式数据
const jobs = ref<BulkCalculationJob[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const calculatorTypeFilter = ref('')
const activeJobDropdown = ref<string | null>(null)
const showCreateJobDialog = ref(false)
const showTemplatesDialog = ref(false)
const showResultsDialog = ref(false)
const selectedJob = ref<BulkCalculationJob | null>(null)

// 计算属性
const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const matchesSearch = !searchQuery.value || 
      job.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (job.description && job.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    
    const matchesStatus = !statusFilter.value || job.status === statusFilter.value
    const matchesType = !calculatorTypeFilter.value || job.calculatorType === calculatorTypeFilter.value
    
    return matchesSearch && matchesStatus && matchesType
  })
})

const runningJobs = computed(() => jobs.value.filter(job => job.status === 'running').length)
const completedJobs = computed(() => jobs.value.filter(job => job.status === 'completed').length)
const failedJobs = computed(() => jobs.value.filter(job => job.status === 'failed').length)
const totalCalculations = computed(() => jobs.value.reduce((sum, job) => sum + job.inputData.length, 0))

// 方法
const loadJobs = async () => {
  isLoading.value = true
  try {
    const response = await bulkCalculationService.getOrganizationJobs(props.organizationId, {
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    jobs.value = response.jobs
  } catch (error) {
    console.error('加载批量作业失败:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshJobs = () => {
  loadJobs()
}

const startJob = async (job: BulkCalculationJob) => {
  const success = await bulkCalculationService.startJob(job.id)
  if (success) {
    job.status = 'running'
  }
}

const pauseJob = async (job: BulkCalculationJob) => {
  const success = await bulkCalculationService.pauseJob(job.id)
  if (success) {
    job.status = 'paused'
  }
}

const resumeJob = async (job: BulkCalculationJob) => {
  const success = await bulkCalculationService.resumeJob(job.id)
  if (success) {
    job.status = 'running'
  }
}

const cancelJob = async (job: BulkCalculationJob) => {
  if (!confirm(`确定要取消作业 "${job.name}" 吗？`)) {
    return
  }
  
  const success = await bulkCalculationService.cancelJob(job.id)
  if (success) {
    job.status = 'cancelled'
  }
}

const deleteJob = async (job: BulkCalculationJob) => {
  if (!confirm(`确定要删除作业 "${job.name}" 吗？此操作无法撤销。`)) {
    return
  }
  
  // 删除作业的逻辑
  jobs.value = jobs.value.filter(j => j.id !== job.id)
}

const duplicateJob = (job: BulkCalculationJob) => {
  // 复制作业的逻辑
  console.log('复制作业:', job)
}

const createTemplate = (job: BulkCalculationJob) => {
  // 从作业创建模板的逻辑
  console.log('创建模板:', job)
}

const viewResults = (job: BulkCalculationJob) => {
  selectedJob.value = job
  showResultsDialog.value = true
}

const exportResults = async (job: BulkCalculationJob) => {
  const blob = await bulkCalculationService.exportJobResults(job.id, 'xlsx', {
    includeInputData: true,
    includeMetadata: true
  })
  
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.name}_results.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

const toggleJobDropdown = (jobId: string) => {
  activeJobDropdown.value = activeJobDropdown.value === jobId ? null : jobId
}

const canCancelJob = (job: BulkCalculationJob): boolean => {
  return ['pending', 'queued', 'running', 'paused'].includes(job.status)
}

const canDeleteJob = (job: BulkCalculationJob): boolean => {
  return ['completed', 'failed', 'cancelled'].includes(job.status)
}

const handleJobCreated = (job: BulkCalculationJob) => {
  jobs.value.unshift(job)
  showCreateJobDialog.value = false
}

const handleTemplateSelected = (template: any) => {
  // 处理模板选择的逻辑
  console.log('选择模板:', template)
  showTemplatesDialog.value = false
}

// 工具方法
const getStatusLabel = (status: JobStatus): string => {
  const labels = {
    pending: 'Wartend',
    queued: 'In Warteschlange',
    running: 'Laufend',
    paused: 'Pausiert',
    completed: 'Abgeschlossen',
    failed: 'Fehlgeschlagen',
    cancelled: 'Abgebrochen'
  }
  return labels[status] || status
}

const getCalculatorTypeLabel = (type: string): string => {
  const labels = {
    'compound-interest': 'Zinseszins',
    'mortgage': 'Hypothek',
    'loan': 'Kredit',
    'investment': 'Investment'
  }
  return labels[type as keyof typeof labels] || type
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'heute'
  if (diffDays === 1) return 'gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`
  return `vor ${Math.floor(diffDays / 30)} Monaten`
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// 生命周期
onMounted(() => {
  loadJobs()
  
  // 监听作业进度更新
  bulkCalculationService.on('job:progress', (job: BulkCalculationJob) => {
    const index = jobs.value.findIndex(j => j.id === job.id)
    if (index !== -1) {
      jobs.value[index] = job
    }
  })
  
  // 点击外部关闭下拉菜单
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.dropdown')) {
      activeJobDropdown.value = null
    }
  })
})

onUnmounted(() => {
  bulkCalculationService.off('job:progress', () => {})
  document.removeEventListener('click', () => {})
})
</script>

<style scoped>
.bulk-calculation-manager {
  @apply space-y-6;
}

.manager-header {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.header-content {
  @apply flex items-center justify-between mb-6;
}

.manager-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white flex items-center;
}

.header-actions {
  @apply flex items-center space-x-3;
}

.action-btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors flex items-center
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-btn.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-btn.secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         hover:bg-gray-300 dark:hover:bg-gray-600;
}

.stats-overview {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center space-x-3;
}

.stat-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center;
}

.stat-icon.running {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400;
}

.stat-icon.completed {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.stat-icon.failed {
  @apply bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400;
}

.stat-icon.total {
  @apply bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400;
}

.stat-content {
  @apply space-y-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.filters-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4
         flex items-center space-x-4;
}

.search-box {
  @apply relative flex-1;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.filter-controls {
  @apply flex items-center space-x-3;
}

.filter-select {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.filter-btn {
  @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.jobs-section {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.loading-state {
  @apply flex items-center justify-center py-12 space-x-3;
}

.loading-spinner {
  @apply w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin;
}

.empty-state {
  @apply text-center py-12 px-6;
}

.empty-icon {
  @apply flex justify-center mb-4;
}

.empty-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.empty-description {
  @apply text-gray-600 dark:text-gray-400 mb-6;
}

.jobs-list {
  @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.job-card {
  @apply p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.job-card.job-running {
  @apply bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500;
}

.job-header {
  @apply flex items-start justify-between mb-4;
}

.job-info {
  @apply flex-1;
}

.job-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-1;
}

.job-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-2;
}

.job-meta {
  @apply flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500;
}

.job-type {
  @apply px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs;
}

.job-status {
  @apply flex-shrink-0;
}

.status-badge {
  @apply px-3 py-1 text-sm font-medium rounded-full;
}

.status-badge.pending {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400;
}

.status-badge.queued {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.status-badge.running {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400;
}

.status-badge.paused {
  @apply bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400;
}

.status-badge.completed {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.status-badge.failed {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.status-badge.cancelled {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400;
}

.job-progress {
  @apply mb-4;
}

.progress-bar {
  @apply w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2;
}

.progress-fill {
  @apply h-2 rounded-full transition-all duration-300;
}

.progress-fill.running {
  @apply bg-blue-600;
}

.progress-fill.completed {
  @apply bg-green-600;
}

.progress-info {
  @apply flex items-center justify-between text-sm text-gray-600 dark:text-gray-400;
}

.job-stats {
  @apply flex items-center space-x-6 mb-4 text-sm;
}

.stat-item {
  @apply flex items-center space-x-1;
}

.stat-label {
  @apply text-gray-600 dark:text-gray-400;
}

.stat-value {
  @apply font-medium text-gray-900 dark:text-white;
}

.job-actions {
  @apply flex items-center space-x-2;
}

.job-action-btn {
  @apply px-3 py-1 text-sm rounded-lg font-medium transition-colors flex items-center
         disabled:opacity-50 disabled:cursor-not-allowed;
}

.job-action-btn.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.job-action-btn.secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
         hover:bg-gray-300 dark:hover:bg-gray-600;
}

.dropdown {
  @apply relative;
}

.dropdown-menu {
  @apply absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg
         border border-gray-200 dark:border-gray-700 py-1 z-10;
}

.dropdown-item {
  @apply w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors;
}

.dropdown-item.danger {
  @apply text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .stats-overview {
    @apply grid-cols-2;
  }
  
  .filters-section {
    @apply flex-col space-y-3 space-x-0;
  }
  
  .filter-controls {
    @apply w-full justify-between;
  }
  
  .job-header {
    @apply flex-col space-y-3;
  }
  
  .job-actions {
    @apply flex-wrap;
  }
}
</style>
