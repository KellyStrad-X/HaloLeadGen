import { NextRequest, NextResponse } from 'next/server';
import {
  findOrCreateContractor,
  createCampaign,
} from '@/lib/firestore';

interface CampaignRequest {
  name: string;
  company: string;
  email: string;
  phone: string;
  neighborhoodName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CampaignRequest = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.company ||
      !body.email ||
      !body.phone ||
      !body.neighborhoodName
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate neighborhood length
    if (body.neighborhoodName.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            'Neighborhood name must be specific (at least 10 characters)',
        },
        { status: 400 }
      );
    }

    // Find or create contractor
    const contractorId = await findOrCreateContractor({
      name: body.name,
      company: body.company,
      email: body.email,
      phone: body.phone,
    });

    // Create campaign
    const campaignId = await createCampaign({
      contractorId,
      neighborhoodName: body.neighborhoodName,
    });

    return NextResponse.json(
      {
        success: true,
        campaignId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating campaign:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create campaign',
      },
      { status: 500 }
    );
  }
}
