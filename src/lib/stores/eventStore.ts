import { createLocalStore, BaseEntity } from '../localStore';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Event extends BaseEntity {
  title: string;
  description: string;
  long_description?: string;
  image_url?: string;
  event_date: string;
  location?: string;
  max_attendees?: number;
  status: EventStatus;
  featured: boolean;
  created_by?: string;
}

const store = createLocalStore<Event>('ts_events');

export const getEvents = async (): Promise<Event[]> => {
  return store.getAll();
};

export const addEvent = async (event: Omit<Event, 'id' | 'created_at'>): Promise<Event> => {
  return store.add(event);
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<void> => {
  const result = store.update(id, updates);
  if (!result) throw new Error('Event not found');
};

export const deleteEvent = async (id: string): Promise<void> => {
  const success = store.delete(id);
  if (!success) throw new Error('Event not found');
};

export const getEventById = (id: string): Event | null => {
  return store.getById(id);
};
