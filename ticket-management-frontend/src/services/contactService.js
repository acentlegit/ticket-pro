import api from './api'

/**
 * Find a contact by email address
 * @param {string} email - The email address to search for
 * @returns {Promise<{found: boolean, contact?: object}>}
 */
export const findContactByEmail = async (email) => {
  try {
    const response = await api.get(`/contacts/email/${encodeURIComponent(email)}`)
    return {
      found: true,
      contact: response.data.contact
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        found: false,
        contact: null
      }
    }
    throw error
  }
}

/**
 * Get all contacts
 * @param {object} params - Query parameters (search, accountId, page, limit)
 * @returns {Promise<{contacts: array, pagination: object}>}
 */
export const getContacts = async (params = {}) => {
  const response = await api.get('/contacts', { params })
  return response.data
}

/**
 * Get a single contact by ID
 * @param {string} id - Contact ID
 * @returns {Promise<object>}
 */
export const getContactById = async (id) => {
  const response = await api.get(`/contacts/${id}`)
  return response.data.contact
}

/**
 * Create a new contact
 * @param {object} contactData - Contact data
 * @returns {Promise<object>}
 */
export const createContact = async (contactData) => {
  const response = await api.post('/contacts', contactData)
  return response.data.contact
}

/**
 * Update a contact
 * @param {string} id - Contact ID
 * @param {object} contactData - Updated contact data
 * @returns {Promise<object>}
 */
export const updateContact = async (id, contactData) => {
  const response = await api.put(`/contacts/${id}`, contactData)
  return response.data.contact
}

export default {
  findContactByEmail,
  getContacts,
  getContactById,
  createContact,
  updateContact
}
