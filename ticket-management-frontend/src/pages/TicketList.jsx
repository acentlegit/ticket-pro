import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Eye,
  Ticket,
  Filter,
  Settings,
  MoreVertical,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Mail,
  MailOpen,
  Upload
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const TicketList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { companyId } = useParams()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [hoveredTicket, setHoveredTicket] = useState(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTickets, setTotalTickets] = useState(0)
  const [limit] = useState(10) // Tickets per page

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1) // Reset to page 1 on search or filter change
      fetchTickets(1)
    }, 300) // Debounce search/filter changes
    return () => clearTimeout(timer)
  }, [searchTerm, activeView, selectedCategory])

  useEffect(() => {
    fetchTickets(page)
  }, [page])

  const fetchTickets = async (currentPage) => {
    setLoading(true)
    try {
      const companyId = localStorage.getItem('companyId')
      const response = await api.get(`/${companyId}/tickets`, {
        params: {
          page: currentPage,
          limit,
          status: activeView,
          priority: selectedCategory,
          search: searchTerm
        }
      })
      setTickets(response.data.tickets || [])
      setTotalTickets(response.data.pagination.total)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: 'all', name: 'All Tickets' },
    { id: 'open', name: 'Open' },
    { id: 'in-progress', name: 'In Progress' },
    { id: 'resolved', name: 'Resolved' },
    { id: 'closed', name: 'Closed' },
  ]

  const priorityCategories = [
    { id: 'urgent', name: 'Urgent', color: 'text-red-600' },
    { id: 'high', name: 'High Priority', color: 'text-orange-600' },
    { id: 'medium', name: 'Medium Priority', color: 'text-blue-600' },
    { id: 'low', name: 'Low Priority', color: 'text-gray-600' },
  ]

  // Filtering is now handled on the server
  const displayTickets = tickets

  const getStatusIcon = (status) => {
    const icons = {
      open: <AlertCircle className="h-4 w-4 text-blue-500" />,
      'in-progress': <Clock className="h-4 w-4 text-yellow-500" />,
      resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
      closed: <XCircle className="h-4 w-4 text-gray-500" />
    }
    return icons[status] || <AlertCircle className="h-4 w-4 text-gray-500" />
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600 bg-red-50 border-red-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      medium: 'text-blue-600 bg-blue-50 border-blue-200',
      low: 'text-gray-600 bg-gray-50 border-gray-200'
    }
    return colors[priority] || colors.medium
  }

  const handleMarkAsRead = async (ticketId, e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await api.patch(`/${companyId}/tickets/${ticketId}`, { isRead: true })
      // Update local state
      setTickets(tickets.map(t =>
        t._id === ticketId ? { ...t, isRead: true } : t
      ))
    } catch (error) {
      console.error('Failed to mark ticket as read:', error)
    }
  }

  const handleEdit = (ticketId, e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/companies/${companyId}/tickets/${ticketId}/edit`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Tickets ({totalTickets})
            </h1>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Filter className="h-4 w-4" />
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Total Count</button>
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Table View</button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 w-64"
              />
            </div>
            <Link
              to={`/companies/${companyId}/tickets/bulk-upload`}
              className="btn btn-md btn-success"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span>Bulk Upload</span>
            </Link>
            <Link
              to={`/companies/${companyId}/tickets/new`}
              className="btn-primary btn-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Ticket</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center space-x-4">
          <select
            value={activeView}
            onChange={(e) => setActiveView(e.target.value)}
            className="input-field w-40 py-1"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-40 py-1"
          >
            <option value="all">All Priority</option>
            {priorityCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ticket ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer Responded Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {displayTickets.length > 0 ? (
                displayTickets.map((ticket, index) => (
                  <tr
                    key={ticket._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 relative group"
                    onMouseEnter={() => setHoveredTicket(ticket._id)}
                    onMouseLeave={() => setHoveredTicket(null)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/companies/${companyId}/tickets/${ticket._id}`}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                        style={{
                          backgroundColor: `#${ticket._id?.slice(-6)}15`,
                          color: `#${ticket._id?.slice(-6)}`,
                          borderColor: `#${ticket._id?.slice(-6)}30`
                        }}
                      >
                        #{(ticket._id?.slice(-6) || `${100 + index}`).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <Link
                          to={`/companies/${companyId}/tickets/${ticket._id}`}
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 max-w-xs truncate"
                        >
                          {ticket.subject}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {ticket.contactId?.firstName || ticket.createdBy?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {ticket.accountId?.accountName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {ticket.customerRespondedTime
                        ? new Date(ticket.customerRespondedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.dueDate ? (
                        <span className={`${new Date(ticket.dueDate) < new Date() ? 'text-red-600' : 'text-gray-500'
                          }`}>
                          {new Date(ticket.dueDate).toLocaleDateString()} {new Date(ticket.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative">
                      <span className={`status-badge status-${ticket.status}`}>
                        {ticket.status === 'in-progress' ? 'In Progress' :
                          ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>

                      {/* Hover Actions */}
                      {hoveredTicket === ticket._id && (
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 z-10">
                          <button
                            onClick={(e) => handleMarkAsRead(ticket._id, e)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Mark as Read"
                          >
                            <MailOpen className="h-4 w-4" />
                            <span>Mark as Read</span>
                          </button>
                          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                          <button
                            onClick={(e) => handleEdit(ticket._id, e)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
                            title="Edit Ticket"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium">No tickets found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalTickets)}</span> of{' '}
                <span className="font-medium">{totalTickets}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  &lt;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === i + 1
                        ? 'z-10 bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                  >
                    {i + 1}
                  </button>
                )).filter((_, i) => {
                  if (totalPages <= 7) return true;
                  return i + 1 === 1 || i + 1 === totalPages || Math.abs(i + 1 - page) <= 1;
                })}
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  &gt;
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketList