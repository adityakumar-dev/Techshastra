import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Database } from '../supabase/types';

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row'];

export const getEvents = async (): Promise<Event[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }

  return data;
};

export const getEventById = async (id: string): Promise<Event | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
};

export const createEvent = async (event: EventInsert): Promise<Event | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEvent = async (id: string, updates: Partial<EventInsert>): Promise<Event | null> => {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const registerForEvent = async (registration: Database['public']['Tables']['event_registrations']['Insert']) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Backend not configured');
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .insert(registration)
    .select()
    .single();

  if (error) throw error;
  return data;
};
