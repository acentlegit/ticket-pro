import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, UserPlus, Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const UserManagement = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { companyId } = useParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users')
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const companyId = localStorage.getItem('companyId')
      const userData = { ...newUser, companyId }
      const response = await api.post('/auth/register', userData)
      setUsers([...users, response.data.user])
      setShowCreateModal(false)
      setNewUser({ name: '', email: '', password: '', role: 'customer' })
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user')
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      supervisor: 'bg-purple-100 text-purple-800',
      agent: 'bg-blue-100 text-blue-800',
      customer: 'bg-gray-100 text-gray-800'
    }
    return `status-badge ${badges[role] || badges.customer}`
  }

  // Check if user has permission to manage users
  if (user?.role !== 'admin' && user?.role !== 'supervisor') {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
          <p className="text-gray-600 dark:text-gray-400">Manage system users and their roles</p>
        </div>
        <div className="flex items-center space-x-3">
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
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

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="agent">Agent</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {u.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {u.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getRoleBadge(u.role)}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${u.isActive ? 'status-open' : 'status-closed'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="text-primary-600 hover:text-primary-700 p-1">
                          <Edit className="h-4 w-4" />
                        </button>
                        {u._id !== user._id && (
                          <button className="text-red-600 hover:text-red-700 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New User</h3>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="input-field"
                >
                  <option value="customer">Customer</option>
                  <option value="agent">Agent</option>
                  <option value="supervisor">Supervisor</option>
                  {user?.role === 'admin' && <option value="admin">Admin</option>}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setError('')
                    setNewUser({ name: '', email: '', password: '', role: 'customer' })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create User
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