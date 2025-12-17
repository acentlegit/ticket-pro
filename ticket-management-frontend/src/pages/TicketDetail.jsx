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
  X,
  Paperclip,
  Send,
  File
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS } from '../config/permissions'
import api from '../services/api'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, checkPermission } = useAuth()
  const { companyId } = useParams()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [slaRules, setSlaRules] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [attachments, setAttachments] = useState([])
  const [submittingComment, setSubmittingComment] = useState(false)
  const [actionLoading, setActionLoading] = useState('')

  const [editForm, setEditForm] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await fetchTicket()
        await fetchSlaRules()
        await fetchComments()
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
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
      throw error
    }
  }

  const fetchSlaRules = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      if (companyId) {
        const res = await api.get(`/${companyId}/sla-rules`)
        setSlaRules(res.data.slaRules || [])
      }
    } catch (error) {
      console.error('Failed to fetch SLA rules:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      if (companyId) {
        const res = await api.get(`/${companyId}/tickets/${id}/comments`)
        setComments(res.data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim() && attachments.length === 0) return

    setSubmittingComment(true)
    try {
      const companyId = localStorage.getItem('companyId')
      const formData = new FormData()
      formData.append('commentText', newComment)
      formData.append('isInternal', 'false') // Default to public for now

      attachments.forEach(file => {
        formData.append('attachments', file)
      })

      await api.post(`/${companyId}/tickets/${id}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setNewComment('')
      setAttachments([])
      await fetchComments()
    } catch (error) {
      console.error('Failed to post comment:', error)
      setError('Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      if (companyId) {
        const payload = { ...editForm }
        // Remove assignedTo if it is an empty string to avoid backend errors
        if (!payload.assignedTo) {
          delete payload.assignedTo
        }

        await api.put(`/${companyId}/tickets/${id}`, payload)
        setEditing(false)
        fetchTicket() // Re-fetch ticket to update UI
      }
    } catch (error) {
      setError('Failed to update ticket')
      console.error('Failed to update ticket:', error)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files)])
    }
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: 'status-badge status-open',
      'in-progress': 'status-badge status-in-progress',
      pending: 'status-badge status-pending',
      resolved: 'status-badge status-resolved',
      closed: 'status-badge status-closed',
      escalated: 'status-badge status-escalated',
      reopened: 'status-badge status-reopened'
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

  const canEdit = user?.role === 'admin' || user?.role === 'company_admin' || user?.role === 'agent'
  const canClose = checkPermission(PERMISSIONS.TCKT_CLOSE) && ticket?.status !== 'closed'
  const canReopen = checkPermission(PERMISSIONS.TCKT_REOPEN) && ['closed', 'resolved'].includes(ticket?.status)
  const canEscalate = checkPermission(PERMISSIONS.TCKT_ESCALATE) && ticket?.status !== 'escalated'
  const canSoftDelete = checkPermission(PERMISSIONS.TCKT_DELETE_SOFT)
  const canHardDelete = checkPermission(PERMISSIONS.TCKT_DELETE_HARD)
  const canExport = checkPermission(PERMISSIONS.EXPORT_DATA)

  const handleCloseTicket = async () => {
    if (!confirm('Are you sure you want to close this ticket?')) return
    setActionLoading('close')
    try {
      await api.patch(`/${companyId}/tickets/${id}/close`)
      await fetchTicket()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close ticket')
    } finally {
      setActionLoading('')
    }
  }

  const handleReopenTicket = async () => {
    setActionLoading('reopen')
    try {
      await api.patch(`/${companyId}/tickets/${id}/reopen`)
      await fetchTicket()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reopen ticket')
    } finally {
      setActionLoading('')
    }
  }

  const handleEscalateTicket = async () => {
    const reason = prompt('Enter escalation reason (optional):')
    setActionLoading('escalate')
    try {
      await api.patch(`/${companyId}/tickets/${id}/escalate`, { reason })
      await fetchTicket()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to escalate ticket')
    } finally {
      setActionLoading('')
    }
  }

  const handleDeleteTicket = async (hard) => {
    const confirmMsg = hard
      ? 'PERMANENTLY delete this ticket? This cannot be undone!'
      : 'Soft-delete this ticket? It can be recovered later.'
    if (!confirm(confirmMsg)) return
    setActionLoading(hard ? 'hard-delete' : 'soft-delete')
    try {
      const endpoint = hard ? 'hard-delete' : 'soft-delete'
      await api.delete(`/${companyId}/tickets/${id}/${endpoint}`)
      navigate(`/companies/${companyId}/tickets`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ticket')
      setActionLoading('')
    }
  }

  const getAttachmentUrl = (file) => {
    if (!file.filePath) return '#'
    const filename = file.filePath.split(/[/\\]/).pop()
    return `${import.meta.env.VITE_API_URL}/uploads/tickets/${filename}`
  }

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
            <div className="mt-1">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border"
                style={{
                  backgroundColor: `#${ticket?._id?.slice(-6)}15`,
                  color: `#${ticket?._id?.slice(-6)}`,
                  borderColor: `#${ticket?._id?.slice(-6)}30`
                }}
              >
                #{ticket?._id?.slice(-8)}
              </span>
            </div>
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

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {canSoftDelete && (
            <button
              onClick={() => handleDeleteTicket(false)}
              disabled={actionLoading === 'soft-delete'}
              className="btn-secondary text-red-600 hover:text-red-700"
            >
              {actionLoading === 'soft-delete' ? '...' : 'Delete'}
            </button>
          )}
          {canHardDelete && (
            <button
              onClick={() => handleDeleteTicket(true)}
              disabled={actionLoading === 'hard-delete'}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              {actionLoading === 'hard-delete' ? '...' : 'Permanently Delete'}
            </button>
          )}
        </div>
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

            {ticket?.attachments && ticket.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Attachments</h4>
                <div className="flex flex-wrap gap-2">
                  {ticket.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                      <Paperclip className="h-4 w-4" />
                      <a href={getAttachmentUrl(file)} download target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {file.fileName}
                      </a>
                      <span className="text-gray-400 text-xs">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
            </div>

            {/* Comment List */}
            <div className="space-y-6 mb-8">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-4">
                    <div className="flex-shrink-0">
                      {comment.author?.avatar ? (
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.fullName}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {comment.author?.fullName || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.commentText}
                        </p>

                        {/* Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {comment.attachments.map((file, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                                <Paperclip className="h-4 w-4" />
                                <a href={getAttachmentUrl(file)} download target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {file.fileName}
                                </a>
                                <span className="text-gray-400 text-xs">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No comments yet</p>
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mt-6">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  rows={3}
                  className="input-field pr-12 resize-none"
                />
                <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="comment-file-upload"
                  />
                  <label
                    htmlFor="comment-file-upload"
                    className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Attach files"
                  >
                    <Paperclip className="h-5 w-5" />
                  </label>
                  <button
                    type="submit"
                    disabled={(!newComment.trim() && attachments.length === 0) || submittingComment}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Selected Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm">
                      <File className="h-3 w-3 mr-2 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300 max-w-xs truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="escalated">Escalated</option>
                    <option value="reopened">Reopened</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="input-field"
                  >
                    {['low', 'medium', 'high', 'urgent'].map(p => {
                      const rule = slaRules.find(r => r.priority === p);
                      const label = p.charAt(0).toUpperCase() + p.slice(1);
                      const info = rule ? ` (${rule.name})` : '';
                      return <option key={p} value={p}>{label}{info}</option>
                    })}
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