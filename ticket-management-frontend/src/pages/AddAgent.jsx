import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import { Input, Select, TextArea, Button } from '../components/ui'
import api from '../services/api'

const AddAgent = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departments: [],
    roleAndPermission: 'Agent',
    channelExpert: '',
    about: '',
    phone: '',
    mobile: '',
    fax: '',
    profileImage: null
  })

  const [imagePreview, setImagePreview] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file size must be less than 2MB')
        return
      }

      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        setError('Image must be PNG, JPG, or JPEG format')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
        setFormData(prev => ({
          ...prev,
          profileImage: file
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
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        if (key !== 'profileImage' && formData[key]) {
          if (Array.isArray(formData[key])) {
            formDataToSend.append(key, JSON.stringify(formData[key]))
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })
      
      if (formData.profileImage) {
        formDataToSend.append('profileImage', formData.profileImage)
      }

      await api.post('/agents', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setSuccess('Agent added successfully!')
      setTimeout(() => {
        navigate('/users')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add agent')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/users')
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
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="text-primary-600 cursor-pointer hover:underline" onClick={() => navigate('/users')}>
                  User Management
                </span>
                <span>/</span>
                <span className="text-primary-600 cursor-pointer hover:underline" onClick={() => navigate('/users')}>
                  Agents
                </span>
                <span>/</span>
                <span className="text-gray-900">New Agent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
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
          {/* Agent Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Agent Information</h2>

            <div className="space-y-6">
              {/* Profile Image */}
              <div className="flex items-start space-x-6">
                <div>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-white border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 inline-block">
                      <Upload className="h-4 w-4 inline mr-2" />
                      Upload Photo
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PNG, JPG, JPEG. Max file size: 2 MB.
                  </p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  helperText="This username is valid and hasn't been used before"
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              {/* Departments */}
              <Select
                label="Departments"
                name="departments"
                value={formData.departments}
                onChange={handleChange}
              >
                <option value="">-Select-</option>
                <option value="support">Support</option>
                <option value="sales">Sales</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
              </Select>

              {/* Role and Permission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Role and Permission <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="roleAndPermission"
                      value="Agent"
                      checked={formData.roleAndPermission === 'Agent'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Agent</div>
                      <div className="text-xs text-gray-500">Can view and respond to tickets</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="roleAndPermission"
                      value="Admin"
                      checked={formData.roleAndPermission === 'Admin'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Admin</div>
                      <div className="text-xs text-gray-500">Full access to all features</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="roleAndPermission"
                      value="Light Agent"
                      checked={formData.roleAndPermission === 'Light Agent'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Light Agent</div>
                      <div className="text-xs text-gray-500">Limited access to tickets</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="roleAndPermission"
                      value="Custom"
                      checked={formData.roleAndPermission === 'Custom'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Custom</div>
                      <div className="text-xs text-gray-500">Custom role with specific permissions</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Additional Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Agent Additional Information</h2>

            <div className="space-y-6">
              {/* Channel Expert and About */}
              <div className="grid grid-cols-2 gap-6">
                <Select
                  label="Channel Expert"
                  name="channelExpert"
                  value={formData.channelExpert}
                  onChange={handleChange}
                >
                  <option value="">-Select-</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Chat">Chat</option>
                  <option value="Social">Social Media</option>
                </Select>

                <TextArea
                  label="About"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  rows={3}
                  containerClassName="col-span-1"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <Input
                  label="Mobile"
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Fax"
                type="text"
                name="fax"
                value={formData.fax}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-start space-x-3 bg-gray-100 px-6 py-4 rounded-lg">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAgent
