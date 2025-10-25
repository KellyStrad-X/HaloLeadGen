import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { getAllLeadsAdmin } from '@/lib/firestore-admin';
import { geocodeAddressServer } from '@/lib/geocoding';

interface MapLead {
  id: string;
  name: string;
  address: string | null;
  location: { lat: number; lng: number } | null;
  status: 'unscheduled' | 'first_attempt' | 'second_attempt' | 'third_attempt' | 'contacted';
  submittedAt: string;
  jobStatus: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decoded;

    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid auth token' },
        { status: 401 }
      );
    }

    const contractorId = decoded.uid;
    const { id: campaignId } = await params;

    // Fetch leads for this campaign
    // Note: getAllLeadsAdmin skips promoted leads by default, so we need to fetch both:
    // 1. Non-promoted leads (regular leads)
    // 2. Promoted scheduled/in-progress leads (jobs on calendar)
    const regularLeads = await getAllLeadsAdmin(contractorId, { campaignId });
    const scheduledLeads = await getAllLeadsAdmin(contractorId, { campaignId, jobStatus: 'scheduled' });

    // Merge and deduplicate (shouldn't be duplicates but just in case)
    const leadMap = new Map();
    [...regularLeads, ...scheduledLeads].forEach(lead => {
      leadMap.set(lead.id, lead);
    });
    const allLeads = Array.from(leadMap.values());

    // Exclude completed jobs from map
    const nonCompletedLeads = allLeads.filter(l => l.jobStatus !== 'completed');
    const adminDb = getAdminFirestore();

    // Geocode addresses and determine status for map display
    const mapLeads: MapLead[] = await Promise.all(
      nonCompletedLeads.map(async (lead) => {
        // Check if we have a cached geocoded location
        let location: { lat: number; lng: number } | null = null;

        if (lead.address) {
          // Try to get cached location from Firestore
          const leadDoc = await adminDb.collection('leads').doc(lead.id).get();
          const leadData = leadDoc.data();
          const cachedLocation = leadData?.geocodedLocation;

          // Use cache if address matches (in case address was updated)
          if (cachedLocation && cachedLocation.address === lead.address) {
            location = {
              lat: cachedLocation.lat,
              lng: cachedLocation.lng,
            };
          } else {
            // Cache miss or stale - geocode and cache the result
            const geocodeResult = await geocodeAddressServer(lead.address);
            if (geocodeResult) {
              location = geocodeResult.location;

              // Cache the result in Firestore for future requests
              await adminDb.collection('leads').doc(lead.id).update({
                geocodedLocation: {
                  lat: location.lat,
                  lng: location.lng,
                  address: lead.address, // Store address for cache invalidation
                  geocodedAt: new Date().toISOString(),
                },
              });
            }
          }
        }

        // Determine marker color based on lead status
        let status: 'unscheduled' | 'first_attempt' | 'second_attempt' | 'third_attempt' | 'contacted' = 'unscheduled';

        // Green - Contacted or Scheduled
        if (lead.jobStatus === 'contacted' || lead.jobStatus === 'scheduled') {
          status = 'contacted';
        }
        // Contact attempts (Yellow = 1st, Orange = 2nd, Red = 3rd)
        else if (lead.contactAttempt === 3) {
          status = 'third_attempt';
        } else if (lead.contactAttempt === 2) {
          status = 'second_attempt';
        } else if (lead.contactAttempt === 1) {
          status = 'first_attempt';
        }
        // Cyan - Unscheduled (no contact attempts yet)
        else {
          status = 'unscheduled';
        }

        return {
          id: lead.id,
          name: lead.name,
          address: lead.address,
          location,
          status,
          submittedAt: lead.submittedAt,
          jobStatus: lead.jobStatus,
        };
      })
    );

    // Filter out leads without valid locations
    const leadsWithLocations = mapLeads.filter(lead => lead.location !== null);
    const totalLeads = nonCompletedLeads.length;
    const leadsWithoutAddress = nonCompletedLeads.filter(l => !l.address).length;
    const leadsWithFailedGeocode = mapLeads.filter(l => !l.location).length - leadsWithoutAddress;

    return NextResponse.json({
      leads: leadsWithLocations,
      metadata: {
        totalLeads,
        mappedLeads: leadsWithLocations.length,
        leadsWithoutAddress,
        leadsWithFailedGeocode,
      },
    });
  } catch (error) {
    console.error('Error fetching campaign map leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
