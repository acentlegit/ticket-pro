import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const CompanyBranding = () => {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    companyName: '',
    logoUrl: '',
    faviconUrl: '',
    logoLinkbackUrl: '',
    primaryColor: '#6366f1'
  })

  const [logoPreview, setLogoPreview] = useState(null)
  const [faviconPreview, setFaviconPreview] = useState(null)

  useEffect(() => {
    if (companyId) {
      fetchCompanyData()
    }
  }, [companyId])

  const fetchCompanyData = async () => {
    try {
      // Fetch existing company branding data
      const response = await api.get(`/${companyId}/branding`)
      if (response.data?.branding) {
        setFormData(response.data.branding)
        setLogoPreview(response.data.branding.logoUrl)
        setFaviconPreview(response.data.branding.faviconUrl)
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error)
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
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB')
        return
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
      if (!validTypes.includes(file.type)) {
        setError('Logo must be PNG, JPG, JPEG, or GIF format')
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

  const handleFaviconChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError('Favicon file size must be less than 2MB')
        return
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/x-icon']
      if (!validTypes.includes(file.type)) {
        setError('Favicon must be PNG, JPG, JPEG, GIF, or ICO format')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFaviconPreview(reader.result)
        setFormData(prev => ({
          ...prev,
          faviconFile: file
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const brandingData = {
        logoUrl: logoPreview || formData.logoUrl || '',
        faviconUrl: faviconPreview || formData.faviconUrl || '',
        logoLinkbackUrl: formData.logoLinkbackUrl || '',
        useDefaultBranding: false
      }

      await api.put(`/${companyId}/branding`, brandingData)

      setSuccess('Company branding updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update company branding')
    } finally {
      setLoading(false)
    }
  }

  const removeLogo = () => {
    setLogoPreview(null)
    setFormData(prev => ({
      ...prev,
      logoFile: null,
      logoUrl: ''
    }))
  }

  const removeFavicon = () => {
    setFaviconPreview(null)
    setFormData(prev => ({
      ...prev,
      faviconFile: null,
      faviconUrl: ''
    }))
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
              <h1 className="text-xl font-semibold text-gray-900">Rebranding - Company Logo</h1>
              <p className="text-sm text-gray-600 mt-1">Organization / Company</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Hero Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-primary-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">COMPANY LOGO</h2>
              <p className="text-gray-600 mb-4">
                Rebrand your Ticket Tracker by adding your company logo and favicon. The logo will appear in both the agent and customer portals, making it easy for users to distinguish your portals from other webpages.
              </p>
              <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Learn More →
              </a>
            </div>
          </div>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Logo</h3>
            <p className="text-sm text-gray-600 mb-6">
              Upload your company logo, and it will be visible in both your Help Desk and the Help Center.
            </p>

            <div className="flex items-start space-x-8">
              {/* Upload Area */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg bg-white p-2"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  <div>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 inline-block">
                        Change
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: PNG, JPG, or JPEG. File size: 2 MB.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1 flex items-center">
                      <span className="mr-1">⚠</span>
                      By default Ticket Tracker Logo will be displayed when there is no logo uploaded
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex-shrink-0">
                <p className="text-sm font-medium text-gray-700 mb-3">PREVIEW</p>
                <div className="w-64 bg-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="bg-primary-600 text-white px-4 py-2 rounded-t-lg flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-6 w-auto" />
                      ) : (
                        <div className="h-6 w-6 bg-white rounded"></div>
                      )}
                      <span className="text-sm font-medium">Ticket Tracker</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-b-lg">
                    <p className="text-xs text-gray-500">Help Center Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Linkback URL */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Logo-linkback URL</h3>
            <p className="text-sm text-gray-600 mb-4">
              It's the page customers are redirected to when they click your company's logo, and it works only in the default Help Center
            </p>
            <input
              type="url"
              name="logoLinkbackUrl"
              value={formData.logoLinkbackUrl}
              onChange={handleChange}
              placeholder="Eg: https://www"
              className="input-field max-w-xl"
            />
          </div>

          {/* Favicon Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Favicon</h3>
            <p className="text-sm text-gray-600 mb-6">
              A favicon ("favourite icon") is a small icon that will be displayed in website tabs, search bars, and bookmark bars.
            </p>

            <div className="flex items-start space-x-8">
              {/* Upload Area */}
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  {faviconPreview ? (
                    <div className="relative">
                      <img
                        src={faviconPreview}
                        alt="Favicon preview"
                        className="w-16 h-16 object-contain border-2 border-gray-200 rounded-lg bg-white p-2"
                      />
                      <button
                        type="button"
                        onClick={removeFavicon}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  <div>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 inline-block">
                        Change
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/x-icon"
                        onChange={handleFaviconChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: PNG, JPG, JPEG, GIF, or ICO. Max file size: 2 MB.
                    </p>
                    <p className="text-xs text-yellow-600 mt-1 flex items-center">
                      <span className="mr-1">⚠</span>
                      By default Ticket Tracker favicon will be displayed when there is no logo uploaded
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex-shrink-0">
                <p className="text-sm font-medium text-gray-700 mb-3">PREVIEW</p>
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded border border-gray-300">
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="Favicon" className="h-4 w-4" />
                    ) : (
                      <div className="h-4 w-4 bg-primary-600 rounded"></div>
                    )}
                    <span className="text-xs text-gray-600">tickettracker.app/agent/view</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-4">
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
              <Upload className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompanyBranding
