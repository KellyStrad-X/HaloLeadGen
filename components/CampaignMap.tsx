'use client';

import { useEffect, useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useAuth } from '@/lib/auth-context';
import { useDashboardSidebar } from '@/lib/dashboard-sidebar-context';
import MapModal from './MapModal';
import Image from 'next/image';

interface Location {
  lat: number;
  lng: number;
}

interface Campaign {
  id: string;
  campaignName: string;
  showcaseAddress: string | null;
  jobStatus: 'Completed' | 'Pending' | null;
  campaignStatus: 'Active' | 'Inactive';
  location?: Location | null;
  leadCount?: number;
}

interface MapLead {
  id: string;
  name: string;
  location: Location;
  status: 'unscheduled' | 'first_attempt' | 'second_attempt' | 'third_attempt' | 'contacted';
  submittedAt: string;
  jobStatus: string;
}

interface LeadsMapMetadata {
  totalLeads: number;
  mappedLeads: number;
  leadsWithoutAddress: number;
  leadsWithFailedGeocode: number;
}

// Get lead marker color based on status
function getLeadMarkerColor(status: 'unscheduled' | 'first_attempt' | 'second_attempt' | 'third_attempt' | 'contacted'): string {
  switch (status) {
    case 'unscheduled':
      return '#06b6d4'; // Cyan - no contact attempts yet (matches calendar)
    case 'first_attempt':
      return '#eab308'; // Yellow - 1st contact attempt
    case 'second_attempt':
      return '#f97316'; // Orange - 2nd contact attempt
    case 'third_attempt':
      return '#ef4444'; // Red - 3rd contact attempt
    case 'contacted':
      return '#10b981'; // Green - contacted or scheduled
    default:
      return '#6b7280'; // Gray fallback
  }
}

