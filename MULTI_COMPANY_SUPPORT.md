# Multi-Company Support - API Updates

## Overview
Updated the company APIs to support users belonging to **multiple companies**. The User model's `companyId` field has been changed from a single ObjectId to an **array of ObjectIds**.

## Model Changes

### User Model - `companyId` Field
```javascript
// BEFORE (Single Company)
companyId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company'
}

// AFTER (Multiple Companies)
companyId: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company'
}]
```

## Updated Endpoints

### 1. GET `/companies/by-user/:userId`

**Description:** Returns **all companies** that a user belongs to.

**Changes:**
- Now returns the entire `companyId` array instead of wrapping a single company
- `count` field reflects the actual number of companies the user belongs to

**Request:**
```http
GET /companies/by-user/69358c948c455eafce697b9a
Authorization: Bearer <token>
```

**Response (Multiple Companies):**
```json
{
  "companies": [
    {
      "_id": "company_id_1",
      "companyName": "Company One",
      "description": "...",
      "website": "...",
      "employeeCount": 100,
      "primaryContact": {...},
      "address": {...},
      "logoUrl": "...",
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "_id": "company_id_2",
      "companyName": "Company Two",
      "description": "...",
      "website": "...",
      "employeeCount": 50,
      "primaryContact": {...},
      "address": {...},
      "logoUrl": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "count": 2
}
```

**Response (No Companies):**
```json
{
  "companies": [],
  "count": 0
}
```

**Implementation:**
```javascript
// Get the user with their companyId array populated
const user = await User.findById(req.params.userId).populate('companyId');

// companyId is now an array, so return it directly
const companies = user.companyId || [];
res.json({
  companies: companies,
  count: companies.length
});
```

---

### 2. POST `/companies`

**Description:** Creates a new company and **adds it** to the creating user's company list.

**Changes:**
- Uses MongoDB's `$addToSet` operator to add the company to the user's `companyId` array
- Prevents duplicate entries automatically
- Allows users to create and belong to multiple companies

**Request:**
```http
POST /companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyName": "New Company",
  "description": "Company description",
  "website": "https://example.com",
  "employeeCount": 100,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "logoUrl": "https://example.com/logo.png"
}
```

**Response:**
```json
{
  "message": "Company created successfully",
  "company": {
    "_id": "new_company_id",
    "companyName": "New Company",
    "description": "Company description",
    "website": "https://example.com",
    "employeeCount": 100,
    "primaryContact": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "address": {...},
    "logoUrl": "https://example.com/logo.png",
    "createdAt": "2025-12-11T...",
    "updatedAt": "2025-12-11T..."
  }
}
```

**Implementation:**
```javascript
// Create the company
const company = await Company.create({...});

// Add company to the creating user's companyId array
// $addToSet prevents duplicates
await User.findByIdAndUpdate(
  req.user._id,
  { $addToSet: { companyId: company._id } }
);
```

---

## Key Benefits

### 1. **Multi-Company Support**
- Users can now belong to multiple companies simultaneously
- Useful for consultants, contractors, or users with multiple roles

### 2. **Automatic Duplicate Prevention**
- Using `$addToSet` ensures a company is only added once to a user's list
- No need for manual duplicate checking

### 3. **Backward Compatible Response**
- Response format remains consistent (always returns an array)
- Frontend code that expects arrays will work seamlessly

### 4. **Scalable Design**
- Can easily add more companies to a user without restructuring
- No limit on the number of companies a user can belong to

---

## Migration Considerations

### Existing Data
If you have existing users with a single `companyId` value, you'll need to migrate the data:

```javascript
// Migration script example
const users = await User.find({ companyId: { $exists: true, $ne: [] } });

for (const user of users) {
  // If companyId is not already an array, convert it
  if (!Array.isArray(user.companyId)) {
    await User.findByIdAndUpdate(
      user._id,
      { companyId: user.companyId ? [user.companyId] : [] }
    );
  }
}
```

