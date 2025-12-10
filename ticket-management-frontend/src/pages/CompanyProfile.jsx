import { useState, useEffect } from 'react'
import { ArrowLeft, Edit2, Save, X, Upload, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const CompanyProfile = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    companyName: '',

    description: '',
    website: '',
    employeeCount: '',
    primaryContact: '',
    currencyLocale: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    mobile: '',
    fax: '',
    logoUrl: ''
  })

  const [logoPreview, setLogoPreview] = useState(null)
  const [originalData, setOriginalData] = useState({})

  useEffect(() => {
    fetchCompanyProfile()
  }, [])

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true)
      const companyId = localStorage.getItem('companyId');
      const response = await api.get('/companies/'+companyId)
      if (response.data?.company) {
        const company = response.data.company
        const profileData = {
          companyName: company.companyName || '',

          description: company.description || '',
          website: company.website || '',
          employeeCount: company.employeeCount || '',
          primaryContact: company.primaryContact?.email || '',
          currencyLocale: company.currencyLocale || company.currencyCode||'',
          street: company.address?.street || '',
          city: company.address?.city || '',
          state: company.address?.state || '',
          zipCode: company.address?.zipCode || '',
          country: company.address?.country || '',
          phone: company.phone || company.address?.mobile || '',
          mobile: company.address?.mobile || '',
          fax: company.address?.fax || '',
          logoUrl: company.logoUrl || ''
        }
        setFormData(profileData)
        setOriginalData(profileData)
        setLogoPreview(company.logoUrl)
      }
    } catch (error) {
      console.error('Failed to fetch company profile:', error)
      setError('Failed to load company profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB')
        return
      }

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        setError('Logo must be PNG, JPG, or JPEG format')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
        setFormData(prev => ({
          ...prev,
          logoFile: file
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = () => {
    setIsEditMode(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setFormData(originalData)
    setLogoPreview(originalData.logoUrl)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const companyId = localStorage.getItem('companyId')
      const updateData = {
        companyName: formData.companyName,

        description: formData.description,
        website: formData.website,
        employeeCount: parseInt(formData.employeeCount) || 0,
        currencyLocale: formData.currencyLocale,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
          mobile: formData.mobile,
          fax: formData.fax
        }
      }

      const response = await api.put(`/companies/${companyId}`, updateData)

      setSuccess('Company profile updated successfully!')
      setOriginalData(formData)
      setIsEditMode(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update company profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !formData.companyName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
              <div className="flex items-center space-x-2">
                <span className="text-sm text-primary-600">Organization</span>
                <span className="text-sm text-gray-400">/</span>
                <span className="text-sm text-gray-900">Company</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditMode ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-white border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {!isEditMode ? (
          /* View Mode */
          <div className="space-y-6">
            {/* Company Profile Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">COMPANY PROFILE</h2>
              <p className="text-sm text-gray-600 mb-4">
                The Company Profile page allows you to define and manage key information about your organisation. This includes your brand identity, contact details, and more. Keep this information up-to-date so that you can provide accurate details to your customers and team if needed.
              </p>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Learn More
              </a>
            </div>

            {/* Company Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-6 mb-6">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{formData.companyName || 'Company Name'}</h3>
                  <p className="text-sm text-gray-600">Employee Count: {formData.employeeCount || 'N/A'}</p>
                </div>
              </div>

              {/* Primary Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Primary Information</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Primary Contact</p>
                      <p className="text-sm text-gray-900">{formData.primaryContact || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Currency Locale</p>
                      <p className="text-sm text-gray-900">{formData.currencyLocale || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h4>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-sm text-gray-900">{formData.phone || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Profile Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Profile</h2>
              
              {/* Logo Upload */}
              <div className="mb-6">
                <div className="flex items-center space-x-6">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Company Logo"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-white border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 inline-block">
                        Update
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: PNG, JPG, JPEG. Max file size: 2 MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div className="mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter company description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Website and Employee Count */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="Enter Website"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Count
                  </label>
                  <input
                    type="number"
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Primary Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Primary Information</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Points To Remember</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Primary contact (Super Admin) receives important communications from Ticket Tracker, such as billing and subscription related information if you are a paid user. Ensure to update credit card details if the Primary Contact is changed.</li>
                  <li>Currency Locale information is captured as organisation-level data. Administrators with necessary privileges can change the currency settings.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="primaryContact"
                    value={formData.primaryContact}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Locale <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currencyLocale"
                    value={formData.currencyLocale}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Currency</option>
                    <option value="India - (INR)">India - (INR)</option>
                    <option value="United States - (USD)">United States - (USD)</option>
                    <option value="United Kingdom - (GBP)">United Kingdom - (GBP)</option>
                    <option value="European Union - (EUR)">European Union - (EUR)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Address Details</h3>
              <p className="text-sm text-gray-600 mb-6">
                You can update your company address and contact details here.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Enter your Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your City"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter your State"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="Enter your Zip Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter your Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Enter company mobile number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fax</label>
                  <input
                    type="text"
                    name="fax"
                    value={formData.fax}
                    onChange={handleChange}
                    placeholder="Enter company fax"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CompanyProfile
