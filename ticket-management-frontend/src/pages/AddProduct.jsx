import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Input, TextArea, Select, Button } from '../components/ui'
import api from '../services/api'

const AddProduct = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    productCategory: '',
    productOwner: '',
    description: '',
    manufacturer: '',
    unitPrice: ''
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
      await api.post('/products', formData)
      navigate('/products')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/products')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Add Product</h1>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Information</h2>

          <div className="space-y-6">
            {/* Product Name */}
            <Input
              label="Product Name"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              required
            />

            {/* Product Code */}
            <Input
              label="Product Code"
              name="productCode"
              value={formData.productCode}
              onChange={handleChange}
            />

            {/* Product Category */}
            <Select
              label="Product Category"
              name="productCategory"
              value={formData.productCategory}
              onChange={handleChange}
            >
              <option value="">-None-</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Services">Services</option>
              <option value="Accessories">Accessories</option>
              <option value="Other">Other</option>
            </Select>

            {/* Product Owner */}
            <Select
              label="Product Owner"
              name="productOwner"
              value={formData.productOwner}
              onChange={handleChange}
            >
              <option value="">-None-</option>
              <option value="Vinod Balagoni">Vinod Balagoni</option>
              <option value="Admin User">Admin User</option>
            </Select>

            {/* Description */}
            <TextArea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
            />

            {/* Manufacturer */}
            <Select
              label="Manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
            >
              <option value="">-None-</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Dell">Dell</option>
              <option value="HP">HP</option>
              <option value="Lenovo">Lenovo</option>
              <option value="Microsoft">Microsoft</option>
              <option value="Other">Other</option>
            </Select>

            {/* Unit Price */}
            <Input
              label="Unit Price"
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-start space-x-3 mt-8 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
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

export default AddProduct
