import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

class NotificationService {
  constructor() {
    this.provider = process.env.EMAIL_SERVICE
    this.setupProvider();
  }

  setupProvider() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  async sendEmail({ fromName,from,to, subject, html, text }) {
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
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .logo-section {
            padding: 30px 40px 20px;
            background-color: #ffffff;
        }
        .content-section {
            padding: 20px 40px 40px;
            background-color: #ffffff;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        .message {
            font-size: 15px;
            color: #4a4a4a;
            margin-bottom: 25px;
            line-height: 1.6;
        }
        .organization-name {
            font-weight: 600;
            color: #1a1a1a;
        }
        .cta-button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #2d9f8f;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            margin: 10px 0 20px;
        }
        .expiry-note {
            font-size: 14px;
            color: #666;
            font-style: italic;
            margin-bottom: 25px;
        }
        .contact-section {
            font-size: 14px;
            color: #4a4a4a;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        .support-link {
            color: #2d9f8f;
            text-decoration: none;
        }
        .footer {
            background-color: #f9f9f9;
            padding: 30px 40px;
            font-size: 13px;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }
        .footer-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .footer-link {
            color: #2d9f8f;
            text-decoration: none;
        }
        .company-address {
            margin-top: 15px;
            line-height: 1.8;
        }
        .spam-notice {
            margin-top: 15px;
            font-size: 12px;
            color: #888;
        }
        
        @media only screen and (max-width: 600px) {
            .logo-section,
            .content-section,
            .footer {
                padding-left: 20px;
                padding-right: 20px;
            }
            .greeting {
                font-size: 20px;
            }
            .message {
                font-size: 14px;
            }
            .cta-button {
                display: block;
                text-align: center;
                padding: 12px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo-section">
            <svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="8" width="20" height="24" rx="3" fill="#FF6B6B" stroke="#FF6B6B" stroke-width="2"/>
                <rect x="30" y="8" width="20" height="24" rx="3" fill="#4ECDC4" stroke="#4ECDC4" stroke-width="2"/>
                <rect x="55" y="8" width="20" height="24" rx="3" fill="#FFE66D" stroke="#FFE66D" stroke-width="2"/>
                <rect x="80" y="8" width="15" height="24" rx="3" fill="#95E1D3" stroke="#95E1D3" stroke-width="2"/>
            </svg>
        </div>

        <div class="content-section">
            <h1 class="greeting">Hi ${data?.recipientName},</h1>
            
            <p class="message">
                You have been invited by the admin of the <span class="organization-name">${data?.organizationName}</span> to join their organization. Click below to either accept or reject the invitation.
            </p>

            <a href="${data?.invitationLink}" class="cta-button">View Invitation</a>

            <p class="expiry-note">
                This invitation will expire in ${data?.expiryDays} days.
            </p>

            <div class="contact-section">
                <p>If you have any trouble in accepting the invitation or if you think that you've received this email by mistake, please contact <a href="mailto:support@tickettracker.com" class="support-link">support@tickettracker.com</a>.</p>
            </div>

            <p style="margin-top: 30px; color: #4a4a4a; font-size: 14px;">
                Regards,<br>
                <strong>The Ticket Tracker Team</strong><br>
                <a href="https://www.tickettracker.com" class="support-link">www.tickettracker.com</a>
            </p>
        </div>

        <div class="footer">
            <p class="footer-title">Ticket Tracker</p>
            <div class="company-address">
                Your Company Address Here<br>
                City, State, ZIP Code, Country<br>
                Phone: +1 (555) 123-4567
            </div>
            
            <p class="spam-notice">
                This e-mail is generated from Ticket Tracker. If you think this is SPAM, please report to 
                <a href="mailto:abuse@tickettracker.com" class="footer-link">abuse@tickettracker.com</a> for immediate action.
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