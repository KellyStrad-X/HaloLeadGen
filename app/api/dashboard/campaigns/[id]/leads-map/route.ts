import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { getAllLeadsAdmin } from '@/lib/firestore-admin';
import { geocodeAddressServer } from '@/lib/geocoding';

interface MapLead {
  id: string;
  name: string;
  location: { lat: number; lng: number } | null;
  status: 'scheduled' | 'tentative' | 'uncontacted';
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
    const allLeads = await getAllLeadsAdmin(contractorId, { campaignId });
    const adminDb = getAdminFirestore();

    // Geocode addresses and determine status for map display
    const mapLeads: MapLead[] = await Promise.all(
      allLeads.map(async (lead) => {
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
        let status: 'scheduled' | 'tentative' | 'uncontacted' = 'uncontacted';

        if (lead.jobStatus === 'scheduled' || lead.jobStatus === 'completed') {
          status = 'scheduled'; // Green - confirmed job
        } else if (lead.tentativeDate || lead.jobStatus === 'contacted') {
          status = 'tentative'; // Yellow - in progress
        } else {
          // Check if uncontacted for > 24 hours
          const submittedDate = new Date(lead.submittedAt);
          const hoursSinceSubmission = (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60);

          if (hoursSinceSubmission > 24 && !lead.contactAttempt) {
            status = 'uncontacted'; // Red - needs attention
          } else {
            status = 'tentative'; // Yellow - recent or being worked
          }
        }

        return {
          id: lead.id,
          name: lead.name,
          location,
          status,
          submittedAt: lead.submittedAt,
          jobStatus: lead.jobStatus,
        };
      })
    );

    // Filter out leads without valid locations
    const leadsWithLocations = mapLeads.filter(lead => lead.location !== null);
    const totalLeads = allLeads.length;
    const leadsWithoutAddress = allLeads.filter(l => !l.address).length;
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
