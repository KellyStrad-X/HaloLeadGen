import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailer';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, source = 'hero-cta' } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Check for duplicate submission (same email within 24 hours)
    const oneDayAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const duplicateCheck = await db
      .collection('marketingLeads')
      .where('email', '==', email)
      .where('submittedAt', '>', oneDayAgo)
      .limit(1)
      .get();

    if (!duplicateCheck.empty) {
      return NextResponse.json(
        { error: 'You have already submitted a request recently' },
        { status: 429 }
      );
    }

    // Create lead document
    const leadData = {
      name,
      email,
      phone: phone || null,
      source,
      submittedAt: Timestamp.now(),
      utm_source: req.nextUrl.searchParams.get('utm_source') || null,
      utm_campaign: req.nextUrl.searchParams.get('utm_campaign') || null,
    };

    const leadRef = await db.collection('marketingLeads').add(leadData);

    // Send notification email to Kelly
    try {
      await sendEmail({
        to: 'kelly@haloleadgen.com',
        subject: `New Early Access Request from ${name}`,
        text: `
New early access request received!

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Source: ${source}
Submitted: ${new Date().toLocaleString()}

Lead ID: ${leadRef.id}
        `,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">New Early Access Request</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Source:</strong> ${source}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Lead ID: ${leadRef.id}</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the request if email fails
    }

    // Log analytics event
    try {
      await db.collection('analyticsEvents').add({
        eventType: 'form_submission',
        source,
        leadId: leadRef.id,
        timestamp: Timestamp.now(),
        userAgent: req.headers.get('user-agent') || 'unknown',
      });
    } catch (analyticsError) {
      console.error('Failed to log analytics:', analyticsError);
      // Don't fail the request if analytics fails
    }

    return NextResponse.json({
      success: true,
      leadId: leadRef.id,
    });
  } catch (error: any) {
    console.error('Marketing lead submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
