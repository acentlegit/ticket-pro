import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

class NotificationService {
  constructor() {
    this.provider = process.env.EMAIL_SERVICE
    this.setupProvider();
  }

  setupProvider() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;

    console.log('=== SendGrid Configuration ===');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key format valid:', apiKey?.startsWith('SG.'));
    console.log('From Address:', fromAddress);
    console.log('============================');

    if (!apiKey) {
      console.warn('⚠️  WARNING: SENDGRID_API_KEY not found in environment variables!');
      console.warn('⚠️  Email sending will fail. Please add SENDGRID_API_KEY to your .env file');
      console.warn('⚠️  See SENDGRID_401_FIX.md for troubleshooting steps');
      return;
    }

    if (!apiKey.startsWith('SG.')) {
      console.warn('⚠️  WARNING: SENDGRID_API_KEY format appears invalid (should start with "SG.")');
    }

    if (!fromAddress) {
      console.warn('⚠️  WARNING: EMAIL_FROM_ADDRESS not found in environment variables!');
    }

    try {
      sgMail.setApiKey(apiKey);
      console.log('✅ SendGrid API key configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure SendGrid:', error.message);
    }
  }

  async sendEmail({ fromName, from, to, subject, html, text }) {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ Cannot send email: SENDGRID_API_KEY not configured');
      console.error('📝 Please add SENDGRID_API_KEY to your .env file');
      return { success: false, error: 'SendGrid not configured' };
    }

    if (!process.env.EMAIL_FROM_ADDRESS) {
      console.error('❌ Cannot send email: EMAIL_FROM_ADDRESS not configured');
      return { success: false, error: 'Email from address not configured' };
    }

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

      console.log(`✅ Email sent successfully to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error);

      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.code);
        console.error('Response body:', JSON.stringify(error.response.body, null, 2));

        // Provide helpful error messages
        if (error.code === 401) {
          console.error('');
          console.error('🔑 AUTHENTICATION ERROR:');
          console.error('   Your SendGrid API key is invalid or expired.');
          console.error('   Please check SENDGRID_401_FIX.md for solutions.');
          console.error('');
        } else if (error.code === 403) {
          console.error('');
          console.error('🚫 PERMISSION ERROR:');
          console.error('   Your API key does not have permission to send emails.');
          console.error('   Please create a new API key with "Mail Send" permissions.');
          console.error('');
        }
      }

      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  async sendInvitationsToAgent(data) {
    const template = this.getTemplate('agentInvitation', data);
    return await this.sendEmail({
      fromName: 'Ticket Tracker',
      from: data.inviterEmail,
      to: data.recipientEmail,
      subject: template.subject,
      html: template.html
    });
  }

  getTemplate(type, data) {
    const templates = {
      agentInvitation: {
        subject: `Invitation to join the organization`,
        html: `
           <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organization Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0;">
    <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div class="logo-section" style="padding: 30px 40px 20px; background-color: #ffffff;">
            <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="8" width="20" height="24" rx="3" fill="#FF6B6B" stroke="#FF6B6B" stroke-width="2"/>
                <rect x="30" y="8" width="20" height="24" rx="3" fill="#4ECDC4" stroke="#4ECDC4" stroke-width="2"/>
                <rect x="55" y="8" width="20" height="24" rx="3" fill="#FFE66D" stroke="#FFE66D" stroke-width="2"/>
                <rect x="80" y="8" width="15" height="24" rx="3" fill="#95E1D3" stroke="#95E1D3" stroke-width="2"/>
            </svg>
        </div>

        <div class="content-section" style="padding: 20px 40px 40px; background-color: #ffffff;">
            <h1 class="greeting" style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px;">Hi ${data?.recipientName},</h1>
            
            <p class="message" style="font-size: 15px; color: #4a4a4a; margin-bottom: 25px; line-height: 1.6;">
                You have been invited by the admin of the <span class="organization-name" style="font-weight: 600; color: #1a1a1a;">${data?.organizationName}</span> to join their organization. Click below to either accept or reject the invitation.
            </p>

            <a href="${data?.invitationLink}" class="cta-button" style="display: inline-block; padding: 14px 32px; background-color: #2d9f8f; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 10px 0 20px;">View Invitation</a>

            <p class="expiry-note" style="font-size: 14px; color: #666; font-style: italic; margin-bottom: 25px;">
                This invitation will expire in ${data?.expiryDays} days.
            </p>

            <div class="contact-section" style="font-size: 14px; color: #4a4a4a; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p>If you have any trouble in accepting the invitation or if you think that you've received this email by mistake, please contact <a href="mailto:support@tickettracker.com" class="support-link" style="color: #2d9f8f; text-decoration: none;">support@tickettracker.com</a>.</p>
            </div>

            <p style="margin-top: 30px; color: #4a4a4a; font-size: 14px;">
                Regards,<br>
                <strong>The Ticket Tracker Team</strong><br>
                <a href="sales@opsnow.live" class="support-link" style="color: #2d9f8f; text-decoration: none;">sales@opsnow.live</a>
            </p>
        </div>

        <div class="footer" style="background-color: #f9f9f9; padding: 30px 40px; font-size: 13px; color: #666; border-top: 1px solid #e0e0e0;">
            <p class="footer-title" style="font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">Ticket Tracker</p>
            <div class="company-address" style="margin-top: 15px; line-height: 1.8;">
                Your Company Address Here<br>
                City, State, ZIP Code, Country<br>
                Phone: +1 (703) 4239-032
            </div>
            
            <p class="spam-notice" style="margin-top: 15px; font-size: 12px; color: #888;">
                This e-mail is generated from Ticket Tracker. If you think this is SPAM, please report to 
                <a href="mailto:acentledev@acentle.com" class="footer-link" style="color: #2d9f8f; text-decoration: none;">acentledev@acentle.com</a> for immediate action.
            </p>
        </div>
    </div>
</body>
</html>
        `
      },
      ticketConfirmation: {
        subject: `Ticket Confirmation - ${data.eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Your tickets are confirmed!</h2>
            <p>Dear ${data.name},</p>
            <p>Thank you for purchasing tickets for <strong>${data.eventName}</strong>.</p>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Ticket Type:</strong> ${data.ticketType}</p>
              <p><strong>Quantity:</strong> ${data.quantity}</p> 
              <p><strong>Total Amount:</strong> $${(data.totalAmount / 100).toFixed(2)}</p>
              <p><strong>Order ID:</strong> ${data.transactionId}</p>
            </div>
            <p>Please bring this confirmation to the event or save it on your mobile device.</p>
            <p style="color: #6b7280; font-size: 14px;">— ${process.env.EMAIL_FROM_NAME}</p>
          </div>
        `
      },
    };

    return templates[type] || null;
  }

}

export const notificationService = new NotificationService();
export default notificationService;