---

## Usage Examples

### Frontend - Get All Companies for a User
```javascript
import api from '../services/api';

const fetchUserCompanies = async (userId) => {
  try {
    const response = await api.get(`/companies/by-user/${userId}`);
    const { companies, count } = response.data;
    
    console.log(`User belongs to ${count} companies:`);
    companies.forEach(company => {
      console.log(`- ${company.companyName}`);
    });
    
    return companies;
  } catch (error) {
    console.error('Failed to fetch companies:', error);
  }
};
```

### Frontend - Create a Company
```javascript
const createCompany = async (companyData) => {
  try {
    const response = await api.post('/companies', companyData);
    console.log('Company created:', response.data.company);
    
    // The creating user is automatically added to this company
    return response.data.company;
  } catch (error) {
    console.error('Failed to create company:', error);
  }
};
```

### Frontend - Check if User Belongs to Multiple Companies
```javascript
const checkMultipleCompanies = async (userId) => {
  const response = await api.get(`/companies/by-user/${userId}`);
  const { count, companies } = response.data;
  
  if (count === 0) {
    console.log('User is not associated with any company');
  } else if (count === 1) {
    console.log('User belongs to one company:', companies[0].companyName);
  } else {
    console.log(`User belongs to ${count} companies`);
    // Show company selector UI
  }
};
```

---

## Additional API Endpoints to Consider

### Add User to Existing Company
You may want to create an endpoint to add a user to an existing company:

```javascript
// POST /companies/:companyId/users/:userId
router.post('/companies/:companyId/users/:userId', authenticateToken, async (req, res) => {
  try {
    // Add company to user's companyId array
    await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { companyId: req.params.companyId } }
    );
    
    res.json({ message: 'User added to company successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add user to company' });
  }
});
```

### Remove User from Company
```javascript
// DELETE /companies/:companyId/users/:userId
router.delete('/companies/:companyId/users/:userId', authenticateToken, async (req, res) => {
  try {
    // Remove company from user's companyId array
    await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { companyId: req.params.companyId } }
    );
    
    res.json({ message: 'User removed from company successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove user from company' });
  }
});
```

---

## Testing

### Test Case 1: User with No Companies
```bash
curl -X GET http://localhost:4000/companies/by-user/USER_ID \
  -H "Authorization: Bearer TOKEN"

# Expected: { "companies": [], "count": 0 }
```

### Test Case 2: User with One Company
```bash
# Create a company (user automatically added)
curl -X POST http://localhost:4000/companies \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Test Company"}'

# Get user's companies
curl -X GET http://localhost:4000/companies/by-user/USER_ID \
  -H "Authorization: Bearer TOKEN"

# Expected: { "companies": [...], "count": 1 }
```

### Test Case 3: User with Multiple Companies
```bash
# Create first company
curl -X POST http://localhost:4000/companies \
  -H "Authorization: Bearer TOKEN" \
  -d '{"companyName": "Company One"}'

# Create second company
curl -X POST http://localhost:4000/companies \
  -H "Authorization: Bearer TOKEN" \
  -d '{"companyName": "Company Two"}'

# Get user's companies
curl -X GET http://localhost:4000/companies/by-user/USER_ID \
  -H "Authorization: Bearer TOKEN"

# Expected: { "companies": [...], "count": 2 }
```

---

## Files Modified
- `d:\Ticker Tracker\node_backend_enterprise_full\src\models\User.js` - Changed `companyId` to array
- `d:\Ticker Tracker\node_backend_enterprise_full\src\routes\companies.js` - Updated GET and POST endpoints

## Summary
✅ Users can now belong to multiple companies  
✅ GET endpoint returns all companies for a user  
✅ POST endpoint adds new company to user's list  
✅ Automatic duplicate prevention with `$addToSet`  
✅ Backward compatible response format  
✅ Ready for multi-company workflows
