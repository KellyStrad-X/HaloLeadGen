/**
 * Test endpoint for verifying SMTP configuration
 * DELETE THIS FILE after testing is complete
 *
 * Usage: POST /api/test-email with JSON body:
 * { "to": "your-email@example.com" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    // Check if SMTP credentials are configured
    const smtpConfigured = !!(
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_HOST
    );

    if (!smtpConfigured) {
      return NextResponse.json(
        {
          error: 'SMTP not configured',
          details: {
            SMTP_USER: !!process.env.SMTP_USER,
            SMTP_PASS: !!process.env.SMTP_PASS,
            SMTP_HOST: !!process.env.SMTP_HOST,
            SMTP_PORT: !!process.env.SMTP_PORT,
          },
        },
        { status: 500 }
      );
    }

    // Try to send test email
    console.log('Attempting to send test email to:', to);

    const success = await sendEmail({
      to,
      subject: 'Halo Email Test',
      html: `
        <h1>✅ Email Test Successful</h1>
        <p>If you're reading this, your SMTP configuration is working correctly!</p>
        <hr>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>SMTP User: ${process.env.SMTP_USER}</li>
          <li>From Email: ${process.env.SMTP_FROM || process.env.SMTP_USER}</li>
          <li>From Name: ${process.env.SMTP_FROM_NAME || 'Halo Lead Generation'}</li>
        </ul>
        <p><em>This is a test email from your Halo Lead Generation platform.</em></p>
      `,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        config: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
        },
      });
    } else {
      return NextResponse.json(
        {
          error: 'Email sending failed',
          message: 'Check server logs for detailed error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      { status: 500 }
    );
  }
}

// GET request to show usage instructions
export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint',
    usage: 'POST /api/test-email with JSON body: { "to": "your-email@example.com" }',
    note: 'DELETE THIS ENDPOINT after testing is complete',
  });
}
