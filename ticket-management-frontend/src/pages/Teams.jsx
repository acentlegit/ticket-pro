import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, Users, Search, X, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Teams = () => {
    const { companyId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [search, setSearch] = useState('')

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingTeam, setEditingTeam] = useState(null)
    const [formData, setFormData] = useState({
        teamName: '',
        description: ''
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchTeams()
    }, [companyId])

    const fetchTeams = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/${companyId}/teams`)
            setTeams(response.data.teams || [])
        } catch (err) {
            setError('Failed to fetch teams')
            console.error('Fetch teams error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (team = null) => {
        if (team) {
            setEditingTeam(team)
            setFormData({
                teamName: team.teamName || '',
                description: team.description || ''
            })
        } else {
            setEditingTeam(null)
            setFormData({ teamName: '', description: '' })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingTeam(null)
        setFormData({ teamName: '', description: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.teamName.trim()) {
            setError('Team name is required')
            return
        }

        setSaving(true)
        setError('')

        try {
            if (editingTeam) {
                await api.put(`/${companyId}/teams/${editingTeam._id}`, formData)
                setSuccess('Team updated successfully')
            } else {
                await api.post(`/${companyId}/teams`, formData)
                setSuccess('Team created successfully')
            }
            handleCloseModal()
            fetchTeams()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save team')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (team) => {
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

    const filteredTeams = teams.filter(team =>
        team.teamName?.toLowerCase().includes(search.toLowerCase()) ||
        team.description?.toLowerCase().includes(search.toLowerCase())
    )

    const canManage = ['admin', 'company_admin', 'department_admin'].includes(user?.role)

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
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/companies/${companyId}/settings`)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teams</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manage your organization's teams</p>
                    </div>
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add Team</span>
                    </button>
                )}
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                    {error}
                    <button onClick={() => setError('')} className="float-right">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search teams..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-10"
                />
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.length > 0 ? (
                    filteredTeams.map(team => (
                        <div key={team._id} className="card hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                                        <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{team.teamName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{team.members?.length || 0} members</p>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => handleOpenModal(team)}
                                            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(team)}
                                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {team.description && (
                                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{team.description}</p>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No teams found</p>
                        {canManage && (
                            <button onClick={() => handleOpenModal()} className="mt-4 text-primary-600 hover:text-primary-700">
                                Create your first team
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {editingTeam ? 'Edit Team' : 'Create Team'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Team Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.teamName}
                                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                    placeholder="Enter team name"
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter team description"
                                    rows={3}
                                    className="input-field resize-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary"
                                >
                                    {saving ? 'Saving...' : editingTeam ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Teams
