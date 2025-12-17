# SendGrid 401 Unauthorized Error - Troubleshooting Guide

## Error Details
```
ResponseError: Unauthorized
code: 401
```

This error occurs when SendGrid rejects the API key used for authentication.

## Common Causes & Solutions

### 1. **Invalid or Expired API Key**

The API key in your `.env` file may be:
- Invalid
- Expired
- Revoked
- From a different SendGrid account

**Solution:**
1. Log in to your SendGrid account: https://app.sendgrid.com/
2. Go to **Settings** → **API Keys**
3. Create a new API key with **Full Access** or at minimum **Mail Send** permissions
4. Copy the new API key (you'll only see it once!)
5. Update your `.env` file:

```env
SENDGRID_API_KEY=SG.your_new_api_key_here
EMAIL_FROM_ADDRESS=your-verified-sender@yourdomain.com
```

### 2. **Missing or Incorrect .env Configuration**

**Check if .env file exists:**
```bash
# In your backend directory
ls -la .env
# or on Windows
dir .env
```

**Verify .env is being loaded:**

Add this debug code temporarily to `src/services/notificationService.js`:

```javascript
setupProvider() {
  console.log('🔑 SendGrid API Key:', process.env.SENDGRID_API_KEY ? 'Found' : 'MISSING!');
  console.log('📧 Email From:', process.env.EMAIL_FROM_ADDRESS);
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is not set in environment variables!');
    return;
  }
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
```

### 3. **Unverified Sender Email**

SendGrid requires you to verify the sender email address.

**Solution:**
1. Go to SendGrid → **Settings** → **Sender Authentication**
2. Either:
   - **Single Sender Verification**: Verify a single email address
   - **Domain Authentication**: Verify your entire domain (recommended for production)
3. Update `EMAIL_FROM_ADDRESS` in `.env` to match the verified email

### 4. **API Key Permissions**

The API key might not have the correct permissions.

**Solution:**
1. Go to SendGrid → **Settings** → **API Keys**
2. Click on your API key
3. Ensure it has **Mail Send** permission (at minimum)
4. For full functionality, grant **Full Access**

### 5. **Environment Variables Not Loading**

**Check dotenv configuration:**

In your main server file (e.g., `server.js` or `index.js`), ensure dotenv is loaded at the very top:

```javascript
import dotenv from 'dotenv';
dotenv.config(); // Must be called before importing other modules

import express from 'express';
// ... other imports
```

## Quick Fix Steps

### Step 1: Create a New SendGrid API Key

1. Visit: https://app.sendgrid.com/settings/api_keys
2. Click **Create API Key**
3. Name: `Ticket Tracker Production` (or similar)
4. Permissions: **Full Access** (or at minimum **Mail Send**)
5. Click **Create & View**
6. **Copy the API key immediately** (you won't see it again!)

### Step 2: Update Your .env File

```env
# Email Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

**Important:** Replace with your actual values!

### Step 3: Verify Sender Email

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click **Create New Sender**
3. Fill in your details
4. Check your email and click the verification link
5. Use this verified email as `EMAIL_FROM_ADDRESS`

### Step 4: Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
# or
node server.js
```

### Step 5: Test Email Sending

Add a test endpoint to verify email is working:

```javascript
// In your routes or server.js
router.post('/test-email', async (req, res) => {
  try {
    const result = await notificationService.sendEmail({
      fromName: 'Test',
      to: 'your-email@example.com',
      subject: 'Test Email',
      html: '<h1>This is a test email</h1><p>If you receive this, SendGrid is working!</p>'
    });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Alternative: Use Console Logging (Development Only)

If you want to bypass email sending during development, you can modify the notification service:

```javascript
async sendEmail({ fromName, from, to, subject, html, text }) {
  // Development mode - just log instead of sending
  if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
    console.log('📧 [DEV MODE] Email would be sent:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('From:', fromName, from);
    return { success: true, dev: true };
  }

  // Production mode - actually send email
  const emailData = {
    from: {
      name: fromName || 'EventCRM',
      address: process.env.EMAIL_FROM_ADDRESS
    },
    to,
    subject,
    html,
    text: text || this.stripHtml(html)
  };
  
  try {
    await sgMail.send({
      ...emailData,
      from: `${emailData.from.name} <${emailData.from.address}>`
    });

    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}
```

## Verification Checklist

- [ ] SendGrid account is active
- [ ] New API key created with correct permissions
- [ ] API key copied to `.env` file
- [ ] Sender email is verified in SendGrid
- [ ] `EMAIL_FROM_ADDRESS` matches verified sender
- [ ] `.env` file is in the correct directory
- [ ] Server has been restarted after `.env` changes
- [ ] No typos in environment variable names
- [ ] `dotenv.config()` is called before other imports

## Still Not Working?

### Check SendGrid Activity Feed

1. Go to: https://app.sendgrid.com/email_activity
2. Look for recent email attempts
3. Check for error messages

### Enable Debug Mode

Add more detailed logging:

```javascript
setupProvider() {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  console.log('=== SendGrid Configuration ===');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key starts with SG.:', apiKey?.startsWith('SG.'));
  console.log('API Key length:', apiKey?.length);
  console.log('From Address:', process.env.EMAIL_FROM_ADDRESS);
  console.log('============================');
  
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  } else {
    console.error('⚠️  WARNING: SENDGRID_API_KEY not found!');
  }
}
```

### Contact SendGrid Support

If the issue persists:
1. Check SendGrid status: https://status.sendgrid.com/
2. Contact SendGrid support with your API key details (don't share the actual key)

## Production Recommendations

1. **Use Domain Authentication** instead of single sender verification
2. **Store API keys securely** (use environment variables, never commit to git)
3. **Monitor email deliverability** in SendGrid dashboard
4. **Set up email templates** in SendGrid for better management
5. **Implement retry logic** for failed emails
6. **Add email queue** for high-volume sending (e.g., using Bull or RabbitMQ)

## Example Working Configuration

**.env file:**
```env
# Server
PORT=4000
NODE_ENV=production

# SendGrid
SENDGRID_API_KEY=SG.abcd1234efgh5678ijkl9012mnop3456.qrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz
EMAIL_FROM_ADDRESS=noreply@tickettracker.com
EMAIL_FROM_NAME=Ticket Tracker

# Other configs...
```

**notificationService.js:**
```javascript
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

class NotificationService {
  constructor() {
    this.setupProvider();
  }

  setupProvider() {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️  SendGrid API key not configured');
      return;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid configured');
  }

  async sendEmail({ fromName, to, subject, html, text }) {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('📧 [SKIP] Email not sent - SendGrid not configured');
      return { success: false, error: 'SendGrid not configured' };
    }

    try {
      await sgMail.send({
        from: `${fromName || 'Ticket Tracker'} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      });

      console.log(`✅ Email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Email error:', error.response?.body || error.message);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

export const notificationService = new NotificationService();
export default notificationService;
```

---

**Next Steps:**
1. Create a new SendGrid API key
2. Update your `.env` file
3. Verify your sender email
4. Restart your server
5. Test email sending
