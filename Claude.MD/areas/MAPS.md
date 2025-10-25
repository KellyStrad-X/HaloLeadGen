# Maps & Geocoding

The application has three distinct map implementations serving different purposes. All maps use Google Maps JavaScript API with the `@vis.gl/react-google-maps` wrapper.

---

## Map Implementations

### 1. Campaign Map

**File**: `components/CampaignMap.tsx`

**Purpose**: Show leads for a specific campaign

**Used In**: Campaign Details Modal

**Features**:
- Displays markers for all leads in a campaign
- Geocodes lead addresses server-side
- Marker click shows lead info popup
- Centers map on campaign address

**Data Source**: Leads array passed as prop

**Geocoding**: On-demand via `lib/geocoding.ts`

---

### 2. Halo Map

**File**: `components/HaloMap.tsx`

**Purpose**: Dashboard overview showing all campaigns

**Used In**: Dashboard Overview Tab

**Features**:
- Shows all campaigns for a contractor
- Displays campaign locations (based on `showcaseAddress`)
- Color-coded by campaign status (Active = cyan, Inactive = gray)
- Marker click opens campaign details modal
- Obfuscates completed job locations for privacy

**Data Source**: Campaigns array from dashboard

**Geocoding**: Uses cached `geocodedLocation` field in campaign documents

---

### 3. Landing Page Map Modal

**File**: `components/MapModal.tsx`

**Purpose**: Show homeowners the service area

**Used In**: Public campaign landing pages (`/c/[slug]`)

**Features**:
- Displays service radius circle around campaign location
- Shows campaign marker
- No lead data (privacy)
- Opens in modal from "View Service Area" button

**Data Source**: Campaign `showcaseAddress`

**Geocoding**: Client-side via Google Maps Geocoding API

---

## Geocoding Strategy

### Server-Side Geocoding (Preferred)

**File**: `lib/geocoding.ts`

**Usage**:
```typescript
import { geocodeAddress } from '@/lib/geocoding';

const location = await geocodeAddress('123 Main St, City, State');
// Returns: { lat: 40.7128, lng: -74.0060 } or null
```

**Benefits**:
- Protects API key (server-side only)
- Can be cached in Firestore
- Rate limits easier to manage
- More secure

**Environment Variable**: `GOOGLE_MAPS_API_KEY` (server-side)

### Client-Side Geocoding (Limited Use)

**Used Only In**: Landing Page Map Modal (public pages)

**Environment Variable**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Reason**: Landing pages are public, can't make server-side calls

---

## Geocoding Caching

### Campaign Locations

Campaign addresses are geocoded once and cached:

**Field**: `campaign.geocodedLocation: { lat: number; lng: number }`

**Process**:
1. Campaign created with `showcaseAddress`
2. Background job (or on-demand) geocodes address
3. Result stored in campaign document
4. Halo Map uses cached location
5. No repeated API calls

### Lead Locations

Lead addresses are geocoded on-demand:

**Process**:
1. Lead submitted with address
2. When viewing lead map, address geocoded
3. Result can be cached in lead document
4. Future map views use cached location

**Field**: `lead.geocodedLocation: { lat: number; lng: number }` (optional)

---

## Map Component Patterns

### Basic Map Setup

```typescript
import { Map, Marker } from '@vis.gl/react-google-maps';

export default function MyMap({ locations }) {
  return (
    <Map
      defaultCenter={{ lat: 40.7128, lng: -74.0060 }}
      defaultZoom={12}
      mapId="YOUR_MAP_ID"  // For styling
      style={{ width: '100%', height: '400px' }}
    >
      {locations.map(loc => (
        <Marker
          key={loc.id}
          position={{ lat: loc.lat, lng: loc.lng }}
          onClick={() => handleClick(loc)}
        />
      ))}
    </Map>
  );
}
```

### Dynamic Center & Zoom

```typescript
const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
const [mapZoom, setMapZoom] = useState(12);

// Update center when data changes
useEffect(() => {
  if (locations.length > 0) {
    const bounds = calculateBounds(locations);
    setMapCenter(bounds.center);
    setMapZoom(bounds.zoom);
  }
}, [locations]);
```

### Custom Marker Icons

```typescript
<Marker
  position={position}
  icon={{
    url: '/marker-icon.png',
    scaledSize: { width: 32, height: 32 },
  }}
/>
```

### Info Windows

```typescript
const [selectedMarker, setSelectedMarker] = useState(null);

return (
  <Map>
    {markers.map(marker => (
      <Marker
        key={marker.id}
        position={marker.position}
        onClick={() => setSelectedMarker(marker)}
      />
    ))}

    {selectedMarker && (
      <InfoWindow
        position={selectedMarker.position}
        onCloseClick={() => setSelectedMarker(null)}
      >
        <div>{selectedMarker.name}</div>
      </InfoWindow>
    )}
  </Map>
);
```

---

## Privacy Considerations

### Obfuscating Completed Jobs

**Halo Map** obfuscates completed job locations to protect homeowner privacy:

**Pattern**:
```typescript
// Don't show exact completed job locations
if (job.status === 'completed') {
  // Offset location slightly or use campaign address instead
  location = campaign.geocodedLocation;
} else {
  location = job.geocodedLocation;
}
```

**Reason**: Completed jobs are visible to all contractors (for showcasing work), so exact addresses should not be displayed.

### Lead Address Privacy

Lead addresses should only be visible to the campaign owner:

**API Protection**:
```typescript
// Verify contractor owns campaign before showing lead locations
if (lead.campaignId !== contractorCampaignId) {
  throw new Error('Unauthorized');
}
```

---

## Map Styling

### Map ID

Maps use a custom Map ID for consistent styling:

**Dark Theme**: Configured in Google Cloud Console

**Environment Variable**: Referenced in Map component

### Custom Styles

Alternative to Map ID, you can pass styles directly:

```typescript
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }]
  },
  // ... more styles
];

<Map
  styles={mapStyles}
  // ...
/>
```

---

## Common Tasks

### Adding Geocoding to a Component

```typescript
import { geocodeAddress } from '@/lib/geocoding';

const [location, setLocation] = useState(null);

useEffect(() => {
  async function fetchLocation() {
    const result = await geocodeAddress(address);
    setLocation(result);
  }
  fetchLocation();
}, [address]);
```

### Caching Geocoded Location

```typescript
// After geocoding, save to Firestore
const location = await geocodeAddress(address);

if (location) {
  await updateDoc(doc(db, 'leads', leadId), {
    geocodedLocation: location
  });
}
```

### Calculating Map Bounds

```typescript
function calculateBounds(locations) {
  if (locations.length === 0) return null;

  const bounds = {
    north: Math.max(...locations.map(l => l.lat)),
    south: Math.min(...locations.map(l => l.lat)),
    east: Math.max(...locations.map(l => l.lng)),
    west: Math.min(...locations.map(l => l.lng)),
  };

  const center = {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2,
  };

  return { center, bounds };
}
```

---

## Troubleshooting

### "Map failed to load"

**Cause**: API key not configured or invalid

**Fix**: Check environment variables:
- `GOOGLE_MAPS_API_KEY` (server-side)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side)

### Geocoding Returns Null

**Causes**:
- Invalid address format
- Address doesn't exist
- API quota exceeded
- Network error

**Fix**: Always handle null results gracefully:
```typescript
const location = await geocodeAddress(address);
if (!location) {
  // Show address as text instead
  // Or use default location
}
```

### Markers Not Appearing

**Causes**:
- Incorrect position format (should be `{ lat, lng }`)
- Positions outside map bounds
- Map not fully loaded

**Fix**: Ensure proper data format and wait for map load

---

## Related Guides

- [CAMPAIGNS.md](./CAMPAIGNS.md) - Campaign addresses
- [LEADS.md](./LEADS.md) - Lead addresses
- [DASHBOARD.md](./DASHBOARD.md) - Halo Map integration
