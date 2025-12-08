import express from 'express';
import Product from '../models/Product.js';
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

// Get all products (legacy route for backward compatibility)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('ownerId', 'name email')
      .sort({ productName: 1 })
      .limit(50);

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get all products by company ID
router.get('/:companyId/products', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const { companyId } = req.params;

    const filter = { companyId };
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('ownerId', 'name email')
      .sort({ productName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Create product (legacy route)
router.post('/products', authenticateToken, async (req, res) => {
  try {
    const { productName, productCode, description, unitPrice, ownerId, isActive } = req.body;

    if (!productName) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    // Use user's company ID if not provided
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }

    const product = await Product.create({
      companyId,
      productName: productName.trim(),
      productCode: productCode?.trim(),
      description: description?.trim(),
      unitPrice: unitPrice || 0,
      ownerId: ownerId || req.user._id,
      isActive: isActive ?? true
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('ownerId', 'name email');

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Create product
router.post('/:companyId/products', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { productName, productCode, description, unitPrice, ownerId, isActive } = req.body;

    if (!productName) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    const product = await Product.create({
      companyId,
      productName: productName.trim(),
      productCode: productCode?.trim(),
      description: description?.trim(),
      unitPrice: unitPrice || 0,
      ownerId: ownerId || req.user._id,
      isActive: isActive ?? true
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('ownerId', 'name email');

    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// Get single product
router.get('/:companyId/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('ownerId', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Update product
router.put('/:companyId/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('ownerId', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
});

// Delete product
router.delete('/:companyId/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;