export default function CampaignMap() {
  const { user } = useAuth();
  const { openCampaignDetails, openLeadDetails } = useDashboardSidebar();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: 29.7604, lng: -95.3698 });
  const [mapZoom, setMapZoom] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCampaign, setHoveredCampaign] = useState<string | null>(null);
  const [hoveredLead, setHoveredLead] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // New state for interactive zoom functionality
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignLeads, setCampaignLeads] = useState<MapLead[]>([]);
  const [leadsMetadata, setLeadsMetadata] = useState<LeadsMapMetadata | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Fetch leads for a selected campaign
  const fetchCampaignLeads = useCallback(async (campaignId: string) => {
    if (!user) return;

    setLoadingLeads(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/dashboard/campaigns/${campaignId}/leads-map`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaignLeads(data.leads || []);
        setLeadsMetadata(data.metadata || null);
      } else {
        console.error('Failed to fetch campaign leads');
        setCampaignLeads([]);
        setLeadsMetadata(null);
      }
    } catch (error) {
      console.error('Error fetching campaign leads:', error);
      setCampaignLeads([]);
      setLeadsMetadata(null);
    } finally {
      setLoadingLeads(false);
    }
  }, [user]);

  // Handle campaign marker click - toggle zoom in/out
  const handleCampaignClick = (campaign: Campaign) => {
    if (!campaign.location || !mapInstance) return;

    if (selectedCampaignId === campaign.id) {
      // Level 3: Zoom out - return to overview
      setSelectedCampaignId(null);
      setCampaignLeads([]);
      setLeadsMetadata(null);

      // Fit bounds to show all campaigns
      if (campaigns.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        campaigns.forEach((c) => {
          if (c.location) {
            bounds.extend(c.location);
          }
        });
        mapInstance.fitBounds(bounds);
      }
    } else {
      // Level 2: Zoom in - show leads for this campaign
      setSelectedCampaignId(campaign.id);
      mapInstance.panTo(campaign.location);
      mapInstance.setZoom(14);

      // Fetch leads for this campaign
      fetchCampaignLeads(campaign.id);
    }
  };

  const handleMarkerHover = (campaignId: string) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setHoveredCampaign(campaignId);
  };

  const handleMarkerLeave = () => {
    // Add delay before hiding to prevent flicker
    const timeout = setTimeout(() => {
      setHoveredCampaign(null);
    }, 100);
    setHoverTimeout(timeout);
  };

  const handleLeadHover = (leadId: string) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setHoveredLead(leadId);
  };

  const handleLeadLeave = () => {
    // Add delay before hiding to prevent flicker
    const timeout = setTimeout(() => {
      setHoveredLead(null);
    }, 100);
    setHoverTimeout(timeout);
  };

  const handleLeadClick = (leadId: string) => {
    if (selectedCampaignId) {
      openLeadDetails(leadId, selectedCampaignId);
    }
  };

  const fetchCampaigns = useCallback(async () => {
    if (!user || !apiKey) {
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/dashboard/campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch campaigns');
        setLoading(false);
        return;
      }

      const data = await response.json();
      const allCampaigns: Campaign[] = data.campaigns;

      // Filter campaigns that have geocoded locations
      const campaignsWithLocations = allCampaigns.filter(
        (c) => c.location && c.location.lat && c.location.lng
      );

      if (campaignsWithLocations.length === 0) {
        setLoading(false);
        return;
      }

      setCampaigns(campaignsWithLocations);

      // Calculate center and zoom to fit all markers
      if (campaignsWithLocations.length > 0) {
        const bounds = campaignsWithLocations.reduce(
          (acc, c) => ({
            minLat: Math.min(acc.minLat, c.location!.lat),
            maxLat: Math.max(acc.maxLat, c.location!.lat),
            minLng: Math.min(acc.minLng, c.location!.lng),
            maxLng: Math.max(acc.maxLng, c.location!.lng),
          }),
          {
            minLat: campaignsWithLocations[0].location!.lat,
            maxLat: campaignsWithLocations[0].location!.lat,
            minLng: campaignsWithLocations[0].location!.lng,
            maxLng: campaignsWithLocations[0].location!.lng,
          }
        );

        const centerLat = (bounds.minLat + bounds.maxLat) / 2;
        const centerLng = (bounds.minLng + bounds.maxLng) / 2;

        setMapCenter({ lat: centerLat, lng: centerLng });

        // Simple zoom calculation based on bounds
        const latDiff = bounds.maxLat - bounds.minLat;
        const lngDiff = bounds.maxLng - bounds.minLng;
        const maxDiff = Math.max(latDiff, lngDiff);

        if (maxDiff < 0.01) setMapZoom(14);
        else if (maxDiff < 0.05) setMapZoom(12);
        else if (maxDiff < 0.1) setMapZoom(11);
        else if (maxDiff < 0.5) setMapZoom(10);
        else if (maxDiff < 1) setMapZoom(9);
        else setMapZoom(8);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setLoading(false);
    }
  }, [user, apiKey]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (!apiKey) {
    return (
      <div className="h-[480px] flex items-center justify-center bg-[#0d1117]/40 rounded-lg">
        <p className="text-gray-400">Map unavailable: API key not configured</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[480px] flex items-center justify-center bg-[#0d1117]/40 rounded-lg">
        <p className="text-gray-400">Loading campaign locations...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="h-[480px] flex items-center justify-center bg-[#0d1117]/40 rounded-lg">
        <p className="text-gray-400">No campaigns with addresses to display</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Legend and Expand Button */}
        <div className="flex items-center justify-between">
          {!selectedCampaignId ? (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="text-gray-400 mr-2">💡 Click H logo to view leads</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-gray-300">Active</span>
              </div>
              <div className="flex items-center gap-2 opacity-40">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-300">Inactive</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="text-gray-400 mr-2">💡 Click H logo again to zoom out</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-gray-300">Unscheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-gray-300">1st Attempt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                <span className="text-gray-300">2nd Attempt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-gray-300">3rd Attempt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-gray-300">Contacted</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            Expand
          </button>
        </div>

        {/* Map */}
        <div className="h-[480px] w-full rounded-lg overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={mapZoom}
              {...(mapId && { mapId })}
              style={{ width: '100%', height: '100%' }}
              onCameraChanged={(ev) => {
                if (ev.map && !mapInstance) {
                  setMapInstance(ev.map);
                }
              }}
            >
              {/* Campaign H Logo Markers */}
              {campaigns.map((campaign) =>
                campaign.location ? (
                  <div key={campaign.id}>
                    <AdvancedMarker
                      position={campaign.location}
                      onClick={() => handleCampaignClick(campaign)}
                      onMouseEnter={() => handleMarkerHover(campaign.id)}
                      onMouseLeave={handleMarkerLeave}
                    >
                      <div className="relative">
                        {selectedCampaignId === campaign.id && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="pulse-ring"></div>
                          </div>
                        )}
                        <div
                          className="relative w-10 h-10 rounded-full bg-orange-500/60 shadow-lg flex items-center justify-center border-2 border-orange-600/60 cursor-pointer hover:scale-110 transition-transform"
                          style={{
                            opacity: campaign.campaignStatus === 'Active' ? 1.0 : 0.4,
                          }}
                        >
                          <Image
                            src="/h-logo.png"
                            alt={campaign.campaignName}
                            width={28}
                            height={28}
                            className="w-7 h-7 object-contain"
                          />
                        </div>
                      </div>
                    </AdvancedMarker>

                    {hoveredCampaign === campaign.id && (
                      <InfoWindow
                        position={campaign.location}
                        pixelOffset={[0, -40]}
                        onCloseClick={() => setHoveredCampaign(null)}
                      >
                        <div
                          className="p-2 min-w-[200px]"
                          onMouseEnter={() => handleMarkerHover(campaign.id)}
                          onMouseLeave={handleMarkerLeave}
                        >
                          <h3 className="font-bold text-gray-900 mb-2">
                            {campaign.campaignName}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Campaign:</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  campaign.campaignStatus === 'Active'
                                    ? 'bg-cyan-100 text-cyan-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {campaign.campaignStatus}
                              </span>
                            </div>
                            {campaign.jobStatus && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Job Status:</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    campaign.jobStatus === 'Completed'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  {campaign.jobStatus}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Leads:</span>
                              <span className="font-semibold text-gray-900">
                                {campaign.leadCount || 0}
                              </span>
                            </div>
                            {campaign.showcaseAddress && (
                              <div className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-200">
                                {campaign.showcaseAddress}
                              </div>
                            )}
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </div>
                ) : null
              )}

              {/* Lead Markers - Only shown when a campaign is selected */}
              {selectedCampaignId && campaignLeads.map((lead) => (
                <div key={lead.id}>
                  <AdvancedMarker
                    position={lead.location}
                    onClick={() => handleLeadClick(lead.id)}
                    onMouseEnter={() => handleLeadHover(lead.id)}
                    onMouseLeave={handleLeadLeave}
                  >
                    <div className="cursor-pointer hover:scale-110 transition-transform">
                      <Pin
                        background={getLeadMarkerColor(lead.status)}
                        borderColor="#ffffff"
                        glyphColor="#ffffff"
                      />
                    </div>
                  </AdvancedMarker>

                  {hoveredLead === lead.id && (
                    <InfoWindow
                      position={lead.location}
                      pixelOffset={[0, -35]}
                      onCloseClick={() => setHoveredLead(null)}
                    >
                      <div
                        className="p-2 min-w-[200px]"
                        onMouseEnter={() => handleLeadHover(lead.id)}
                        onMouseLeave={handleLeadLeave}
                      >
                        <h3 className="font-bold text-gray-900 mb-2">
                          {lead.name}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Status:</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                lead.status === 'contacted'
                                  ? 'bg-green-100 text-green-700'
                                  : lead.status === 'third_attempt'
                                  ? 'bg-red-100 text-red-700'
                                  : lead.status === 'second_attempt'
                                  ? 'bg-orange-100 text-orange-700'
                                  : lead.status === 'first_attempt'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-cyan-100 text-cyan-700'
                              }`}
                            >
                              {lead.status === 'contacted' && 'Scheduled'}
                              {lead.status === 'third_attempt' && '3rd Attempt'}
                              {lead.status === 'second_attempt' && '2nd Attempt'}
                              {lead.status === 'first_attempt' && '1st Attempt'}
                              {lead.status === 'unscheduled' && 'Unscheduled'}
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-200">
                            Submitted: {new Date(lead.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-cyan-600 text-xs font-medium mt-2">
                            Click to view details →
                          </div>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </div>
              ))}

              {/* Lead Count Display - Always show when campaign selected */}
              {selectedCampaignId && !loadingLeads && leadsMetadata && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#1e2227] border border-[#373e47] rounded-lg px-4 py-2 shadow-lg max-w-sm">
                  {leadsMetadata.totalLeads === 0 ? (
                    <p className="text-gray-300 text-sm">
                      No leads yet for this campaign
                    </p>
                  ) : campaignLeads.length === 0 ? (
                    <div className="text-gray-300 text-sm space-y-1">
                      <p className="font-medium">
                        {leadsMetadata.totalLeads} lead{leadsMetadata.totalLeads !== 1 ? 's' : ''}, but no addresses to map
                      </p>
                      {leadsMetadata.leadsWithoutAddress > 0 && (
                        <p className="text-xs text-gray-400">
                          • {leadsMetadata.leadsWithoutAddress} lead{leadsMetadata.leadsWithoutAddress !== 1 ? 's' : ''} without address
                        </p>
                      )}
                      {leadsMetadata.leadsWithFailedGeocode > 0 && (
                        <p className="text-xs text-gray-400">
                          • {leadsMetadata.leadsWithFailedGeocode} address{leadsMetadata.leadsWithFailedGeocode !== 1 ? 'es' : ''} could not be geocoded
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-300 text-sm">
                      <p className="font-medium">
                        Showing {campaignLeads.length} of {leadsMetadata.totalLeads} lead{leadsMetadata.totalLeads !== 1 ? 's' : ''}
                      </p>
                      {leadsMetadata.totalLeads !== campaignLeads.length && (
                        <p className="text-xs text-gray-400 mt-1">
                          {leadsMetadata.leadsWithoutAddress > 0 && `${leadsMetadata.leadsWithoutAddress} without address`}
                          {leadsMetadata.leadsWithoutAddress > 0 && leadsMetadata.leadsWithFailedGeocode > 0 && ', '}
                          {leadsMetadata.leadsWithFailedGeocode > 0 && `${leadsMetadata.leadsWithFailedGeocode} failed to geocode`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Map>
          </APIProvider>
        </div>
      </div>

      {/* Full-Screen Modal */}
      <MapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaigns={campaigns}
        center={mapCenter}
        zoom={mapZoom}
        onMarkerClick={openCampaignDetails}
      />

      {/* Pulsing Animation Styles */}
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #06b6d4;
          animation: pulse-ring 2s infinite;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}
