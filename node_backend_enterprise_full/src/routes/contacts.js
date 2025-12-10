import express from 'express';
import Contact from '../models/Contact.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Get all contacts
router.get('/:companyId/contacts', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { search, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (companyId) {
      filter.companyId = companyId;
    }

    const contacts = await Contact.find(filter)
      .populate('companyId', 'companyName')
      .sort({ fullName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(filter);

    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// Create contact
// router.post('/:companyId/contacts', authenticateToken, async (req, res) => {
//   try {
//     const { fullName, email, phoneNumber, companyId } = req.body;

//     if (!fullName) {
//       return res.status(400).json({ message: 'Full name is required' });
//     }

//     const contact = await Contact.create({
//       fullName: fullName.trim(),
//       email: email?.trim(),
//       phoneNumber: phoneNumber?.trim(),
//       companyId: companyId || null
//     });

//     const populatedContact = await Contact.findById(contact._id)
//       .populate('companyId', 'companyName');

//     res.status(201).json({
//       message: 'Contact created successfully',
//       contact: populatedContact
//     });
//   } catch (error) {
//     console.error('Create contact error:', error);
//     res.status(500).json({ 
//       message: 'Failed to create contact', 
//       error: error.message 
//     });
//   }
// });
router.post('/:companyId/contacts', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    const {
      firstName,
      lastName,
      email,
      secondaryEmail,
      phone,
      mobile,
      type,
      title,
      language,
      accountId
    } = req.body;

    // ✅ Required validation
    if (!firstName || !accountId) {
      return res.status(400).json({
        message: 'First name and Account ID are required'
      });
    }

    // ✅ Create contact
    const contact = await Contact.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim(),
      email: email?.trim(),
      secondaryEmail: secondaryEmail?.trim(),
      phoneNumber: phone?.trim(),
      mobileNumber: mobile?.trim(),
      type: type?.trim(),
      title: title?.trim(),
      language: language?.trim(),
      companyId,
      accountId
    });

    // ✅ Populate references
    const populatedContact = await Contact.findById(contact._id)
      .populate('companyId', 'companyName')
      .populate('accountId', 'accountName');

    res.status(201).json({
      message: 'Contact created successfully',
      contact: populatedContact
    });

  } catch (error) {
    console.error('Create contact error:', error);

    // ✅ Handle duplicate email error
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      message: 'Failed to create contact',
      error: error.message
    });
  }
});

// Find contact by email
router.get('/:companyId/contacts/email/:email', authenticateToken, async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const contact = await Contact.findOne({ email: email })
      .populate('companyId', 'companyName website');

    if (!contact) {
      return res.status(404).json({
        message: 'Contact not found',
        found: false
      });
    }

    res.json({
      contact,
      found: true
    });
  } catch (error) {
    console.error('Find contact by email error:', error);
    res.status(500).json({ message: 'Failed to find contact' });
  }
});

// Get single contact by ID
router.get('/:companyId/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('companyId', 'companyName');

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ message: 'Failed to fetch contact' });
  }
});

// Update contact
router.put('/:companyId/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      firstName,
      lastName,
      email,
      secondaryEmail,
      phone,
      mobile,
      type,
      title,
      language,
      accountId
    } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        firstName: firstName.trim(),
        lastName: lastName?.trim(),
        email: email?.trim(),
        secondaryEmail: secondaryEmail?.trim(),
        phoneNumber: phone?.trim(),
        mobileNumber: mobile?.trim(),
        type: type?.trim(),
        title: title?.trim(),
        language: language?.trim(),
        companyId,
        accountId
      },
      { new: true, runValidators: true }
    ).populate('companyId', 'companyName');

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: 'Failed to update contact', error: error.message });
  }
});

export default router;