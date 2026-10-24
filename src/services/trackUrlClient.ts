export interface TrackUrlSummary {
  id: string;
  slug: string;
  name: string;
  channelCount: number;
  validityType: 'permanent' | 'timed';
  durationHours: number | null;
  expiresAt: number | null;
  isExpired: boolean;
  createdAt: number;
  totalClicks: number;
  deviceCounts: Record<string, number>;
  shortUrl: string;
  m3uUrl: string;
}

export interface TrackUrlDetailedStats {
  id: string;
  slug: string;
  name: string;
  channelCount: number;
  validityType: 'permanent' | 'timed';
  durationHours: number | null;
  expiresAt: number | null;
  isExpired: boolean;
  createdAt: number;
  totalClicks: number;
  uniqueVisitors: number;
  shortUrl: string;
  m3uUrl: string;
  deviceBreakdown: Record<string, number>;
  clientBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  recentClicks: Array<{
    id: string;
    timestamp: number;
    deviceType: string;
    clientName: string;
    os: string;
    maskedIp: string;
  }>;
}

export interface CreateTrackUrlPayload {
  name?: string;
  m3uContent: string;
  customSlug?: string;
  validityType: 'permanent' | 'timed';
  durationHours?: number;
}

/**
 * Creates a new Track URL with M3U payload, validity, and optional custom slug
 */
export async function createTrackUrl(payload: CreateTrackUrlPayload): Promise<{
  id: string;
  slug: string;
  name: string;
  channelCount: number;
  validityType: 'permanent' | 'timed';
  expiresAt: number | null;
  createdAt: number;
  totalClicks: number;
  shortUrl: string;
  m3uUrl: string;
}> {
  const res = await fetch('/api/track-url/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to create Track URL');
  }

  return data.data;
}

/**
 * Fetches all created Track URLs
 */
export async function fetchAllTrackUrls(): Promise<TrackUrlSummary[]> {
  const res = await fetch('/api/track-url/list');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to list Track URLs');
  }
  return data.data || [];
}

/**
 * Fetches detailed analytics for a single Track URL
 */
export async function fetchTrackUrlStats(idOrSlug: string): Promise<TrackUrlDetailedStats> {
  const res = await fetch(`/api/track-url/stats/${encodeURIComponent(idOrSlug)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch Track URL stats');
  }
  return data.data;
}

/**
 * Deletes a Track URL
 */
export async function deleteTrackUrl(idOrSlug: string): Promise<boolean> {
  const res = await fetch(`/api/track-url/${encodeURIComponent(idOrSlug)}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete Track URL');
  }
  return true;
}

/**
 * Simulates a click for testing in dev preview
 */
export async function simulateTrackClick(
  slug: string,
  simulatedDevice?: string,
  simulatedClient?: string
): Promise<any> {
  const res = await fetch('/api/track-url/simulate-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, simulatedDevice, simulatedClient }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to simulate click');
  }
  return data;
}
