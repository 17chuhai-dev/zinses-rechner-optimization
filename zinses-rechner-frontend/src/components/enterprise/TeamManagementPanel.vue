<!--
  企业级团队管理面板
  提供团队创建、成员管理、权限控制等功能
-->

<template>
  <div class="team-management-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-content">
        <h2 class="panel-title">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Team-Verwaltung
        </h2>
        
        <div class="header-actions">
          <button
            type="button"
            class="action-btn secondary"
            @click="showInviteDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Mitglieder einladen
          </button>
          
          <button
            type="button"
            class="action-btn primary"
            @click="showCreateTeamDialog = true"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Team erstellen
          </button>
        </div>
      </div>
      
      <!-- 组织信息 -->
      <div v-if="organization" class="organization-info">
        <div class="org-details">
          <div class="org-logo">
            <img v-if="organization.logo" :src="organization.logo" :alt="organization.displayName" />
            <div v-else class="org-logo-placeholder">
              {{ getInitials(organization.displayName) }}
            </div>
          </div>
          <div class="org-text">
            <h3 class="org-name">{{ organization.displayName }}</h3>
            <p class="org-domain">{{ organization.domain }}</p>
          </div>
        </div>
        
        <div class="org-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalMembers }}</span>
            <span class="stat-label">Mitglieder</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ teams.length }}</span>
            <span class="stat-label">Teams</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ pendingInvitations.length }}</span>
            <span class="stat-label">Einladungen</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="tab-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
        </svg>
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="tab-content">
      <!-- 团队标签 -->
      <div v-if="activeTab === 'teams'" class="teams-tab">
        <div class="teams-grid">
          <div
            v-for="team in teams"
            :key="team.id"
            class="team-card"
            @click="selectTeam(team)"
          >
            <div class="team-header">
              <h3 class="team-name">{{ team.name }}</h3>
              <div class="team-actions">
                <button
                  type="button"
                  class="team-action-btn"
                  @click.stop="editTeam(team)"
                  title="Team bearbeiten"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <div class="dropdown" v-if="canManageTeam(team)">
                  <button
                    type="button"
                    class="team-action-btn dropdown-trigger"
                    @click.stop="toggleTeamDropdown(team.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  <div
                    v-if="activeTeamDropdown === team.id"
                    class="dropdown-menu"
                  >
                    <button
                      type="button"
                      class="dropdown-item"
                      @click="duplicateTeam(team)"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplizieren
                    </button>
                    
                    <button
                      type="button"
                      class="dropdown-item danger"
                      @click="deleteTeam(team)"
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
            
            <p v-if="team.description" class="team-description">{{ team.description }}</p>
            
            <div class="team-members">
              <div class="member-avatars">
                <div
                  v-for="member in team.members.slice(0, 5)"
                  :key="member.userId"
                  class="member-avatar"
                  :title="member.displayName"
                >
                  {{ getInitials(member.displayName) }}
                </div>
                <div
                  v-if="team.members.length > 5"
                  class="member-avatar more"
                >
                  +{{ team.members.length - 5 }}
                </div>
              </div>
              
              <span class="members-count">{{ team.members.length }} Mitglieder</span>
            </div>
            
            <div class="team-footer">
              <span class="team-created">
                Erstellt {{ formatRelativeTime(team.createdAt) }}
              </span>
              <span class="team-status" :class="{ active: team.isActive }">
                {{ team.isActive ? 'Aktiv' : 'Inaktiv' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 成员标签 -->
      <div v-if="activeTab === 'members'" class="members-tab">
        <div class="members-controls">
          <div class="search-box">
            <svg class="w-4 h-4 search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="memberSearchQuery"
              type="text"
              placeholder="Mitglieder suchen..."
              class="search-input"
            />
          </div>
          
          <select v-model="memberRoleFilter" class="role-filter">
            <option value="">Alle Rollen</option>
            <option value="owner">Eigentümer</option>
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Betrachter</option>
          </select>
        </div>

        <div class="members-table">
          <table>
            <thead>
              <tr>
                <th>Mitglied</th>
                <th>Rolle</th>
                <th>Teams</th>
                <th>Status</th>
                <th>Beigetreten</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="member in filteredMembers"
                :key="member.userId"
                class="member-row"
              >
                <td class="member-info">
                  <div class="member-avatar">
                    {{ getInitials(member.displayName) }}
                  </div>
                  <div class="member-details">
                    <div class="member-name">{{ member.displayName }}</div>
                    <div class="member-email">{{ member.email }}</div>
                  </div>
                </td>
                
                <td>
                  <select
                    v-if="canChangeRole(member)"
                    :value="member.role"
                    @change="updateMemberRole(member, $event.target.value)"
                    class="role-select"
                  >
                    <option value="viewer">Betrachter</option>
                    <option value="analyst">Analyst</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                    <option v-if="isOwner" value="owner">Eigentümer</option>
                  </select>
                  <span v-else class="role-badge" :class="member.role">
                    {{ getRoleLabel(member.role) }}
                  </span>
                </td>
                
                <td>
                  <div class="member-teams">
                    <span
                      v-for="teamId in getMemberTeams(member.userId)"
                      :key="teamId"
                      class="team-badge"
                    >
                      {{ getTeamName(teamId) }}
                    </span>
                  </div>
                </td>
                
                <td>
                  <span class="status-badge" :class="member.status">
                    {{ getStatusLabel(member.status) }}
                  </span>
                </td>
                
                <td class="joined-date">
                  {{ formatDate(member.joinedAt) }}
                </td>
                
                <td class="member-actions">
                  <button
                    v-if="canRemoveMember(member)"
                    type="button"
                    class="action-btn small danger"
                    @click="removeMember(member)"
                    title="Mitglied entfernen"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 邀请标签 -->
      <div v-if="activeTab === 'invitations'" class="invitations-tab">
        <div class="invitations-list">
          <div
            v-for="invitation in pendingInvitations"
            :key="invitation.id"
            class="invitation-card"
          >
            <div class="invitation-info">
              <div class="invitation-email">{{ invitation.email }}</div>
              <div class="invitation-details">
                <span class="invitation-role">{{ getRoleLabel(invitation.role) }}</span>
                <span class="invitation-date">
                  Eingeladen {{ formatRelativeTime(invitation.invitedAt) }}
                </span>
                <span class="invitation-expires">
                  Läuft ab {{ formatRelativeTime(invitation.expiresAt) }}
                </span>
              </div>
            </div>
            
            <div class="invitation-actions">
              <button
                type="button"
                class="action-btn small secondary"
                @click="resendInvitation(invitation)"
              >
                Erneut senden
              </button>
              <button
                type="button"
                class="action-btn small danger"
                @click="cancelInvitation(invitation)"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 权限标签 -->
      <div v-if="activeTab === 'permissions'" class="permissions-tab">
        <div class="permissions-matrix">
          <h3 class="permissions-title">Rollen und Berechtigungen</h3>
          
          <div class="permissions-table">
            <table>
              <thead>
                <tr>
                  <th>Berechtigung</th>
                  <th>Betrachter</th>
                  <th>Analyst</th>
                  <th>Manager</th>
                  <th>Administrator</th>
                  <th>Eigentümer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="permission in permissionsList" :key="permission.key">
                  <td class="permission-name">{{ permission.label }}</td>
                  <td v-for="role in roles" :key="role" class="permission-cell">
                    <div
                      class="permission-indicator"
                      :class="{ granted: hasPermission(role, permission.key) }"
                    >
                      <svg v-if="hasPermission(role, permission.key)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建团队对话框 -->
    <CreateTeamDialog
      v-if="showCreateTeamDialog"
      :organization="organization"
      @close="showCreateTeamDialog = false"
      @created="handleTeamCreated"
    />

    <!-- 邀请成员对话框 -->
    <InviteMembersDialog
      v-if="showInviteDialog"
      :organization="organization"
      :teams="teams"
      @close="showInviteDialog = false"
      @invited="handleMembersInvited"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { enterpriseTeamService } from '@/services/EnterpriseTeamService'
import type { Organization, Team, TeamMember, TeamInvitation, TeamRole } from '@/services/EnterpriseTeamService'
import CreateTeamDialog from './CreateTeamDialog.vue'
import InviteMembersDialog from './InviteMembersDialog.vue'

interface Props {
  organizationId: string
}

const props = defineProps<Props>()

// 响应式数据
const organization = ref<Organization | null>(null)
const teams = ref<Team[]>([])
const pendingInvitations = ref<TeamInvitation[]>([])
const activeTab = ref('teams')
const memberSearchQuery = ref('')
const memberRoleFilter = ref('')
const activeTeamDropdown = ref<string | null>(null)
const showCreateTeamDialog = ref(false)
const showInviteDialog = ref(false)

// 标签页配置
const tabs = computed(() => [
  {
    id: 'teams',
    label: 'Teams',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    count: teams.value.length
  },
  {
    id: 'members',
    label: 'Mitglieder',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    count: totalMembers.value
  },
  {
    id: 'invitations',
    label: 'Einladungen',
    icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    count: pendingInvitations.value.length
  },
  {
    id: 'permissions',
    label: 'Berechtigungen',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  }
])

// 计算属性
const totalMembers = computed(() => {
  const memberIds = new Set<string>()
  teams.value.forEach(team => {
    team.members.forEach(member => memberIds.add(member.userId))
  })
  return memberIds.size
})

const allMembers = computed(() => {
  const membersMap = new Map<string, TeamMember>()
  teams.value.forEach(team => {
    team.members.forEach(member => {
      if (!membersMap.has(member.userId)) {
        membersMap.set(member.userId, member)
      }
    })
  })
  return Array.from(membersMap.values())
})

const filteredMembers = computed(() => {
  return allMembers.value.filter(member => {
    const matchesSearch = !memberSearchQuery.value || 
      member.displayName.toLowerCase().includes(memberSearchQuery.value.toLowerCase()) ||
      member.email.toLowerCase().includes(memberSearchQuery.value.toLowerCase())
    
    const matchesRole = !memberRoleFilter.value || member.role === memberRoleFilter.value
    
    return matchesSearch && matchesRole
  })
})

const roles: TeamRole[] = ['viewer', 'analyst', 'manager', 'admin', 'owner']

const permissionsList = [
  { key: 'canCreateCalculations', label: 'Berechnungen erstellen' },
  { key: 'canEditCalculations', label: 'Berechnungen bearbeiten' },
  { key: 'canDeleteCalculations', label: 'Berechnungen löschen' },
  { key: 'canShareCalculations', label: 'Berechnungen teilen' },
  { key: 'canExportData', label: 'Daten exportieren' },
  { key: 'canManageTeam', label: 'Team verwalten' },
  { key: 'canViewReports', label: 'Berichte anzeigen' },
  { key: 'canCreateReports', label: 'Berichte erstellen' },
  { key: 'canAccessAPI', label: 'API-Zugriff' },
  { key: 'canManageSettings', label: 'Einstellungen verwalten' }
]

const isOwner = computed(() => {
  // 这里应该检查当前用户是否为组织所有者
  return true // 临时返回true
})

// 方法
const loadData = async () => {
  try {
    const [orgData, teamsData] = await Promise.all([
      enterpriseTeamService.getOrganization(props.organizationId),
      enterpriseTeamService.getOrganizationTeams(props.organizationId)
    ])
    
    organization.value = orgData
    teams.value = teamsData
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const selectTeam = (team: Team) => {
  // 选择团队的逻辑
  console.log('选择团队:', team)
}

const editTeam = (team: Team) => {
  // 编辑团队的逻辑
  console.log('编辑团队:', team)
}

const duplicateTeam = (team: Team) => {
  // 复制团队的逻辑
  console.log('复制团队:', team)
}

const deleteTeam = async (team: Team) => {
  if (!confirm(`确定要删除团队 "${team.name}" 吗？`)) {
    return
  }
  
  // 删除团队的逻辑
  console.log('删除团队:', team)
}

const toggleTeamDropdown = (teamId: string) => {
  activeTeamDropdown.value = activeTeamDropdown.value === teamId ? null : teamId
}

const canManageTeam = (team: Team): boolean => {
  // 检查是否可以管理团队
  return true // 临时返回true
}

const canChangeRole = (member: TeamMember): boolean => {
  // 检查是否可以更改成员角色
  return member.role !== 'owner'
}

const canRemoveMember = (member: TeamMember): boolean => {
  // 检查是否可以移除成员
  return member.role !== 'owner'
}

const updateMemberRole = async (member: TeamMember, newRole: TeamRole) => {
  // 更新成员角色的逻辑
  console.log('更新成员角色:', member, newRole)
}

const removeMember = async (member: TeamMember) => {
  if (!confirm(`确定要移除成员 "${member.displayName}" 吗？`)) {
    return
  }
  
  // 移除成员的逻辑
  console.log('移除成员:', member)
}

const resendInvitation = async (invitation: TeamInvitation) => {
  // 重新发送邀请的逻辑
  console.log('重新发送邀请:', invitation)
}

const cancelInvitation = async (invitation: TeamInvitation) => {
  // 取消邀请的逻辑
  console.log('取消邀请:', invitation)
}

const handleTeamCreated = (team: Team) => {
  teams.value.push(team)
  showCreateTeamDialog.value = false
}

const handleMembersInvited = (invitations: TeamInvitation[]) => {
  pendingInvitations.value.push(...invitations)
  showInviteDialog.value = false
}

// 工具方法
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const getRoleLabel = (role: TeamRole): string => {
  const labels = {
    owner: 'Eigentümer',
    admin: 'Administrator',
    manager: 'Manager',
    analyst: 'Analyst',
    viewer: 'Betrachter'
  }
  return labels[role] || role
}

const getStatusLabel = (status: string): string => {
  const labels = {
    active: 'Aktiv',
    inactive: 'Inaktiv',
    pending: 'Ausstehend',
    suspended: 'Gesperrt'
  }
  return labels[status as keyof typeof labels] || status
}

const getMemberTeams = (userId: string): string[] => {
  return teams.value
    .filter(team => team.members.some(member => member.userId === userId))
    .map(team => team.id)
}

const getTeamName = (teamId: string): string => {
  const team = teams.value.find(t => t.id === teamId)
  return team?.name || 'Unknown Team'
}

const hasPermission = (role: TeamRole, permission: string): boolean => {
  // 权限矩阵逻辑
  const permissions = {
    viewer: ['canViewReports'],
    analyst: ['canViewReports', 'canCreateCalculations', 'canEditCalculations'],
    manager: ['canViewReports', 'canCreateCalculations', 'canEditCalculations', 'canShareCalculations', 'canCreateReports', 'canExportData'],
    admin: ['canViewReports', 'canCreateCalculations', 'canEditCalculations', 'canDeleteCalculations', 'canShareCalculations', 'canCreateReports', 'canExportData', 'canManageTeam', 'canAccessAPI'],
    owner: ['canViewReports', 'canCreateCalculations', 'canEditCalculations', 'canDeleteCalculations', 'canShareCalculations', 'canCreateReports', 'canExportData', 'canManageTeam', 'canAccessAPI', 'canManageSettings']
  }
  
  return permissions[role]?.includes(permission) || false
}

// 生命周期
onMounted(() => {
  loadData()
  
  // 点击外部关闭下拉菜单
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.dropdown')) {
      activeTeamDropdown.value = null
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', () => {})
})
</script>

<style scoped>
.team-management-panel {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.panel-header {
  @apply p-6 border-b border-gray-200 dark:border-gray-700;
}

.header-content {
  @apply flex items-center justify-between mb-6;
}

.panel-title {
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

.action-btn.small {
  @apply px-3 py-1 text-sm;
}

.action-btn.danger {
  @apply bg-red-600 text-white hover:bg-red-700;
}

.organization-info {
  @apply flex items-center justify-between;
}

.org-details {
  @apply flex items-center space-x-4;
}

.org-logo {
  @apply w-12 h-12 rounded-lg overflow-hidden;
}

.org-logo img {
  @apply w-full h-full object-cover;
}

.org-logo-placeholder {
  @apply w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg;
}

.org-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.org-domain {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.org-stats {
  @apply flex items-center space-x-6;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply block text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.tab-navigation {
  @apply flex border-b border-gray-200 dark:border-gray-700;
}

.tab-button {
  @apply px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400
         hover:text-gray-900 dark:hover:text-white border-b-2 border-transparent
         hover:border-gray-300 dark:hover:border-gray-600 transition-colors
         flex items-center;
}

.tab-button.active {
  @apply text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400;
}

.tab-count {
  @apply ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full;
}

.tab-content {
  @apply p-6;
}

.teams-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.team-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-xl p-6 cursor-pointer
         hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600;
}

.team-header {
  @apply flex items-center justify-between mb-3;
}

.team-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.team-actions {
  @apply flex items-center space-x-2;
}

.team-action-btn {
  @apply p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
         hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors;
}

.team-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-4;
}

.team-members {
  @apply flex items-center justify-between mb-4;
}

.member-avatars {
  @apply flex -space-x-2;
}

.member-avatar {
  @apply w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-medium
         flex items-center justify-center border-2 border-white dark:border-gray-700;
}

.member-avatar.more {
  @apply bg-gray-400 dark:bg-gray-600;
}

.members-count {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.team-footer {
  @apply flex items-center justify-between text-xs text-gray-500 dark:text-gray-500;
}

.team-status.active {
  @apply text-green-600 dark:text-green-400;
}

.members-controls {
  @apply flex items-center space-x-4 mb-6;
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

.role-filter {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.members-table {
  @apply overflow-x-auto;
}

.members-table table {
  @apply w-full;
}

.members-table th {
  @apply px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.members-table td {
  @apply px-4 py-4 whitespace-nowrap;
}

.member-row {
  @apply border-b border-gray-200 dark:border-gray-700;
}

.member-info {
  @apply flex items-center space-x-3;
}

.member-details {
  @apply space-y-1;
}

.member-name {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.member-email {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.role-select {
  @apply px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.role-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.role-badge.owner {
  @apply bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400;
}

.role-badge.admin {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.role-badge.manager {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400;
}

.role-badge.analyst {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.role-badge.viewer {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400;
}

.member-teams {
  @apply flex flex-wrap gap-1;
}

.team-badge {
  @apply px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-badge.active {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.status-badge.inactive {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400;
}

.status-badge.pending {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.status-badge.suspended {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.joined-date {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.member-actions {
  @apply flex items-center space-x-2;
}

.invitations-list {
  @apply space-y-4;
}

.invitation-card {
  @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between;
}

.invitation-info {
  @apply space-y-1;
}

.invitation-email {
  @apply font-medium text-gray-900 dark:text-white;
}

.invitation-details {
  @apply flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400;
}

.invitation-role {
  @apply px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs;
}

.invitation-actions {
  @apply flex items-center space-x-2;
}

.permissions-matrix {
  @apply space-y-6;
}

.permissions-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.permissions-table table {
  @apply w-full;
}

.permissions-table th {
  @apply px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider;
}

.permissions-table td {
  @apply px-4 py-3;
}

.permission-name {
  @apply text-sm text-gray-900 dark:text-white;
}

.permission-cell {
  @apply text-center;
}

.permission-indicator {
  @apply inline-flex items-center justify-center w-6 h-6 rounded-full;
}

.permission-indicator.granted {
  @apply bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400;
}

.permission-indicator:not(.granted) {
  @apply bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400;
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
  
  .organization-info {
    @apply flex-col space-y-4;
  }
  
  .org-stats {
    @apply justify-center;
  }
  
  .teams-grid {
    @apply grid-cols-1;
  }
  
  .members-table {
    @apply text-sm;
  }
  
  .tab-navigation {
    @apply overflow-x-auto;
  }
  
  .tab-button {
    @apply whitespace-nowrap;
  }
}
</style>
