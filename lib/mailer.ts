/**
 * Email utility using Nodemailer
 * Sends lead notifications to contractors
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// SMTP Configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // Use TLS (use STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Ensure proper authentication for Google Workspace
  tls: {
    rejectUnauthorized: true,
  },
};

// Email sender info
const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
const fromName = process.env.SMTP_FROM_NAME || 'Halo Lead Generation';

/**
 * Create transporter instance (reusable)
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Check .env.local file.');
    }

    transporter = nodemailer.createTransport(smtpConfig);
  }
  return transporter;
}

/**
 * Send email
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html), // Fallback to stripped HTML if no text provided
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to,
      subject,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Send lead notification to contractor
 */
export async function sendLeadNotification({
  contractorName,
  contractorEmail,
  leadData,
  campaignData,
  landingPageUrl,
}: {
  contractorName: string;
  contractorEmail: string;
  leadData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes?: string;
    submittedAt: string;
  };
  campaignData: {
    neighborhoodName: string;
  };
  landingPageUrl: string;
}): Promise<boolean> {
  const subject = `New Lead from ${campaignData.neighborhoodName}`;

  // Format submitted date
  const submittedDate = new Date(leadData.submittedAt).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Build HTML email
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #00d4ff; font-size: 28px; font-weight: bold;">
                🎉 New Lead!
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e0e0; font-size: 16px;">
                From your <strong>${campaignData.neighborhoodName}</strong> campaign
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.5;">
                Hi <strong>${contractorName}</strong>,
              </p>
              <p style="margin: 15px 0 0 0; color: #333; font-size: 16px; line-height: 1.5;">
                Great news! You have a new lead from your Halo campaign.
              </p>
            </td>
          </tr>

          <!-- Lead Details Card -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #00d4ff; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px 0; color: #000; font-size: 18px; font-weight: bold;">
                      Homeowner Details
                    </h2>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px; width: 30%;">
                          <strong>Name:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #000; font-size: 14px;">
                          ${leadData.name}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                          <strong>Phone:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #000; font-size: 14px;">
                          <a href="tel:${leadData.phone}" style="color: #00d4ff; text-decoration: none;">${leadData.phone}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                          <strong>Email:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #000; font-size: 14px;">
                          <a href="mailto:${leadData.email}" style="color: #00d4ff; text-decoration: none;">${leadData.email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                          <strong>Address:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #000; font-size: 14px;">
                          ${leadData.address}
                        </td>
                      </tr>
                      ${leadData.notes ? `
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px; vertical-align: top;">
                          <strong>Notes:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #000; font-size: 14px;">
                          "${leadData.notes}"
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #666; font-size: 14px;">
                          <strong>Submitted:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #000; font-size: 14px;">
                          ${submittedDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Campaign Info -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 4px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #000; font-size: 16px; font-weight: bold;">
                      Campaign Details
                    </h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      <strong>Neighborhood:</strong> ${campaignData.neighborhoodName}
                    </p>
                    <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
                      <strong>Landing Page:</strong> <a href="${landingPageUrl}" style="color: #00d4ff; text-decoration: none;">${landingPageUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%); border-radius: 4px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #000; font-size: 16px; font-weight: bold;">
                      ⚡ Next Steps
                    </p>
                    <p style="margin: 10px 0 0 0; color: #000; font-size: 14px; line-height: 1.6;">
                      Contact this homeowner within <strong>24 hours</strong> for best results.<br>
                      Quick follow-up leads to higher conversion rates!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Powered by <strong style="color: #00d4ff;">Halo</strong> Lead Generation
              </p>
              <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">
                This is an automated notification from your lead capture system.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({
    to: contractorEmail,
    subject,
    html,
  });
}
