import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  Save,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  
  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  })

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`)
      setTicket(response.data.ticket)
      setEditForm({
        status: response.data.ticket.status,
        priority: response.data.ticket.priority,
        assignedTo: response.data.ticket.assignedTo?._id || ''
      })
    } catch (error) {
      setError('Failed to fetch ticket details')
      console.error('Failed to fetch ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const response = await api.put(`/tickets/${id}`, editForm)
      setTicket(response.data.ticket)
      setEditing(false)
      setError('')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update ticket')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: 'status-badge status-open',
      'in-progress': 'status-badge status-in-progress',
      resolved: 'status-badge status-resolved',
      closed: 'status-badge status-closed'
    }
    return badges[status] || 'status-badge'
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'status-badge priority-low',
      medium: 'status-badge priority-medium',
      high: 'status-badge priority-high',
      urgent: 'status-badge priority-urgent'
    }
    return badges[priority] || 'status-badge'
  }

  const canEdit = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'agent'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary"
        >
          Back to Tickets
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ticket Details</h1>
            <p className="text-gray-600 dark:text-gray-400">#{ticket?._id?.slice(-8)}</p>
          </div>
        </div>
        
        {canEdit && (
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary flex items-center space-x-2"
          >
            {editing ? <X className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            <span>{editing ? 'Cancel' : 'Edit'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {ticket?.subject}
            </h2>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket?.description}
              </p>
            </div>

            {ticket?.category && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Category: </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {ticket.category}
                </span>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
            </div>
            
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No comments yet</p>
              <p className="text-sm">Comments and updates will appear here</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Status & Priority</h3>
            
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="input-field"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <button
                  onClick={handleUpdate}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={getStatusBadge(ticket?.status)}>
                    {ticket?.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                  <span className={getPriorityBadge(ticket?.priority)}>
                    {ticket?.priority}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created by</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ticket?.createdBy?.name || 'Unknown'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ticket?.assignedTo?.name || 'Unassigned'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(ticket?.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {ticket?.updatedAt !== ticket?.createdAt && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last updated</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(ticket?.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetail