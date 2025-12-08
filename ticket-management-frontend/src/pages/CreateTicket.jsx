import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, X, Upload, User, Building2, Phone, Mail, Search, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const CreateTicket = () => {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState([])
  const [contacts, setContacts] = useState([])
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [products, setProducts] = useState([])
  const [showContactModal, setShowContactModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const [accountSearchTerm, setAccountSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    // Contact Information
    contactName: '',
    accountName: '',
    email: '',
    phone: '',
    subject: '',
    description: '',
    ticketOwner: '',
    productName: '',
    
    // Additional Information
    dueDate: '',
    priority: 'medium',
    channel: 'web',
    classification: '',
    language: 'English',
    departmentId: '',
    productId: '',
    attachments: [],
    
    // Internal fields
    contactId: '',
    accountId: '',
    assignedAgentId: '',
    teamId: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      // Fetch accounts, contacts, teams, and users for dropdowns
      const [accountsRes, contactsRes, teamsRes, usersRes, departmentsRes, productsRes] = await Promise.all([
        api.get(`/${companyId}/accounts`).catch(() => ({ data: { accounts: [] } })),
        api.get(`/${companyId}/contacts`).catch(() => ({ data: { contacts: [] } })),
        api.get(`/${companyId}/teams`).catch(() => ({ data: { teams: [] } })),
        api.get('/auth/users').catch(() => ({ data: { users: [] } })),
        api.get(`/${companyId}/departments`).catch(() => ({ data: { departments: [] } })),
        api.get(`/${companyId}/products`).catch(() => ({ data: { products: [] } }))
      ])
      
      setAccounts(accountsRes.data.accounts || [])
      setContacts(contactsRes.data.contacts || [])
      setTeams(teamsRes.data.teams || [])
      setUsers(usersRes.data.users || [])
      setDepartments(departmentsRes.data.departments || [])
      setProducts(productsRes.data.products || [])
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Auto-populate contact info when account is selected
    if (name === 'accountId') {
      const selectedAccount = accounts.find(acc => acc._id === value)
      if (selectedAccount) {
        setFormData(prev => ({
          ...prev,
          accountName: selectedAccount.accountName
        }))
      }
    }
  }

  const handleContactSelect = (contact) => {
    setFormData(prev => ({
      ...prev,
      contactId: contact._id || '',
      contactName: contact.firstName || contact.fullName || '',
      email: contact.email || '',
      phone: contact.phoneNumber || '',
      accountId: contact.accountId || '',
      accountName: contact.accountId?.accountName || ''
    }))
    setShowContactModal(false)
  }

  const handleAccountSelect = (account) => {
    setFormData(prev => ({
      ...prev,
      accountId: account._id,
      accountName: account.accountName
    }))
    setShowAccountModal(false)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.firstName.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase())
  )

  const filteredAccounts = accounts.filter(account =>
    account.accountName.toLowerCase().includes(accountSearchTerm.toLowerCase())
  )

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
        dueDate: formData.dueDate || null,
        language: formData.language,
        classification: formData.classification,
        departmentId:formData.departmentId,
        assignedAgentId: formData.assignedAgentId || null,
        teamId: formData.teamId || null,
        productId: formData.productId || null,
        contactName: formData.contactName,
        accountNameOrId: formData.accountId || formData.accountName,
        email: formData.email,
        phone: formData.phone,
        attachments: formData.attachments
      }
      
      const response = await api.post(`/${companyId}/tickets`, ticketData)
      navigate(`/companies/${companyId}/tickets/${response.data.ticket._id}`)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900"> Add Ticket</h1>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Ticket Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Department */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    {departments.length === 0 && (
                      <button
                        type="button"
                        onClick={() => navigate(`/companies/${companyId}/departments`)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Add Department"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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
                {/* Contact Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

                {/* Contact Information Selection */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span>
                        {formData.contactId ? 
                          contacts.find(c => c._id === formData.contactId)?.fullName || 'Select from contacts' 
                          : 'Select from contacts'
                        }
                      </span>
                    </span>
                    <User className="h-4 w-4 text-gray-400" />
                  </button>
                </div> */}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

               

                {/* Product */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Product
                    </label>
                    {products.length === 0 && (
                      <button
                        type="button"
                        onClick={() => navigate(`/companies/${companyId}/products`)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Add Product"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Additional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

            {/* Attachment Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="h-5 w-5 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-900">Attach Files (Optional)</h3>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Drop files here or click to browse</p>
                <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFormData(prev => ({...prev, attachments: Array.from(e.target.files)}))}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                    Choose Files
                  </span>
                </label>
              </div>
              {formData.attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                  <ul className="space-y-1">
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center justify-between">
                        <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== index)
                          }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                <span>{loading ? 'Creating...' : 'Create Ticket'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            {/* Contact Information Card */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
              {formData.contactId ? (
                <div className="bg-gray-50 rounded-lg p-4">
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
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="mt-3 w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Change Contact
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No Contact Chosen</p>
                  <p className="text-xs text-gray-500 mb-3">
                    Details about the selected contact will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="px-3 py-2 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Select Contact
                  </button>
                </div>
              )}
            </div>

            {/* Workflow Document */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Workflow Document</h3>
              <div className="text-xs text-gray-600">
                <p>No workflow document available for this ticket type.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Selection Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Select Contact</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search */}
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
              {filteredContacts.length > 0 ? (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => handleContactSelect(contact)}
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
                  <p className="text-sm text-gray-400 mt-1">
                    {contactSearchTerm ? 'Try adjusting your search terms' : 'No contacts available'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
                </p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Selection Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Select Account</h3>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search */}
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
              {filteredAccounts.length > 0 ? (
                <div className="space-y-2">
                  {filteredAccounts.map((account) => (
                    <button
                      key={account._id}
                      onClick={() => handleAccountSelect(account)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{account.accountName}</h4>
                          <p className="text-xs text-gray-500">{account.industry || 'No industry specified'}</p>
                          {account.domain && (
                            <p className="text-xs text-gray-400">{account.domain}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No accounts found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {accountSearchTerm ? 'Try adjusting your search terms' : 'No accounts available'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''} found
                </p>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateTicket