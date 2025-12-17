import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, User, Building2, Phone, Mail, Upload, Search, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const EditTicket = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetchingTicket, setFetchingTicket] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [products, setProducts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [contacts, setContacts] = useState([])
  const [showContactModal, setShowContactModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const [accountSearchTerm, setAccountSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    contactName: '',
    accountName: '',
    email: '',
    phone: '',
    subject: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    channel: 'web',
    classification: '',
    language: 'English',
    status: 'open',
    assignedAgentId: '',
    departmentId: '',
    productId: ''
  })

  useEffect(() => {
    if (id) {
      fetchTicketData()
      fetchUsers()
      fetchDepartments()
      fetchProducts()
      fetchAccounts()
      fetchContacts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchTicketData = async () => {
    try {
      console.log('Fetching ticket with ID:', id)
      const response = await api.get(`/tickets/${id}`)
      console.log('API Response:', response.data)
      const ticket = response.data.ticket
      console.log('Ticket data:', ticket)

      // Format datetime-local value
      const formatDateTimeLocal = (date) => {
        if (!date) return ''
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      const newFormData = {
        contactName: ticket.contactId?.firstName || '',
        accountName: ticket.accountId?.accountName || '',
        email: ticket.contactId?.email || '',
        phone: ticket.contactId?.phoneNumber || '',
        subject: ticket.subject || '',
        description: ticket.description || '',
        dueDate: formatDateTimeLocal(ticket.dueDate),
        priority: ticket.priority || 'medium',
        channel: ticket.channel || 'web',
        classification: ticket.classification || '',
        language: ticket.language || 'English',
        status: ticket.status || 'open',
        assignedAgentId: ticket.assignedAgentId?._id || ticket.assignedAgentId || '',
        departmentId: ticket.departmentId || '',
        productId: ticket.productId || ''
      }

      console.log('Setting form data:', newFormData)
      setFormData(newFormData)
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
      console.error('Error details:', error.response?.data)
      setError('Failed to load ticket data: ' + (error.response?.data?.message || error.message))
    } finally {
      setFetchingTicket(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users')
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      const response = await api.get(`/${companyId}/departments`)
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      const response = await api.get(`/${companyId}/products`)
      setProducts(response.data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchAccounts = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      const response = await api.get(`/${companyId}/accounts`)
      setAccounts(response.data.accounts || [])
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    }
  }

  const fetchContacts = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      const response = await api.get(`/${companyId}/contacts`)
      setContacts(response.data.contacts || [])
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const companyId = localStorage.getItem('companyId')
      const ticketData = {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
        channel: formData.channel,
        status: formData.status,
        classification: formData.classification,
        language: formData.language,
        dueDate: formData.dueDate || null,
        departmentId: formData.departmentId || null,
        productId: formData.productId || null,
        assignedAgentId: formData.assignedAgentId || null,
        contactName: formData.contactName,
        accountNameOrId: formData.accountName,
        email: formData.email,
        phone: formData.phone
      }

      await api.patch(`/${companyId}/tickets/${id}`, ticketData)
      navigate(`/companies/${companyId}/tickets/${id}`)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update ticket')
    } finally {
      setLoading(false)
    }
  }

  if (fetchingTicket) {
    return (
      <div className="flex items-center justify-center h-screen">
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
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Ticket</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Form */}
        <div className="flex-1 p-6">
          <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Contact Information Section */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      className="input-field pr-16"
                      placeholder="Enter contact name"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowContactModal(true)}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleChange}
                      className="input-field pr-10"
                      placeholder="Enter account name"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountModal(true)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field pr-10"
                      placeholder="Enter email address"
                      required
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field pr-10"
                      placeholder="Enter phone number"
                    />
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Subject */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter ticket subject"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Describe the issue in detail"
                    required
                  />
                </div>

                {/* Ticket Owner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ticket Owner
                  </label>
                  <div className="relative">
                    <select
                      name="assignedAgentId"
                      value={formData.assignedAgentId}
                      onChange={handleChange}
                      className="input-field pr-10"
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.fullName || user.email}
                        </option>
                      ))}
                    </select>
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product
                  </label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.productName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Additional Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Channel
                  </label>
                  <select
                    name="channel"
                    value={formData.channel}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="web">Web</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="chat">Chat</option>
                    <option value="social">Social</option>
                  </select>
                </div>

                {/* Classification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Classification
                  </label>
                  <select
                    name="classification"
                    value={formData.classification}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select Classification</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing</option>
                    <option value="account">Account</option>
                    <option value="feature-request">Feature Request</option>
                    <option value="bug-report">Bug Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            {/* Contact Information Card */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Information</h3>
              {formData.contactName ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{formData.contactName}</h4>
                      <p className="text-xs text-gray-500">{formData.email}</p>
                    </div>
                  </div>
                  {formData.phone && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{formData.phone}</span>
                    </div>
                  )}
                  {formData.accountName && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{formData.accountName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                  <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No Contact Information</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Selection Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Contact</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={contactSearchTerm}
                  onChange={(e) => setContactSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {contacts.filter(contact =>
                contact.firstName?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
                contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase())
              ).length > 0 ? (
                <div className="space-y-2">
                  {contacts.filter(contact =>
                    contact.firstName?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
                    contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase())
                  ).map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          contactName: contact.firstName || '',
                          email: contact.email || '',
                          phone: contact.phoneNumber || '',
                          accountName: contact.accountId?.accountName || ''
                        }))
                        setShowContactModal(false)
                      }}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{contact.firstName}</h4>
                          <p className="text-xs text-gray-500">{contact.email}</p>
                          {contact.accountId && (
                            <p className="text-xs text-gray-400">{contact.accountId.accountName}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No contacts found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Selection Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Account</h3>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={accountSearchTerm}
                  onChange={(e) => setAccountSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {accounts.filter(account =>
                account.accountName?.toLowerCase().includes(accountSearchTerm.toLowerCase())
              ).length > 0 ? (
                <div className="space-y-2">
                  {accounts.filter(account =>
                    account.accountName?.toLowerCase().includes(accountSearchTerm.toLowerCase())
                  ).map((account) => (
                    <button
                      key={account._id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          accountName: account.accountName
                        }))
                        setShowAccountModal(false)
                      }}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{account.accountName}</h4>
                          <p className="text-xs text-gray-500">{account.industry || 'No industry specified'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No accounts found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditTicket
