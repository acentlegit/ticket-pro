import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Phone, Mail } from 'lucide-react'
import { Input, Button, Checkbox } from '../components/ui'
import api from '../services/api'

const Register = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    countryCode: '+1',
    agreeToTerms: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: `${formData.countryCode}${formData.phoneNumber}`,
        role: 'admin'
      })

      // Registration successful, redirect to login
      navigate('/login', { state: { message: 'Registration successful! Please login.' } })
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // Implement Google OAuth
    window.location.href = `${api.defaults.baseURL}/auth/google`
  }

  const handleLinkedInSignIn = () => {
    // Implement LinkedIn OAuth
    window.location.href = `${api.defaults.baseURL}/auth/linkedin`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-8">
              <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xl font-semibold text-gray-900">Ticket</div>
                <div className="text-xl font-bold text-gray-900">Tracker</div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Get started with your 15-day free trial.
            </h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="bg-green-50 border-green-200 focus:ring-green-500"
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-green-50 border-green-200 focus:ring-green-500"
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-green-50 border-green-200 focus:ring-green-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="w-20 bg-green-50 border-green-200 focus:ring-green-500 text-center"
                  containerClassName="w-20"
                />
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="bg-green-50 border-green-200 focus:ring-green-500"
                  containerClassName="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                It looks like you're in <span className="font-semibold">INDIA</span> based on your IP.
              </p>
            </div>

            {/* Terms and Conditions */}
            <Checkbox
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              label={
                <>
                  I agree to the{' '}
                  <a href="#" className="text-gray-900 underline hover:text-gray-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-gray-900 underline hover:text-gray-700">
                    Privacy Policy
                  </a>
                </>
              }
              className="text-red-600 focus:ring-red-500"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="danger"
              fullWidth
              size="lg"
              loading={loading}
            >
              {loading ? 'CREATING ACCOUNT...' : 'GET STARTED'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">Or, Create a new account now</span>
              </div>
            </div>

            {/* Social Sign In */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                leftIcon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                }
              >
                Sign in with Google
              </Button>

              <Button
                type="button"
                onClick={handleLinkedInSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                leftIcon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                }
              >
                Sign in with LinkedIn
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Contact Info */}
      <div className="hidden lg:flex lg:w-96 bg-white border-l border-gray-200 p-8 flex-col justify-center">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Need assistance?</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Contact our toll free number</p>
                <div className="flex items-center space-x-2 text-gray-900">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-lg font-semibold">+1(703) 423-9032</div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-2">Reach out to us</p>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-orange-600" />
                  <a
                    href="mailto:sales@tickettracker.com"
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    sales@opsnow.live
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Element */}
          <div className="pt-8">
            <div className="w-full h-48 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-32 h-32 text-green-600 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
