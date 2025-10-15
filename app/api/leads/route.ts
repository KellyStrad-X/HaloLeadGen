import { NextRequest, NextResponse } from 'next/server';
import { getCampaignById, getCampaignBySlug, isDuplicateLead, submitLead } from '@/lib/firestore';
import { sendLeadNotification } from '@/lib/mailer';

interface LeadSubmission {
  campaign_id: string; // Firestore uses string IDs
  name: string;
  address: string;
  email: string;
  phone: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadSubmission = await request.json();

    // Validate required fields
    if (!body.campaign_id || !body.name || !body.address || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format (10 digits)
    const phoneDigits = body.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: 'Phone number must be 10 digits' },
        { status: 400 }
      );
    }

    // Validate name length
    if (body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Validate address length
    if (body.address.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a complete address' },
        { status: 400 }
      );
    }

    // Check if campaign exists and is active
    const campaign = await getCampaignById(body.campaign_id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.campaignStatus !== 'Active') {
      return NextResponse.json(
        { error: 'This campaign is no longer accepting submissions' },
        { status: 400 }
      );
    }

    // Check for duplicate submission (same email + campaign within 1 hour)
    const isDuplicate = await isDuplicateLead(
      body.campaign_id,
      body.email.trim().toLowerCase()
    );

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'You have already submitted a request recently. We\'ll be in touch soon!' },
        { status: 409 }
      );
    }

    // Insert lead into Firestore
    const leadId = await submitLead({
      campaignId: body.campaign_id,
      name: body.name,
      address: body.address,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
    });

    // Send email notification to contractor (async, don't block response)
    // Note: We need to get the full campaign with contractor info
    console.log('[Lead Email] Starting email notification process', {
      campaignId: campaign.id,
      slug: campaign.pageSlug,
      status: campaign.campaignStatus,
    });

    const campaignWithData = await getCampaignBySlug(campaign.pageSlug);

    if (campaignWithData) {
      console.log('[Lead Email] Campaign data fetched successfully', {
        contractorName: campaignWithData.contractor.name,
        contractorEmail: campaignWithData.contractor.email,
        photoCount: campaignWithData.photos.length,
      });

      // Send email notification (await to ensure completion before function terminates)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const landingPageUrl = `${baseUrl}/c/${campaign.pageSlug}`;
      const campaignTitle =
        campaign.campaignName || campaign.neighborhoodName || 'Halo Campaign';
      const campaignLocation =
        campaign.showcaseAddress ||
        campaign.neighborhoodName ||
        campaignTitle;

      console.log('[Lead Email] Calling sendLeadNotification', {
        to: campaignWithData.contractor.email,
        subject: `New Lead from ${campaignTitle}`,
      });

      // Await email sending to ensure it completes before function terminates
      try {
        await sendLeadNotification({
          contractorName: campaignWithData.contractor.name,
          contractorEmail: campaignWithData.contractor.email,
          leadData: {
            name: body.name,
            email: body.email,
            phone: body.phone,
            address: body.address,
            notes: body.notes,
            submittedAt: new Date().toISOString(),
          },
          campaignData: {
            campaignName: campaignTitle,
            showcaseAddress: campaignLocation,
            campaignStatus: campaign.campaignStatus,
            jobStatus: campaign.jobStatus || null,
          },
          landingPageUrl,
        });
        console.log('[Lead Email] Email sent successfully');
      } catch (error) {
        // Log error but don't fail the request
        console.error('[Lead Email] Failed to send email notification:', error);
        console.error('[Lead Email] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
        });
      }
    } else {
      console.error('[Lead Email] Could not fetch campaign data for email notification', {
        campaignId: campaign.id,
        slug: campaign.pageSlug,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you! We\'ll contact you within 24 hours.',
        leadId,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle GET requests (not allowed)
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
