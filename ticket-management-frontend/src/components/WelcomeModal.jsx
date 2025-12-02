import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../services/api'

const WelcomeModal = ({ isOpen, onClose, userName }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    companyName: '',
    portalUrl: 'https://tickettracker.app/agent/',
    portalName: '',
    language: 'English',
    country: 'India',
    timeZone: '(GMT +05:30) India Standard Time (Asia/Kolkata)'
  })

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
      const response = await api.post('/companies', formData)
      // Update localStorage with company ID
      if (response.data.company?._id) {
        localStorage.setItem('companyId', response.data.company._id)
      }
      onClose(true) // Pass true to indicate successful setup
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Hello {userName}, Welcome to Ticket Tracker.
            </h2>
            <button
              onClick={() => onClose(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex">
            {/* Form Section */}
            <div className="flex-1 p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Help Desk Portal URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Help desk portal URL <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      name="portalUrl"
                      value={formData.portalUrl}
                      onChange={handleChange}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                      readOnly
                    />
                    <input
                      type="text"
                      name="portalName"
                      value={formData.portalName}
                      onChange={handleChange}
                      placeholder="Portal Name"
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

                {/* Time Zone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <select
                    name="timeZone"
                    value={formData.timeZone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="(GMT +05:30) India Standard Time (Asia/Kolkata)">
                      (GMT +05:30) India Standard Time (Asia/Kolkata)
                    </option>
                    <option value="(GMT -05:00) Eastern Time (US & Canada)">
                      (GMT -05:00) Eastern Time (US & Canada)
                    </option>
                    <option value="(GMT +00:00) London">
                      (GMT +00:00) London
                    </option>
                    <option value="(GMT +10:00) Sydney">
                      (GMT +10:00) Sydney
                    </option>
                  </select>
                </div>

                {/* Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Note:</span> You can update the company name, portal name (Help desk portal URL) & other details, anytime from Ticket Tracker setup.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {loading ? 'Creating...' : 'Create Ticket Tracker account'}
                </button>
              </form>
            </div>

            {/* Right Side - Trial Info */}
            <div className="w-80 bg-gradient-to-br from-orange-50 to-orange-100 p-6 flex flex-col items-center justify-center border-l border-gray-200">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-lg shadow-md mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">15</div>
                    <div className="text-xs text-gray-600">Days</div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Free trial</h3>
                <p className="text-sm text-gray-600">for the Enterprise Edition</p>
              </div>

              {/* Support Agent Image */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full blur-2xl opacity-30"></div>
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%23f97316' width='200' height='200' rx='100'/%3E%3Cpath fill='%23fff' d='M100 90c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20zm0 10c13.3 0 40 6.7 40 20v20H60v-20c0-13.3 26.7-20 40-20z'/%3E%3C/svg%3E"
                  alt="Support Agent"
                  className="relative w-48 h-48 rounded-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal
