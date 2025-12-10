# Bulk Upload Implementation Guide

## 🎯 Quick Start Guide

This guide provides step-by-step instructions to implement bulk ticket upload functionality.

---

## 📦 Step 1: Install Dependencies

### Backend Dependencies
```bash
cd node_backend_enterprise_full
npm install csv-parser xlsx
```

### Frontend Dependencies
```bash
cd ticket-management-frontend
npm install react-dropzone
```

---

## 🔧 Step 2: Backend Implementation

### 2.1 Create Bulk Upload Middleware

**File**: `src/middleware/bulkUpload.js`

```javascript
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/bulk/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bulk-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /csv|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const mimetype = mimetypes.includes(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only CSV and Excel files are allowed'));
};

export const bulkUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

### 2.2 Create File Parser Utilities

**File**: `src/utils/fileParser.js`

```javascript
import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';

/**
 * Parse CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} - Array of row objects
 */
export const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Clean up file after parsing
        fs.unlinkSync(filePath);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Parse Excel file
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} - Array of row objects
 */
export const parseExcel = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      // Clean up file after parsing
      fs.unlinkSync(filePath);
      
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Determine file type and parse accordingly
 * @param {string} filePath - Path to file
 * @param {string} mimetype - MIME type of file
 * @returns {Promise<Array>} - Array of row objects
 */
export const parseFile = async (filePath, mimetype) => {
  if (mimetype === 'text/csv') {
    return await parseCSV(filePath);
  } else if (
    mimetype === 'application/vnd.ms-excel' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return await parseExcel(filePath);
  } else {
    throw new Error('Unsupported file type');
  }
};
```

### 2.3 Create Ticket Validator

**File**: `src/utils/ticketValidator.js`

```javascript
/**
 * Validate ticket data from CSV/Excel row
 * @param {Object} row - Row data from CSV/Excel
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateTicketData = (row) => {
  const errors = [];
  
  // Required fields
  if (!row.Subject || row.Subject.trim() === '') {
    errors.push({ field: 'Subject', message: 'Subject is required' });
  } else if (row.Subject.length > 255) {
    errors.push({ field: 'Subject', message: 'Subject cannot exceed 255 characters' });
  }
  
  if (!row.Description || row.Description.trim() === '') {
    errors.push({ field: 'Description', message: 'Description is required' });
  }
  
  if (!row.Priority || row.Priority.trim() === '') {
    errors.push({ field: 'Priority', message: 'Priority is required' });
  }
  
  // Validate enum values
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (row.Priority && !validPriorities.includes(row.Priority.toLowerCase())) {
    errors.push({ 
      field: 'Priority', 
      message: `Priority must be one of: ${validPriorities.join(', ')}` 
    });
  }
  
  const validStatuses = ['open', 'in-progress', 'pending', 'resolved', 'closed'];
  if (row.Status && !validStatuses.includes(row.Status.toLowerCase())) {
    errors.push({ 
      field: 'Status', 
      message: `Status must be one of: ${validStatuses.join(', ')}` 
    });
  }
  
  const validChannels = ['email', 'phone', 'chat', 'web', 'social', 'api'];
  if (row.Channel && !validChannels.includes(row.Channel.toLowerCase())) {
    errors.push({ 
      field: 'Channel', 
      message: `Channel must be one of: ${validChannels.join(', ')}` 
    });
  }
  
  // Validate email format
  if (row['Contact Email']) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row['Contact Email'])) {
      errors.push({ field: 'Contact Email', message: 'Invalid email format' });
    }
  }
  
  // Validate date format
  if (row['Due Date']) {
    const date = new Date(row['Due Date']);
    if (isNaN(date.getTime())) {
      errors.push({ field: 'Due Date', message: 'Invalid date format' });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize and normalize ticket data
 * @param {Object} row - Row data from CSV/Excel
 * @returns {Object} - Normalized ticket data
 */
export const normalizeTicketData = (row) => {
  return {
    subject: row.Subject?.trim(),
    description: row.Description?.trim(),
    priority: row.Priority?.toLowerCase() || 'medium',
    status: row.Status?.toLowerCase() || 'open',
    channel: row.Channel?.toLowerCase() || 'web',
    contactName: row['Contact Name']?.trim(),
    contactEmail: row['Contact Email']?.trim(),
    contactPhone: row['Contact Phone']?.trim(),
    accountName: row['Account Name']?.trim(),
    departmentName: row.Department?.trim(),
    productName: row.Product?.trim(),
    assignedAgentEmail: row['Assigned Agent Email']?.trim(),
    teamName: row.Team?.trim(),
    dueDate: row['Due Date'] ? new Date(row['Due Date']) : null,
    classification: row.Classification?.trim(),
    language: row.Language?.trim(),
    tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : []
  };
};
```

### 2.4 Add Bulk Upload Endpoint

**File**: `src/routes/tickets.js` (add this endpoint)

```javascript
import { bulkUpload } from '../middleware/bulkUpload.js';
import { parseFile } from '../utils/fileParser.js';
import { validateTicketData, normalizeTicketData } from '../utils/ticketValidator.js';
import Department from '../models/Department.js';
import Tag from '../models/Tag.js';

// Bulk upload tickets
router.post('/:companyId/tickets/bulk-upload', 
  authenticateToken, 
  requireRole(['admin', 'supervisor', 'agent']), 
  bulkUpload.single('file'),
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      const { companyId } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }
      
      // Parse file
      const rows = await parseFile(file.path, file.mimetype);
      
      if (rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'File is empty or invalid' 
        });
      }
      
      // Limit rows to prevent abuse
      if (rows.length > 1000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Maximum 1000 tickets allowed per upload' 
        });
      }
      
      const results = {
        totalRows: rows.length,
        successCount: 0,
        failureCount: 0,
        createdTickets: [],
        errors: []
      };
      
      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 for header row and 0-index
        
        // Validate row
        const validation = validateTicketData(row);
        if (!validation.valid) {
          results.failureCount++;
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: validation.errors
          });
          continue;
        }
        
        try {
          // Normalize data
          const ticketData = normalizeTicketData(row);
          
          // Find or create contact
          let contact = null;
          if (ticketData.contactEmail) {
            contact = await Contact.findOne({ 
              email: ticketData.contactEmail,
              companyId 
            });
            
            if (!contact) {
              contact = await Contact.create({
                firstName: ticketData.contactName || 'Unknown',
                email: ticketData.contactEmail,
                phoneNumber: ticketData.contactPhone,
                companyId
              });
            }
          }
          
          // Find or create account
          let account = null;
          if (ticketData.accountName) {
            account = await Account.findOne({ 
              accountName: ticketData.accountName,
              companyId 
            });
            
            if (!account) {
              account = await Account.create({
                accountName: ticketData.accountName,
                companyId
              });
            }
            
            // Update contact's account if needed
            if (contact && !contact.accountId) {
              contact.accountId = account._id;
              await contact.save();
            }
          }
          
          // Find department by name
          let department = null;
          if (ticketData.departmentName) {
            department = await Department.findOne({ 
              departmentName: ticketData.departmentName,
              companyId 
            });
          }
          
          // Find product by name
          let product = null;
          if (ticketData.productName) {
            product = await Product.findOne({ 
              productName: ticketData.productName,
              companyId 
            });
          }
          
          // Find assigned agent by email
          let assignedAgent = null;
          if (ticketData.assignedAgentEmail) {
            assignedAgent = await User.findOne({ 
              email: ticketData.assignedAgentEmail,
              companyId 
            });
          }
          
          // Find team by name
          let team = null;
          if (ticketData.teamName) {
            team = await Team.findOne({ 
              teamName: ticketData.teamName,
              companyId 
            });
          }
          
          // Create ticket
          const ticket = await Ticket.create({
            subject: ticketData.subject,
            description: ticketData.description,
            priority: ticketData.priority,
            status: ticketData.status,
            channel: ticketData.channel,
            contactId: contact?._id,
            accountId: account?._id,
            departmentId: department?._id,
            productId: product?._id,
            assignedAgentId: assignedAgent?._id,
            teamId: team?._id,
            dueDate: ticketData.dueDate,
            classification: ticketData.classification,
            language: ticketData.language,
            companyId,
            createdBy: req.user._id
          });
          
          // Create ticket history
          await TicketHistory.create({
            ticketId: ticket._id,
            fieldChanged: 'ticket_created',
            oldValue: null,
            newValue: 'Ticket created via bulk upload',
            changedBy: req.user._id,
            changedByType: 'agent',
            changeType: 'create'
          });
          
          results.successCount++;
          results.createdTickets.push({
            _id: ticket._id,
            subject: ticket.subject,
            priority: ticket.priority,
            status: ticket.status
          });
          
        } catch (error) {
          results.failureCount++;
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: [{ 
              field: 'general', 
              message: error.message 
            }]
          });
        }
      }
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      res.json({
        success: true,
        message: 'Bulk upload completed',
        summary: {
          ...results,
          processingTime: `${processingTime}s`
        }
      });
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Bulk upload failed',
        error: error.message
      });
    }
  }
);

// Download template endpoint
router.get('/tickets/bulk-upload/template', authenticateToken, (req, res) => {
  const templatePath = path.join(__dirname, '../templates/ticket-upload-template.csv');
  res.download(templatePath, 'ticket-upload-template.csv');
});
```

### 2.5 Create Uploads Directory

```bash
mkdir -p node_backend_enterprise_full/uploads/bulk
```

---

## 🎨 Step 3: Frontend Implementation

### 3.1 Create Bulk Upload Page

**File**: `src/pages/BulkUploadTickets.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const BulkUploadTickets = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setError('Invalid file type or size. Please upload CSV or Excel file (max 10MB)');
      return;
    }
    
    setFile(acceptedFiles[0]);
    setError(null);
    setResults(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/tickets/bulk-upload/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ticket-upload-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download template error:', error);
      setError('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const companyId = localStorage.getItem('companyId');
      const response = await api.post(
        `/${companyId}/tickets/bulk-upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      );

      setResults(response.data.summary);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!results || !results.errors.length) return;

    const csvContent = [
      ['Row', 'Field', 'Error', 'Data'],
      ...results.errors.map(err => [
        err.row,
        err.errors.map(e => e.field).join('; '),
        err.errors.map(e => e.message).join('; '),
        JSON.stringify(err.data)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bulk-upload-errors.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tickets
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bulk Upload Tickets
          </h1>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📥 Upload Instructions
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Download the CSV template below</li>
            <li>Fill in your ticket details (Subject, Description, and Priority are required)</li>
            <li>Upload the completed file</li>
            <li>Review the results and fix any errors if needed</li>
          </ol>
          
          <div className="mt-4">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            {isDragActive ? (
              <p className="text-lg text-blue-600 dark:text-blue-400">
                Drop the file here...
              </p>
            ) : (
              <>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                  Drag & drop your file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supported formats: CSV, Excel (.csv, .xlsx, .xls)
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Maximum file size: 10MB | Maximum rows: 1000
                </p>
              </>
            )}
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {uploading ? 'Uploading...' : 'Upload Tickets'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Upload Results
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Rows</span>
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {results.totalRows}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-600 dark:text-green-400">Success</span>
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
                  {results.successCount}
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-red-600 dark:text-red-400">Failed</span>
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2">
                  {results.failureCount}
                </p>
              </div>
            </div>

            {results.processingTime && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Processing time: {results.processingTime}
              </p>
            )}

            {results.errors && results.errors.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    Errors ({results.errors.length})
                  </h3>
                  <button
                    onClick={downloadErrorReport}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Download Error Report
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Field
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {results.errors.slice(0, 10).map((error, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {error.row}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {error.errors.map(e => e.field).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {error.errors.map(e => e.message).join('; ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.errors.length > 10 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Showing 10 of {results.errors.length} errors. Download full report for details.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate('/tickets')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Tickets
              </button>
              <button
                onClick={() => {
                  setResults(null);
                  setFile(null);
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Upload Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadTickets;
```

### 3.2 Update App Routes

**File**: `src/App.jsx` (add this route)

```jsx
import BulkUploadTickets from './pages/BulkUploadTickets'

// In your routes section:
<Route path="/tickets/bulk-upload" element={<BulkUploadTickets />} />
```

### 3.3 Add Navigation Link

**File**: `src/pages/TicketList.jsx` (add button in header)

```jsx
import { Upload } from 'lucide-react';

// In the header section:
<button
  onClick={() => navigate('/tickets/bulk-upload')}
  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
>
  <Upload className="h-4 w-4 mr-2" />
  Bulk Upload
</button>
```

---

## ✅ Testing Checklist

### Backend Testing
1. [ ] Test CSV file upload
2. [ ] Test Excel file upload
3. [ ] Test file size limit
4. [ ] Test file type validation
5. [ ] Test empty file
6. [ ] Test invalid data
7. [ ] Test duplicate contacts/accounts
8. [ ] Test missing required fields
9. [ ] Test invalid enum values
10. [ ] Test large file (1000 rows)

### Frontend Testing
1. [ ] Test file drag & drop
2. [ ] Test file browser
3. [ ] Test file type validation
4. [ ] Test file size validation
5. [ ] Test template download
6. [ ] Test upload progress
7. [ ] Test error display
8. [ ] Test success display
9. [ ] Test error report download
10. [ ] Test navigation

---

## 🚀 Deployment Steps

1. **Install dependencies** (both backend and frontend)
2. **Create uploads directory**: `mkdir -p uploads/bulk`
3. **Add new files** to version control
4. **Test locally** with sample CSV
5. **Deploy backend** changes
6. **Deploy frontend** changes
7. **Test in production** with small file first
8. **Monitor logs** for errors
9. **Gather user feedback**

---

## 📝 Sample Test Data

Use the provided template at:
`node_backend_enterprise_full/src/templates/ticket-upload-template.csv`

---

## 🔍 Troubleshooting

### Common Issues

**Issue**: "Only CSV and Excel files are allowed"
- **Solution**: Check file extension and MIME type

**Issue**: "Maximum 1000 tickets allowed per upload"
- **Solution**: Split file into smaller batches

**Issue**: "Invalid email format"
- **Solution**: Ensure email follows format: user@domain.com

**Issue**: "Priority must be one of: low, medium, high, urgent"
- **Solution**: Check spelling and case (should be lowercase)

**Issue**: File upload hangs
- **Solution**: Check file size (max 10MB) and network connection

---

## 📞 Support

For issues or questions:
1. Check error messages in browser console
2. Check backend logs
3. Review validation errors in results table
4. Download error report for detailed analysis

---

*Last updated: 2025-12-10*
