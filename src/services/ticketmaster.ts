import { EventItem } from '../types';

export interface TicketmasterStatus {
  connected: boolean;
  hasKey: boolean;
  message: string;
}

export async function checkTicketmasterStatus(): Promise<TicketmasterStatus> {
  try {
    const res = await fetch('/api/ticketmaster/status');
    if (!res.ok) {
      return {
        connected: false,
        hasKey: false,
        message: `HTTP ${res.status} from status endpoint`,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      hasKey: false,
      message: err.message || 'Error connecting to Ticketmaster proxy',
    };
  }
}

export async function fetchTicketmasterEvents(params: {
  keyword?: string;
  postalCode?: string;
  city?: string;
  stateCode?: string;
  size?: string;
  page?: number;
  radius?: number;
}): Promise<{ success: boolean; events: EventItem[]; message?: string; page?: number; totalPages?: number }> {
  try {
    const searchParams = new URLSearchParams();
    if (params.keyword) searchParams.set('keyword', params.keyword);
    if (params.postalCode) searchParams.set('postalCode', params.postalCode);
    if (params.city) searchParams.set('city', params.city);
    if (params.stateCode) searchParams.set('stateCode', params.stateCode);
    if (params.size) searchParams.set('size', params.size);
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.radius !== undefined) searchParams.set('radius', String(params.radius));

    const res = await fetch(`/api/ticketmaster/events?${searchParams.toString()}`);
    if (!res.ok) {
      return { success: false, events: [], message: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      success: data.success ?? true,
      events: data.events || [],
      message: data.message,
      page: data.page,
      totalPages: data.totalPages,
    };
  } catch (err: any) {
    console.warn('[Ticketmaster Fetch Error]', err);
    return { success: false, events: [], message: err.message };
  }
}
