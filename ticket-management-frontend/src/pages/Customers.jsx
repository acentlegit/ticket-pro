import { useState, useEffect } from 'react'
import { Plus, Search, User, Building2, Mail, Phone, Edit, X } from 'lucide-react'
import api from '../services/api'

const Customers = () => {
  const [activeTab, setActiveTab] = useState('contacts')
  const [contacts, setContacts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [users, setUsers] = useState([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchData()
    fetchUsers()
  }, [])

  const fetchData = async () => {
    try {
      const companyId = localStorage.getItem('companyId')
      const [contactsRes, accountsRes] = await Promise.all([
        api.get(`${companyId}/contacts`),
        api.get(`${companyId}/accounts`)
      ])
      setContacts(contactsRes.data.contacts || [])
      setAccounts(accountsRes.data.accounts || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
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

  const filteredContacts = contacts.filter(contact =>
    contact.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAccounts = accounts.filter(account =>
    account.accountName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (item) => {
    setIsCreating(false)
    setEditingItem(item)
    if (activeTab === 'contacts') {
      setFormData({
        firstName: item.firstName || '',
        lastName: item.lastName || '',
        email: item.email || '',
        secondaryEmail: item.secondaryEmail || '',
        accountId: item.accountId?._id || '',
        contactOwner: item.contactOwner?._id || item.contactOwner || '',
        phone: item.phoneNumber || '',
        mobile: item.mobileNumber || '',
        type: item.type || '',
        title: item.title || '',
        language: item.language || ''
      })
    } else {
      setFormData({
        accountName: item.accountName || '',
        email: item.email || '',
        phone: item.phone || '',
        website: item.website || item.domain || '',
        country: item.country || '',
        accountOwner: item.accountOwner || ''
      })
    }
    setShowModal(true)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingItem(null)
    if (activeTab === 'contacts') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        secondaryEmail: '',
        accountId: '',
        contactOwner: '',
        phone: '',
        mobile: '',
        type: '',
        title: '',
        language: ''
      })
    } else {
      setFormData({
        accountName: '',
        email: '',
        phone: '',
        website: '',
        country: '',
        accountOwner: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const companyId = localStorage.getItem('companyId')
      if (activeTab === 'contacts') {
        if (isCreating) {
          await api.post(`/${companyId}/contacts`, formData)
        } else {
          await api.put(`/${companyId}/contacts/${editingItem._id}`, formData)
        }
      } else {
        if (isCreating) {
          await api.post(`/${companyId}/accounts`, formData)
        } else {
          await api.put(`/${companyId}/accounts/${editingItem._id}`, formData)
        }
      }
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save:', error)
    }
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
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">Customers</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">Manage your contacts and accounts</p>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-40 md:w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            <button onClick={handleCreate} className="btn-primary flex items-center space-x-1 md:space-x-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add {activeTab === 'contacts' ? 'Contact' : 'Account'}</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-4 md:px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'contacts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Contacts</span>
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                  {contacts.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'accounts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Accounts</span>
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                  {accounts.length}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {activeTab === 'contacts' ? (
          <div className="bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <tr key={contact._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {contact.firstName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {contact.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {contact.phoneNumber || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {contact.accountId?.accountName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contact.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
                            }`}>
                            {contact.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEdit(contact)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No contacts found</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Get started by creating a new contact.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account) => (
                      <tr key={account._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {account.accountName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {account.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {account.website ? (
                            <a
                              href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              {account.website}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
                            }`}>
                            {account.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEdit(account)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No accounts found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          {searchTerm ? 'Try adjusting your search' : 'Get started by adding an account'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isCreating ? 'Create' : 'Edit'} {activeTab === 'contacts' ? 'Contact' : 'Account'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6">
              {activeTab === 'contacts' ? (
                <div className="space-y-4 md:space-y-6">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">Contact Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                      <input name="firstName" value={formData.firstName || ''} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Last Name <span className="text-red-500">*</span></label>
                      <input name="lastName" value={formData.lastName || ''} onChange={handleChange} required className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Secondary Email</label>
                      <input type="email" name="secondaryEmail" value={formData.secondaryEmail || ''} onChange={handleChange} className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                      <select name="accountId" value={formData.accountId || ''} onChange={handleChange} className="input-field">
                        <option value="">Select Account</option>
                        {accounts.map(acc => <option key={acc._id} value={acc._id}>{acc.accountName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Contact Owner</label>
                      <select name="contactOwner" value={formData.contactOwner || ''} onChange={handleChange} className="input-field">
                        <option value="">Select Owner</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <input name="phone" value={formData.phone || ''} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                      <input name="mobile" value={formData.mobile || ''} onChange={handleChange} className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Type</label>
                      <select name="type" value={formData.type || ''} onChange={handleChange} className="input-field">
                        <option value="">-None-</option>
                        <option value="Paid User">Paid User</option>
                        <option value="Prospect">Prospect</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Title</label>
                      <input name="title" value={formData.title || ''} onChange={handleChange} className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Language</label>
                      <select name="language" value={formData.language || ''} onChange={handleChange} className="input-field">
                        <option value="">-None-</option>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">Account Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Account Name <span className="text-red-500">*</span></label>
                      <input name="accountName" value={formData.accountName || ''} onChange={handleChange} required className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <input name="phone" value={formData.phone || ''} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Website</label>
                      <input name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://www.example.com" className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Country</label>
                      <input name="country" value={formData.country || ''} onChange={handleChange} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Account Owner</label>
                      <select name="accountOwner" value={formData.accountOwner || ''} onChange={handleChange} className="input-field">
                        <option value="">Select Owner</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.fullName}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
