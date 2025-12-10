# Quick Setup Guide - Bulk Upload Feature

## 🚀 Quick Start (5 Minutes)

Follow these steps to get the bulk upload feature running.

---

## Step 1: Fix PowerShell Execution Policy (Windows Only)

If you encounter this error when running npm commands:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled
```

**Solution:**

1. Open PowerShell as **Administrator**
2. Run this command:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
3. Type `Y` and press Enter to confirm

---

## Step 2: Install Backend Dependencies

```bash
cd "d:\Ticker Tracker\node_backend_enterprise_full"
npm install csv-parser xlsx
```

**Expected Output:**
```
added 2 packages, and audited XXX packages in Xs
```

---

## Step 3: Install Frontend Dependencies

```bash
cd "d:\Ticker Tracker\ticket-management-frontend"
npm install react-dropzone
```

**Expected Output:**
```
added 1 package, and audited XXX packages in Xs
```

---

## Step 4: Create Upload Directory

The backend code automatically creates the directory, but you can create it manually:

```bash
cd "d:\Ticker Tracker\node_backend_enterprise_full"
mkdir -p uploads\bulk
```

Or on Windows PowerShell:
```powershell
New-Item -ItemType Directory -Path "uploads\bulk" -Force
```

---

## Step 5: Start the Servers

### Start Backend
```bash
cd "d:\Ticker Tracker\node_backend_enterprise_full"
npm start
```

### Start Frontend (in a new terminal)
```bash
cd "d:\Ticker Tracker\ticket-management-frontend"
npm run dev
```

---

## Step 6: Test the Feature

1. Open your browser to the frontend URL (usually `http://localhost:5173`)
2. Login to your account
3. Navigate to Tickets page
4. Click the **"Bulk Upload"** button (green button next to "New Ticket")
5. Download the CSV template
6. Fill in some test data
7. Upload the file
8. View the results!

---

## 📝 Quick Test Data

Create a file called `test-tickets.csv` with this content:

```csv
Subject,Description,Priority,Status,Channel,Contact Name,Contact Email,Contact Phone,Account Name,Department,Product,Assigned Agent Email,Team,Due Date,Classification,Language,Tags
Test Ticket 1,This is a test ticket,high,open,email,John Doe,john@test.com,+1234567890,Test Corp,,,,,2025-12-20,,,
Test Ticket 2,Another test ticket,medium,open,web,Jane Smith,jane@test.com,+0987654321,Test Inc,,,,,2025-12-25,,,
Test Ticket 3,Third test ticket,low,open,phone,Bob Johnson,bob@test.com,+1122334455,Test LLC,,,,,2025-12-30,,,
```

Upload this file to test the feature!

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend dependencies installed (csv-parser, xlsx)
- [ ] Frontend dependencies installed (react-dropzone)
- [ ] Backend server running without errors
- [ ] Frontend server running without errors
- [ ] Can navigate to bulk upload page
- [ ] Can download CSV template
- [ ] Can upload CSV file
- [ ] Can see results after upload
- [ ] Tickets appear in ticket list

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'csv-parser'"
**Solution:** Install backend dependencies:
```bash
cd node_backend_enterprise_full
npm install csv-parser xlsx
```

### Issue: "Cannot find module 'react-dropzone'"
**Solution:** Install frontend dependencies:
```bash
cd ticket-management-frontend
npm install react-dropzone
```

### Issue: "ENOENT: no such file or directory, open '...\\uploads\\bulk\\...'"
**Solution:** The directory should be created automatically. If not, create it manually:
```bash
mkdir -p node_backend_enterprise_full/uploads/bulk
```

### Issue: "Only CSV and Excel files are allowed"
**Solution:** Make sure your file has .csv, .xlsx, or .xls extension

### Issue: "Maximum 1000 tickets allowed per upload"
**Solution:** Split your file into smaller batches of 1000 rows or less

### Issue: Template download doesn't work
**Solution:** Make sure the template file exists at:
```
node_backend_enterprise_full/src/templates/ticket-upload-template.csv
```

---

## 📞 Need Help?

1. Check [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for detailed documentation
2. Check [BULK_UPLOAD_IMPLEMENTATION_GUIDE.md](./BULK_UPLOAD_IMPLEMENTATION_GUIDE.md) for implementation details
3. Review error messages in browser console (F12)
4. Review backend server logs

---

## 🎉 You're All Set!

The bulk upload feature is now ready to use. Happy bulk uploading! 🚀

---

*Setup time: ~5 minutes*
*Last updated: 2025-12-10*
