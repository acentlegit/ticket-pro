import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, UserPlus, Upload, Users, X, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { PERMISSIONS } from '../config/permissions'

const UserManagement = () => {
  const { user, checkPermission } = useAuth()
  const navigate = useNavigate()
  const { companyId } = useParams()

  // Tab state
  const [activeTab, setActiveTab] = useState('users')

  // Users state
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Teams state
  const [teams, setTeams] = useState([])
  const [agents, setAgents] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    description: '',
    logoUrl: '',
    members: []
  })
  const [logoPreview, setLogoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)

  useEffect(() => {
    fetchUsers()
    if (companyId) {
      fetchTeams()
      fetchAgents()
    }
  }, [companyId])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users')
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true)
      const response = await api.get(`/${companyId}/teams`)
      setTeams(response.data.teams || [])
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      setTeamsLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await api.get('/auth/users?role=agent')
      setAgents(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      company_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      requester: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
    }
    return `status-badge ${badges[role] || badges.requester}`
  }

  // Team handlers
  const handleOpenTeamModal = (team = null) => {
    if (team) {
      setEditingTeam(team)
      setTeamForm({
        teamName: team.teamName || '',
        description: team.description || '',
        logoUrl: team.logoUrl || '',
        members: team.members?.map(m => m._id || m) || []
      })
      setLogoPreview(team.logoUrl || null)
    } else {
      setEditingTeam(null)
      setTeamForm({ teamName: '', description: '', logoUrl: '', members: [] })
      setLogoPreview(null)
    }
    setShowTeamModal(true)
  }

  const handleCloseTeamModal = () => {
    setShowTeamModal(false)
    setEditingTeam(null)
    setTeamForm({ teamName: '', description: '', logoUrl: '', members: [] })
    setLogoPreview(null)
    setShowAgentDropdown(false)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB')
        return
      }
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
      if (!validTypes.includes(file.type)) {
        setError('Logo must be PNG, JPG, JPEG, or GIF format')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
        setTeamForm({ ...teamForm, logoUrl: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTeamSubmit = async (e) => {
    e.preventDefault()
    if (!teamForm.teamName.trim()) {
      setError('Team name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingTeam) {
        await api.put(`/${companyId}/teams/${editingTeam._id}`, teamForm)
        setSuccess('Team updated successfully')
      } else {
        await api.post(`/${companyId}/teams`, teamForm)
        setSuccess('Team created successfully')
      }
      handleCloseTeamModal()
      fetchTeams()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save team')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (team) => {
    if (!confirm(`Are you sure you want to delete "${team.teamName}"?`)) return

    try {
      await api.delete(`/${companyId}/teams/${team._id}`)
      setSuccess('Team deleted successfully')
      fetchTeams()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team')
    }
  }

  const toggleAgentInTeam = (agentId) => {
    setTeamForm(prev => ({
      ...prev,
      members: prev.members.includes(agentId)
        ? prev.members.filter(id => id !== agentId)
        : [...prev.members, agentId]
    }))
  }

  const allowedRoles = ['admin', 'company_admin', 'department_admin']
  if (!allowedRoles.includes(user?.role)) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-sm">You don't have permission to manage users</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users and teams</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex justify-between">
          {error}
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'teams'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Teams
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Actions */}
          {companyId && (
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => navigate(`/companies/${companyId}/users/bulk-upload`)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={() => navigate(`/companies/${companyId}/users/agents/new`)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Agent</span>
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field w-auto"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="company_admin">Company Admin</option>
                <option value="agent">Agent</option>
                <option value="requester">Requester</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {u.avatar ? (
                            <img
                              src={u.avatar.startsWith('http') ? u.avatar : `${import.meta.env.VITE_API_URL}${u.avatar}`}
                              alt={u.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">{u.fullName?.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.fullName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={getRoleBadge(u.role)}>{u.role}</span></td>
                      <td className="px-6 py-4">
                        <span className={`status-badge ${u.isActive ? 'status-open' : 'status-closed'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-primary-600 hover:text-primary-700 p-1"><Edit className="h-4 w-4" /></button>
                          {u._id !== user._id && checkPermission(PERMISSIONS.TCKT_DELETE_SOFT) && (
                            <button className="text-red-600 hover:text-red-700 p-1"><Trash2 className="h-4 w-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => handleOpenTeamModal()} className="btn-primary flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>New Team</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamsLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : teams.length > 0 ? (
              teams.map(team => (
                <div key={team._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.teamName} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{team.teamName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{team.members?.length || 0} members</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleOpenTeamModal(team)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteTeam(team)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {team.description && (
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{team.description}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No teams created yet</p>
                <button onClick={() => handleOpenTeamModal()} className="mt-4 text-primary-600 hover:text-primary-700">
                  Create your first team
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingTeam ? 'Edit Team' : 'New Team'}
              </h2>
              <button onClick={handleCloseTeamModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Team Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enter team name, logo, description and add members to the team.</p>
            </div>

            <form onSubmit={handleTeamSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center space-x-4">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-lg object-cover border" />
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-600 inline-block">
                      Upload
                    </span>
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif" onChange={handleLogoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only JPG, PNG, or GIF. Max 2MB.</p>
                </div>
              </div>

              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-1">Team Name *</label>
                <input
                  type="text"
                  value={teamForm.teamName}
                  onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })}
                  placeholder="-- Name --"
                  className="input-field"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  placeholder="-- Description --"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Agent Selection - Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select the agents, teams, roles, and roles & subordinates to include in this team
                </label>
                <div className="relative">
                  <div
                    className="input-field min-h-[42px] flex flex-wrap gap-2 cursor-pointer"
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                  >
                    {teamForm.members.length > 0 ? (
                      teamForm.members.map(memberId => {
                        const agent = agents.find(a => a._id === memberId)
                        return agent ? (
                          <span key={memberId} className="inline-flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-sm">
                            {agent.fullName}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleAgentInTeam(memberId) }}
                              className="ml-1 hover:text-primary-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ) : null
                      })
                    ) : (
                      <span className="text-gray-400">Choose Agents</span>
                    )}
                  </div>

                  {showAgentDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {agents.length > 0 ? agents.map(agent => (
                        <div
                          key={agent._id}
                          onClick={() => toggleAgentInTeam(agent._id)}
                          className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 border-gray-100 dark:border-gray-700 ${teamForm.members.includes(agent._id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={teamForm.members.includes(agent._id)}
                            onChange={() => { }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{agent.fullName}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{agent.email}</span>
                          </div>
                        </div>
                      )) : (
                        <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No agents available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Points To Remember</p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                  <li>Only agents from this company will be shown for selection.</li>
                  <li>When an agent is added/removed, the change will reflect in the team as well.</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={handleCloseTeamModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement