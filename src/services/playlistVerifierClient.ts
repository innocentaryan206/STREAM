export interface VerifiedChannel {
  id: string;
  num: number;
  name: string;
  streamUrl: string;
  logo: string;
  category: string;
  extension: 'm3u8' | 'ts' | 'mp4' | 'mkv' | 'other';
  tvgId?: string;
  tvgName?: string;
  rawExtInf?: string;
  active?: boolean;
  statusCode?: number;
  latencyMs?: number;
  reason?: string;
}

export interface VerificationProgressEvent {
  checked: number;
  total: number;
  percent: number;
  activeCount: number;
  deadCount: number;
  channel: VerifiedChannel;
}

export interface VerificationCompleteEvent {
  totalChannels: number;
  activeCount: number;
  deadCount: number;
  activeRatePercent: number;
  activeM3u: string;
  activeChannels: VerifiedChannel[];
}

export interface VerificationCallbacks {
  onParsed?: (data: { totalChannels: number; categories: string[] }) => void;
  onProgress?: (progress: VerificationProgressEvent) => void;
  onComplete?: (complete: VerificationCompleteEvent) => void;
  onError?: (err: Error) => void;
}

/**
 * Starts real-time stream verification via Server-Sent Events (SSE)
 */
export async function startPlaylistVerification(
  m3uContent: string,
  callbacks: VerificationCallbacks,
  options?: {
    concurrency?: number;
    timeoutMs?: number;
    userAgent?: string;
    referer?: string;
    abortSignal?: AbortSignal;
  }
): Promise<void> {
  const response = await fetch('/api/playlist/verify-live', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      m3uContent,
      concurrency: options?.concurrency || 10,
      timeoutMs: options?.timeoutMs || 3500,
      userAgent: options?.userAgent,
      referer: options?.referer,
    }),
    signal: options?.abortSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Verification service returned HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body stream is not available');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const rawEvent of events) {
      if (!rawEvent.trim()) continue;

      const lines = rawEvent.split('\n');
      let eventType = 'message';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          eventData = line.slice(5).trim();
        }
      }

      if (!eventData) continue;

      try {
        const parsed = JSON.parse(eventData);

        if (eventType === 'parsed' && callbacks.onParsed) {
          callbacks.onParsed(parsed);
        } else if (eventType === 'progress' && callbacks.onProgress) {
          callbacks.onProgress(parsed);
        } else if (eventType === 'complete' && callbacks.onComplete) {
          callbacks.onComplete(parsed);
        } else if (eventType === 'error') {
          throw new Error(parsed.error || 'Stream verification failed');
        }
      } catch (e: any) {
        if (eventType === 'error' && callbacks.onError) {
          callbacks.onError(e);
        }
      }
    }
  }
}

/**
 * Downloads the active M3U file directly to user device
 */
export function downloadActiveM3uFile(content: string, filename = 'active_playlist.m3u') {
  const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.m3u') ? filename : `${filename}.m3u`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
